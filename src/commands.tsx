import type { Channel, Command, Context, Session, User } from 'koishi'

import { OTPDatabase } from './types'
import { Config } from '.'
import { extractErrorMessage, raise } from './utils'


export const using = ['database', 'otp']
export function apply(ctx: Context, options: Config) {

  const cmd = withPublicOption(ctx.command('otp [name]'))
    .userFields(['id'])
    .usage('列出用户保存的某个或所有密码')
    .action(extractErrorMessage(async (input) => {
      const session = input.session || raise(ErrorMessage, VariantError.ContextNotFound)
      const bid = session.user?.id ?? raise(ErrorMessage, session.text(VariantError.UserNotFound))

      const [name] = input.args

      const otp = await read(ctx, session, { bid, name, public: input.options?.public })

      if (!otp.length) {
        return <i18n path={name ? VariantError.FoundNoTokenNamedAs : VariantError.FoundNoToken}>{name}</i18n>
      }

      const codes = otp.map(otp => {
        const { type, algorithm, digits, counter, period, initial } = otp
        let code: string
        ctx.otp.generate(type, {
          secret: otp.token,
          algorithm, digits, counter, period, initial
        }).then(coder => code = coder.toString())
          .catch(() => code = 'error')
        return {
          name: otp.name,
          code: code
        }
      })

      return <>
        <i18n path="otp-results">
          {codes.length}
        </i18n>
        {/* {codes.map(otp => <OTP otp={otp}></OTP>)} */}
        {codes.map(otp => <>
          <p>name: {otp.name},</p>
          <p>code: {otp.code}</p>
        </>)}
      </>
    }))


  withPublicOption(withForceOption(cmd.subcommand('.add <name> <token>')))
    .userFields(['id'])
    .usage('添加、更新（覆盖）令牌')
    .action(extractErrorMessage(async (input) => {
      const session = input.session || raise(ErrorMessage, VariantError.ContextNotFound)
      const bid = input.session?.user?.id ?? raise(ErrorMessage, session.text(VariantError.UserNotFound))
      const [name, token] = input.args
      const { public: pub, force } = input.options ?? {}

      const overwritten = await save(ctx, input.session, mergeConfig(options, { bid, name, token, public: pub, force }))
      return (overwritten.length
        ? <>
          <p>translation: "succeed-return-old-tokens"</p>
          {overwritten.map(row =>
            <>
              <p>[{row.name}] ({row.created_at.toLocaleString()})</p>
              <p>  | token: {row.token}</p>
              <p>  | algo: {row.algorithm || 'unknown'}</p>
              <p>  | type: {row.type || 'unknown'}</p>
            </>
          )}
        </>
        : <i18n path="succeed"></i18n>)
    }))


  withPublicOption(cmd.subcommand('.rm <name>'))
    .userFields(['id'])
    .usage('移除令牌')
    .action(extractErrorMessage(async input => {
      const session = input.session || raise(ErrorMessage, VariantError.ContextNotFound)
      const bid = input.session?.user?.id ?? raise(ErrorMessage, session.text(VariantError.UserNotFound))
      const [name] = input.args
      const removed = await remove(ctx, input.session, { bid, name, public: input.options.public })

      return <>
        <i18n path="removed-tokens" />
        {removed.map(row =>
          <>
            <p>[{row.name}] ({row.created_at.toLocaleString()})</p>
            <p>  | token: {row.token}</p>
            <p>  | algo: {row.algorithm || 'unknown'}</p>
            <p>  | type: {row.type || 'unknown'}</p>
          </>
        )}
      </>
    }))
}

async function remove(ctx: Context, session: Session, query: BaseQuery & Name & Public) {
  const clashes = await getToken(ctx, query)
  const { bid, name } = query

  const rejectThisContext = rejectContext(session, query)
  switch (true) {
    // no leaks
    case rejectThisContext: raise(ErrorMessage, session.text(VariantError.NotInASafeContext))
    case !clashes.length: raise(ErrorMessage, session.text(VariantError.FoundNoToken))
    // TODO check if correct data has been saved
    default: await ctx.database.remove('otp', { bid, name })
  }
  return clashes
}

