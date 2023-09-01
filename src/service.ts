import { Context, Service } from 'koishi'
import {
  type HOTPConfig,
  type OTPDatabase,
  type OTPModule,
  type OTPOptions,
  type TOTPConfig,
  type Tokenizer,
  VariantServiceError as VariantError
} from './types'
import { createHmac } from 'node:crypto'
import { Config } from '.'
import { raise } from './utils'


declare module 'koishi' {

  interface Tables {
    otp: OTPDatabase
  }

  interface Context {
    otp: OTPService
  }
}

export class OTPService extends Service {
  static readonly crypto = OTPService.getCrypto()

  constructor(ctx: Context, private config: Config) {
    super(ctx, 'otp')
    ctx.model.extend('otp', {
      id: 'unsigned',
      bid: 'unsigned',
      name: 'string',
      token: 'text',
      type: 'string', // totp | hotp
      step: {
        type: 'integer',
        initial: config.maxStep
      },
      threshold: {
        type: 'integer',
        initial: config.maxThreshold
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
    }
    return Buffer.from(token + salt).toString('hex')
  }

  public async generate<M extends OTPModule>(
    module: M,
    options: OTPOptions<M>
  ) {
    const { algorithm, digits } = options
    let { secret } = options
    let counter: number

    // check secret
    if (!secret) throw new Error('secret is required')

    if (module === 'totp') {
      const { period, initial } = options as TOTPConfig
      counter = Math.floor((Date.now() / 1000 - initial) / period)
    } else if (module === 'hotp') {
      counter = (options as HOTPConfig).counter
    }

    // check counter
    if (!counter) throw new Error(VariantError.InvalidCounter)
    if (counter < 0) throw new Error(VariantError.CounterMustBePositive)
    if (counter > 10) throw new Error(VariantError.CounterMustLessThan10)

    const hmac = createHmac(algorithm ?? 'sha1', secret)
    hmac.update(Buffer.from(counter.toString(16).padStart(16, '0'), 'hex'))
    const digest = hmac.digest()
    const offset = digest[digest.length - 1] & 0xf
    const code = (digest[offset] & 0x7f) << 24
      | (digest[offset + 1] & 0xff) << 16
      | (digest[offset + 2] & 0xff) << 8
      | (digest[offset + 3] & 0xff)

    return code % (10 ** (digits ?? 6))
  }

  static getCrypto() {
    return (
      globalThis.crypto
      ?? OTPService.NODEJS__tryModule('node:crypto')
      ?? OTPService.NODEJS__tryModule('crypto')
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
    }
  }
}
