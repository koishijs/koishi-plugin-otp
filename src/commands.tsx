import { h, type Channel, type Command, type Context, type Session, type User, Element } from 'koishi'
import { } from 'koishi-plugin-qrcode-service'

import type { Config } from '.'
import {
  type OTPDatabase,
  VariantCommandError as VariantError,
  VariantCommandTranslationKey as VariantTranslationKey,
  Method as OTPMethod
} from './types'

import { ErrorMessage, cihper, extractErrorMessage, raise } from './utils'


declare module 'koishi' {
  interface Tables {
    otp: OTPDatabase
  }
}

const otpMethods = [OTPMethod.TOTP, OTPMethod.HOTP]

export const using = ['database', 'otp']
export function apply(ctx: Context, options: Config) {
  ctx.model.extend('otp', {
    id: 'unsigned',
    bid: 'unsigned',
    name: 'string',
    token: 'text',
    method: 'string', // totp | hotp
    threshold: {
      type: 'integer',
      initial: 0
    },
    algorithm: 'string',
    digits: 'integer',
    counter: 'integer',
    period: 'integer',
    initial: 'integer',
    created_at: 'date',
    updated_at: 'date',
  }, {
    primary: ['id'],
    // unique: ['name', 'token'],
  })

  const cmd = withPublicOption(ctx.command('otp [name]'))
    .userFields(['id'])
    .usage('列出用户保存的某个或所有密码')
    .action(extractErrorMessage(async (input) => {
      const session = input.session ?? raise(ErrorMessage, VariantError.ContextNotFound)
      const bid = session.user?.id ?? raise(ErrorMessage, session.text(VariantError.UserNotFound))

      const [name] = input.args ?? []

      const otp = await read(ctx, session, { bid, name, public: input.options?.public })

      if (!otp.length) {
        return <i18n path={name ? VariantError.FoundNoTokenNamedAs : VariantError.FoundNoToken}>{name}</i18n>
      }

      const codes = await Promise.all(otp.map(async otp => {
        const { method, algorithm, digits, counter, period, initial } = otp
        if (period === undefined || counter === undefined || initial === undefined) return raise(ErrorMessage, session.text(VariantError.MissingRequired))

        const code = await ctx.otp.generate(method, {
          secret: cihper(options.salt, options.algorithm).decrypt(otp.token), // decrypt token
          algorithm, digits, counter, period, initial
        })
          .then(coder => ({
            name: otp.name,
            code: coder.toString()
          }))
        return code
      }))

      return <>
        <i18n path={VariantTranslationKey.OTPResults}>
          {codes.length}
        </i18n>
        {codes.map(otp => <OTP otp={otp} key={otp.name} />)}
      </>
    }))

  const otpAddCommand = withPublicOption(withForceOption(cmd.subcommand('.add <name> <token>')))
    .userFields(['id'])
    .usage('添加、更新（覆盖）令牌')
    .option('method', '-m <method>', { fallback: OTPMethod.TOTP })
    .action(extractErrorMessage(async (input) => {
      const session = input.session ?? raise(ErrorMessage, VariantError.ContextNotFound)
      const bid = input.session?.user?.id ?? raise(ErrorMessage, session.text(VariantError.UserNotFound))
      const [
        name = raise(ErrorMessage, VariantError.RequireName),
        token = raise(ErrorMessage, VariantError.RequireToken)
      ] = input.args ?? []

      const { public: pub, force, method } = input.options ?? {};
      const { maxStep, salt, algorithm } = options

      otpMethods.includes(method) || raise(ErrorMessage, session.text(VariantError.MethodNotSupported, [method]))

      const overwritten = await save(ctx, session, { algorithm, bid, name, token, public: pub, force, method, maxStep, salt })
      return (overwritten.length
        ? <>
          <p>translation: {VariantTranslationKey.SucceedReturnOldTokens}</p>
          {overwritten.map(row => <ReturnToken row={row} key={row.id} />)}
        </>
        : <i18n path={VariantTranslationKey.Succeed}></i18n>)
    }))

  ctx.using(['qrcode'], (ctx) => {
    if (!options.qrcode) return
    withPublicOption(withForceOption(cmd.subcommand('.qrcode <image>')))
      .userFields(['id'])
      .usage('通过二维码添加、（覆盖）令牌')
      .action(extractErrorMessage(async (input) => {
        const session = input.session ?? raise(ErrorMessage, VariantError.ContextNotFound)

        const imgUrl = await new Promise<string>((resolve, reject) => {
          h('', h.transform(h.parse(input.args?.[0] ?? raise(ErrorMessage, VariantError.QRCodeNotFound)), {
            image(attrs) {
              resolve(attrs.url)
              return ''
            }
          })).toString(true)
          reject(VariantError.QRCodeNotFound)
        })

        const options = input.options ?? {}

        const img = await ctx.http.file(imgUrl)
        const { text: qrcoder } = await ctx.qrcode.decode(Buffer.from(img.data))
        const coder = new URL(qrcoder ?? raise(ErrorMessage, VariantError.QRCodeNotFound))
        coder.protocol === 'otpauth:' || raise(ErrorMessage, VariantError.InvalidQRCode)

        const method = coder.hostname || OTPMethod.TOTP
        const name = coder.searchParams.get('issuer') ?? coder.pathname.replace(/^\//, '')
        const token = coder.searchParams.get('secret')

        return (
          name && token && otpAddCommand.execute({ session, options: { ...options, method }, args: [name, token] })
          || undefined
        )
      }))
  })


  withPublicOption(cmd.subcommand('.rm <name>'))
    .userFields(['id'])
    .usage('移除令牌')
    .action(extractErrorMessage(async input => {
      const session = input.session ?? raise(ErrorMessage, VariantError.ContextNotFound)
      const bid = input.session?.user?.id ?? raise(ErrorMessage, session.text(VariantError.UserNotFound))
      const [name = raise(ErrorMessage, VariantError.RequireName)] = input.args ?? []
      const removed = await remove(ctx, session, { bid, name, public: input.options?.public })

      return <>
        <i18n path={VariantTranslationKey.RemovedTokens} />
        {removed.map(row => <ReturnToken row={row} key={row.id} />)}
      </>
    }))
}

async function remove(ctx: Context, session: Session<never, never>, query: BaseQuery & Name & Partial<Public>) {
  const clashes = await getToken(ctx, query)
  const { bid, name } = query

  switch (true) {
    // no leaks
    case rejectContext(session, query): raise(ErrorMessage, session.text(VariantError.NotInASafeContext))
    case !clashes.length: raise(ErrorMessage, session.text(VariantError.FoundNoToken))
    // TODO check if correct data has been saved
    default: await ctx.database.remove('otp', { bid, name })
  }
  return clashes
}

async function save(ctx: Context, session: Session<never, never>, query: Provided & Method & BaseQuery & Name & Token & Partial<Force> & Partial<Public>) {
  const { bid, name, token, salt, method, algorithm, maxStep, step } = query
  const now = Date.now()
  const confByMethod = method === OTPMethod.TOTP ? { period: step ?? maxStep, initial: Math.floor(now / 1000) }
    : method === OTPMethod.HOTP ? { counter: step ?? maxStep / 10 }
      : {}
  const clashed = await getToken(ctx, { bid, name })


  const row = {
    bid,
    name,
    token: cihper(salt, algorithm).encrypt(token), // use salt to encrypt token
    method,
    updated_at: new Date(now),
    created_at: new Date(now)
  }
  switch (true) {
    // no leaks
    case rejectContext(session, query): raise(ErrorMessage, session.text(VariantError.NotInASafeContext))
    case !name || !token: raise(ErrorMessage, session.text(VariantError.MissingRequired))
    // safe context or with -p, will leak user holding a token now
    case !!clashed.length && !query.force: raise(ErrorMessage, session.text(VariantError.WillOverWriteOldToken))

    // TODO check if correct data has been saved
    case clashed.length && query.force: {
      await ctx.database.set('otp', { bid, name }, row)
      break
    }
    default: {
      await ctx.database.create('otp', { ...row, ...confByMethod })
    }
  }
  return clashed
}

async function read(ctx: Context, session: Session<never, never>, query: BaseQuery & Partial<Name> & Partial<Public>) {
  const { bid, name } = query

  switch (true) {
    // no leak of holding a token
    case rejectContext(session, query): raise(ErrorMessage, session.text(VariantError.NotInASafeContext))

    default: return getToken(ctx, { bid, name })
  }
}

async function getToken(ctx: Context, { bid, name }: BaseQuery & Partial<Name>) {
  return await ctx.database.get('otp', name ? { bid, name } : { bid })
}

function withPublicOption<T1 extends keyof User, T2 extends keyof Channel, T3 extends any[], T4 extends {}>(input: Command<T1, T2, T3, T4>) {
  return input.option('public', '-p')
}
function withForceOption<T1 extends keyof User, T2 extends keyof Channel, T3 extends any[], T4 extends {}>(input: Command<T1, T2, T3, T4>) {
  return input.option('force', '-f')
}

function rejectContext(session: Session<never, never>, { public: pub = false }: Partial<Public> = {}) {
  return !session.isDirect && !pub
}

function ReturnToken(props: { row: OTPDatabase }) {
  // TODO refine returning rows
  return <text>[{props.row.id}] (<i18n path="created-at">{props.row.created_at}</i18n>)
    <i18n path={VariantTranslationKey.Token}>{props.row.token}</i18n>
    <i18n path={VariantTranslationKey.Algo}>{props.row.algorithm}</i18n>
    <i18n path={VariantTranslationKey.Method}>{props.row.method}</i18n>
  </text>
}

function OTP(props: { otp: { name: string, code: any } }) {
  // TODO refine returning rows
  return <text>
    <i18n path={VariantTranslationKey.Name}>{props.otp.name}</i18n>
    <i18n path={VariantTranslationKey.Code}>{props.otp.code}</i18n>
  </text>
}


interface BaseQuery {
  bid: number
}

interface Provided extends Pick<Config, 'salt' | 'algorithm' | 'maxStep'> {
  step?: number
}

interface Name {
  name: string
}

interface Token {
  token: string
}

interface Force {
  force: boolean
}

interface Public {
  public: boolean
}

interface Method {
  method: OTPMethod
}