async function save(ctx: Context, session: Session, query: Provided & BaseQuery & Name & Token & Force & Public) {
  const lockTime = Date.now()
  const { bid, name, token, salt, tokenizer, threshold, step } = query
  const clashed = await getToken(ctx, { bid, name })

  const rejectThisContext = rejectContext(session, query)

  const row = { step, threshold, name, token, updated_at: new Date(lockTime), created_at: new Date(lockTime) }
  switch (true) {
    // no leaks
    case rejectThisContext: raise(ErrorMessage, session.text(VariantError.NotInASafeContext))
    case !name || !token: raise(ErrorMessage, session.text(VariantError.MissingRequired))
    // safe context or with -p, will leak user holding a token now
    case !!clashed.length && !query.force: raise(ErrorMessage, session.text(VariantError.WillOverWriteOldToken))

    // TODO check if correct data has been saved
    case clashed.length && query.force: {
      await ctx.database.set('otp', { bid, name }, row)
      break
    }
    default: {
      await ctx.database.create('otp', { ...row, bid })
    }
  }
  return clashed
}

async function read(ctx: Context, session: Session, query: BaseQuery & Name & Public) {
  const { bid, name } = query
  const rejectThisContext = rejectContext(session, query)

  switch (true) {
    // no leak of holding a token
    case rejectThisContext: raise(ErrorMessage, session.text(VariantError.NotInASafeContext))

    default: return getToken(ctx, { bid, name })
  }
}

async function getToken(ctx: Context, { bid, name }: BaseQuery & Name) {
  return await ctx.database.get('otp', name ? { bid, name } : { bid })
}

function withPublicOption<T1 extends keyof User, T2 extends keyof Channel, T3 extends any[], T4>(input: Command<T1, T2, T3, T4>) {
  return input.option('public', '-p 无视安全隐患，允许在非私信环境下使用。')
}
function withForceOption<T1 extends keyof User, T2 extends keyof Channel, T3 extends any[], T4>(input: Command<T1, T2, T3, T4>) {
  return input.option('force', '-f 无视安全隐患，覆盖已经保存的token。在私信环境或“允许在非私信环境下使用”时会返回旧token。')
}


function extractConfig(cfg: Config): Provided {
  return {
    step: cfg.maxStep,
    threshold: cfg.maxStep,
    salt: cfg.salt,
    tokenizer: cfg.tokenizer
  }
}

function mergeConfig<T>(cfg: Config, row: T) {
  return Object.assign(extractConfig(cfg), row)
}

function rejectContext(session: Session, { public: pub = false }: Partial<Public> = {}) {
  return !session.isDirect && !pub
}

function ReturnToken(props: { row: OTPDatabase }) {
  // TODO refine returning rows
  return <text>[{props.row.id}] (<i18n path="created-at">{props.row.created_at}</i18n>)
    <i18n path="token">{props.row.token}</i18n>
    <i18n path="algorithm">{props.row.algorithm}</i18n>
    <i18n path="type">{props.row.type}</i18n>
  </text>
}

function OTP(props: { otp: { name: string, code: any } }) {
  // TODO refine returning rows
  return <text>
    <i18n path="name">{props.otp.name}</i18n>
    <i18n path="code">{props.otp.code}</i18n>
  </text>
}

export const enum VariantError {
  NotInASafeContext = 'ctx-not-safe',
  UserNotFound = 'user-not-found',
  ContextNotFound = 'context-not-found',
  FoundNoToken = 'no-token-found',
  FoundNoTokenNamedAs = 'no-token-found-named',
  WillOverWriteOldToken = 'will-overwrite-old-token',
  MissingRequired = 'missing-inputs'
}

export class ErrorMessage extends Error {
  name = 'Recoverable Error'
}

interface BaseQuery {
  bid: number
}

interface Provided extends Pick<OTPDatabase, 'step' | 'threshold'>, Pick<Config, 'salt' | 'tokenizer'> { }

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
