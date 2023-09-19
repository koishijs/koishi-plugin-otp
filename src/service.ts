
import { createHmac } from 'node:crypto'
import { Context, Service } from 'koishi'
import { } from '@koishijs/plugin-console'
import { } from '@koishijs/plugin-auth'
import {
  type HOTPConfig,
  type OTPMethod,
  type OTPOptions,
  type TOTPConfig,
  type Tokenizer,
  VariantServiceError as VariantError,
  OTPDatabase
} from './types'
import type { Config } from '.'

import { PLUGIN_NAME, raise, ErrorMessageKey, cihper } from './utils'
import { save } from './shared'

declare module 'koishi' {
  interface Context {
    otp: OTPService
  }
}

declare module '@koishijs/plugin-console' {
  interface Events {
    'otp/alive'(): boolean
    'otp/list'(): Promise<OTPDatabase[]>
    'otp/gen'(id: number): Promise<string>
    'otp/edit'(id: number, data: OTPDatabase): Promise<OTPDatabase>
    'otp/remove'(id: number): Promise<void>
  }
}

export class OTPService extends Service {
  static readonly crypto = OTPService.getCrypto()

  constructor(ctx: Context, private config: Config) {
    super(ctx, PLUGIN_NAME)
    
    if(config.manager) ctx.using(['console'], _ => {
      _.console.addListener('otp/alive', () => {
        return !!_.auth
      }, { authority: 4 })

      _.console.addListener('otp/list', async () => 
        await ctx.database.get('otp', {}))

      _.console.addListener('otp/gen', async (id) => {
        const [data] = await ctx.database.get('otp', { id })
        const { method } = data
        const { algorithm, digits, period, initial, counter, token } = data
        return await this.generate(method, {
          algorithm,
          secret: cihper(config.salt).decrypt(token),
          digits,
          period,
          initial,
          counter,
        })
      })
    })
  }

  public createToken(tokenizer: Tokenizer, salt: string) {
    let token: string
    switch (tokenizer) {
      case 'uuid':
        token = OTPService.crypto.randomUUID()
        break
      case 'random':
        token = Math.random().toString(36).slice(2)
        break
      case 'timestamp':
        token = Date.now().toString(36)
        break
      default: raise(ErrorMessageKey, VariantError.InvalidTokenizer, [tokenizer])
    }
    return Buffer.from(token + salt).toString('hex')
  }

  public async generate<M extends OTPMethod>(
    method: M,
    options: OTPOptions<M>
  ) {
    const { algorithm, digits } = options
    let { secret } = options
    let counter: number

    // check secret
    if (!secret) raise(ErrorMessageKey, VariantError.RequireSecret)

    switch (method) {
      case 'totp': {
        const { period, initial } = options as TOTPConfig
        if (!period || !initial) raise(ErrorMessageKey, VariantError.InvalidCounter)
        counter = Math.floor((Date.now() / 1000 - initial) / period)
        break
      }
      case 'hotp': {
        counter = (options as HOTPConfig).counter ?? raise(ErrorMessageKey, VariantError.InvalidCounter)
        break
      }
      default: raise(ErrorMessageKey, VariantError.MethodNotSupported, [method])
    }

    // TODO: the 'sha1' algorithm is unsafe, throw an warning if it is used? or throw an error?
    // in RFC 6238 and RFC 4226 , it is recommended to use 'sha2' (sha256, sha512, etc.) instead of 'sha1'

    // check counter
    if (!counter) raise(ErrorMessageKey, VariantError.InvalidCounter)
    if (counter < 0) raise(ErrorMessageKey, VariantError.CounterMustBePositive)
    if (counter > this.config.maxStep && method === 'hotp') raise(ErrorMessageKey, VariantError.CounterMustLessThan, [this.config.maxStep, counter])
    // if (counter === 0 && method === 'totp') counter = 1
 
    const hmac = createHmac(algorithm || 'sha1', secret)
    hmac.update(Buffer.from(counter.toString(16).padStart(16, '0'), 'hex'))
    const digest = hmac.digest()
    const offset = digest[digest.byteLength - 1] & 0xf
    const code = (digest[offset] & 0x7f) << 24
      | (digest[offset + 1] & 0xff) << 16
      | (digest[offset + 2] & 0xff) << 8
      | (digest[offset + 3] & 0xff)

    return (code % (10 ** (!digits || digits < 6 || digits > 8 ? method === 'totp' ? 6 : 8 : digits))).toString().padStart(digits || 6, '0')
  }

  static getCrypto() {
    return (
      globalThis.crypto // nodejs >= 19: Crypto is a concrete interface, but calling require('crypto') returns an instance of the Crypto class.
      ?? OTPService.NODEJS__tryModule('node:crypto')
      ?? OTPService.NODEJS__tryModule('crypto').webcrypto // nodejs < 19: Crypto is not a concrete interface, but calling require('crypto').webcrypto returns an instance of the Crypto class.
      ?? raise(ReferenceError, '')
    )
  }

  static NODEJS__tryModule(...imp: Parameters<NodeRequire>) {
    try {
      return require(...imp)
    } catch (e) {
      if (e instanceof Error && (e as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND") {
        return null
      }
      throw e
    }
  }
}
