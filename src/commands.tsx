import type { Channel, Command, Context, Session, User } from 'koishi'

import { OTPDatabase } from './types'
import { Config } from '.'


export const using = ['database', 'otp']
export function apply(ctx: Context, options: Config) {

  const cmd = withPublicOption(ctx.command('otp [name]'))
    .userFields(['id'])
    .usage('列出用户保存的某个或所有密码')
    .action(async (input) => {
      const session = input.session || raise(Error, VariantError.ContextNotFound)
      const bid = session.user?.id ?? raise(Error, VariantError.UserNotFound)

      const [name] = input.args

      const otp = await read(ctx, session, { bid, name, public: input.options?.public })

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
          token: code
        }
      })

      return <message>
        <i18n path="list-title">
          {codes.map(otp => <p key={otp.name}>${otp.name} - ${otp.token}</p>).join('')}
        </i18n>
      </message>

    })


  withPublicOption(withForceOption(cmd.subcommand('.add <name> <token>')))
    .userFields(['id'])
    .action(async (input) => {
      const bid = input.session?.user?.id ?? raise(Error, VariantError.UserNotFound)
      const [name, token] = input.args
      const { public: _p, force } = input.options ?? {}

      const overwritten = await save(ctx, input.session, mergeConfig(options, { bid, name, token, public: _p, force }))

      return <message>
        <i18n path="succeed-return-old-tokens">
          {overwritten.map(row => <ReturnToken row={row}></ReturnToken>)}
        </i18n>
      </message>
    })


  withPublicOption(cmd.subcommand('.rm <name>'))
    .userFields(['id'])
    .action(async input => {
      const bid = input.session?.user?.id ?? raise(Error, VariantError.UserNotFound)
      const [name] = input.args
      const removed = await remove(ctx, input.session, { bid, name, public: input.options.public })

      return <message>
        <i18n path="removed-tokens" />
        {removed.map(row => <ReturnToken row={row}></ReturnToken>)}
      </message>
    })
}

async function remove(ctx: Context, session: Session, query: BaseQuery & Name & Public) {
  const clashes = await getToken(ctx, query)
  const { bid, name } = query

  const rejectThisContext = rejectContext(session, query)
  switch (true) {
    // no leaks
    case rejectThisContext: raise(Error, VariantError.NotInASafeContext)
    case !clashes.length: raise(Error, VariantError.FoundNoToken)
    // TODO check if correct data has been saved
    default: await ctx.database.remove('otp', { bid, name })
  }
  return clashes
}

async function save(ctx: Context, session: Session, query: Provided & BaseQuery & Name & Token & Force & Public) {
  const lockTime = Date.now()
  const clashed = await getToken(ctx, query)
  const { bid, name, token, salt, tokenizer, threshold, step } = query

  const rejectThisContext = rejectContext(session, query)
  switch (true) {
    // no leaks
    case rejectThisContext: raise(Error, VariantError.NotInASafeContext)
    // safe context or with -p, will leak user holding a token now
    case clashed && !rejectThisContext: raise(Error, VariantError.WillOverWriteOldToken)
    // force but in a group chat, insecure context w/o user explicitly tell us to return token
    case clashed && query.force && session.type !== 'private': raise(Error, VariantError.NotInASafeContext)

    // TODO check if correct data has been saved
    default: await ctx.database.set('otp', { bid, name }, { step, threshold, name, token, updated_at: new Date(lockTime), created_at: new Date(lockTime) })
  }
  return clashed
}

async function read(ctx: Context, session: Session, query: BaseQuery & Name & Public) {
  const { bid, name } = query
  const rejectThisContext = rejectContext(session, query)

  switch (true) {
    // no leak of holding a token
    case rejectThisContext: raise(Error, VariantError.NotInASafeContext)

    default: return await ctx.database.get('otp', { bid, name }, ['name', 'token', 'type', 'algorithm', 'digits', 'counter', 'period', 'initial'])
  }
}

async function getToken(ctx: Context, { bid, name }: BaseQuery & Name) {
  return ctx.database.get('otp', { bid, name })
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
  return session.type !== 'private' && !pub
}


enum VariantError {
  NotInASafeContext = 'should you use this plugin within private context? To overwrite this fail-safe, please use with `-p` option',
  UserNotFound = 'user not found',
  ContextNotFound = 'context not found',
  FoundNoToken = 'did not found any related token',
  WillOverWriteOldToken = 'this operation will overwrite your old token, to overwrite this fail-safe, please use with `-f` option.'
}

function raise<E extends new (...args: any[]) => Error>(Constructor: E, ...args: ConstructorParameters<E>): never {
  throw new Constructor(...args)
}


function ReturnToken(props: { row: OTPDatabase }) {
  // TODO refine returning rows
  return <>
    <text>[{props.row.id}] (<i18n path="created-at">{props.row.created_at}</i18n>)</text>
    <text><i18n path="token">{props.row.token}</i18n></text>
    <text><i18n path="algorithm">{props.row.algorithm}</i18n></text>
    <text><i18n path="type">{props.row.type}</i18n></text>
  </>
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
