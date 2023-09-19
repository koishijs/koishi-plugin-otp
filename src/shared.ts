import { Context, Session } from "koishi"
import { ErrorMessage, cihper, raise } from "./utils"
import {
  VariantCommandError as VariantError,
  Method as OTPMethod
} from './types'
import { Config } from "."

export type OTPAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512'

export async function OTPGenerator(key: string,
	counter: number,
	digits: number = 6,
	algorithm: OTPAlgorithm = 'SHA-512'
): Promise<string> {
	const encoder = new TextEncoder(), K = encoder.encode(key), C = encoder.encode(counter.toString(16).padStart(16, '0'))
	const name = 'HMAC', hash = algorithm

	const keygen = await crypto.subtle.importKey('raw', K, { name, hash }, false, ['sign'])
	const digest = await crypto.subtle.sign({ name, hash }, keygen, C)
	const offset = digest[digest.byteLength - 1] & 0xf
	const code = (digest[offset] & 0x7f) << 24
		| (digest[offset + 1] & 0xff) << 16
		| (digest[offset + 2] & 0xff) << 8
		| (digest[offset + 3] & 0xff)

	return (code % (10 ** digits)).toString().padStart(digits, '0')
}

export async function remove(ctx: Context, session: Session<never, never>, query: BaseQuery & Name & Partial<Public>) {
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

export async function save(ctx: Context, session: Session<never, never>, query: Provided & Method & BaseQuery & Name & Token & Partial<Force> & Partial<Public>) {
  const { bid, name, token, salt, method, pscs, maxStep, step, algorithm } = query
  const now = Date.now()
  const confByMethod = method === OTPMethod.TOTP ? { period: step ?? maxStep, initial: Math.floor(now / 1000) }
    : method === OTPMethod.HOTP ? { counter: step ?? maxStep / 10 }
      : {}
  const clashed = await getToken(ctx, { bid, name })


  const row = {
    bid,
    name,
    token: cihper(salt, pscs).encrypt(token), // use salt to encrypt token
    algorithm,
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

export async function read(ctx: Context, session: Session<never, never>, query: BaseQuery & Partial<Name> & Partial<Public>) {
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

function rejectContext(session: Session<never, never>, { public: pub = false }: Partial<Public> = {}) {
  return !session.isDirect && !pub
}

interface BaseQuery {
  bid: number
}

interface Provided extends Pick<Config, 'salt' | 'pscs' | 'maxStep' | 'algorithm'> {
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
