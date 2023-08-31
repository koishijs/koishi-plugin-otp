import { Context, Schema, Service } from 'koishi'
import { HOTPConfig, OTPDatabase, OTPModule, OTPOptions, TOTPConfig, Tokenizer } from './types'
import { createHmac } from 'node:crypto'
import * as koishiPluginOTPCmd from './commands'

declare module 'koishi' {

  interface Tables {
    otp: OTPDatabase
  }

  interface Context {
    otp: OTPService
  }
}

export class OTPService extends Service {
  readonly using = ['database']

  readonly crypto = globalThis.crypto ?? require('node:crypto')

  constructor(ctx: Context, private config: OTPService.Config) {
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
      unique: ['token'],
    })

    // ctx.plugin(OTPClient, config)
    ctx.plugin(koishiPluginOTPCmd, config)
  }

  public createToken(tokenizer: Tokenizer, salt: string) {
    let token: string
    switch (tokenizer) {
      case 'uuid':
        token = this.crypto.randomUUID()
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
    if (!counter) throw new Error('invalid counter')
    if (counter < 0) throw new Error('counter must be positive')
    if (counter > 10) throw new Error('counter must be less than 10')

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
}

export namespace OTPService {
  export const usage = `
## 插件说明

提供了一次性密码认证服务，支持 TOTP、HOTP 算法。

最大步长在 TOTP 算法中表示每隔多少秒更新一次密码，HOTP 算法中表示每隔多少次更新一次密码。
`

  export interface Config {
    tokenizer: Tokenizer
    salt: string
    maxStep: number
    maxThreshold: number
  }

  export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
      tokenizer: Schema.union<Tokenizer>([
        'uuid',
        'random',
        'timestamp']).default('uuid').description('令牌生成方式'),
      salt: Schema.string().description('令牌生成盐').required(),
    }).description('基础配置'),
    Schema.object({
      maxStep: Schema.number().min(5).default(30).description('默认允许的最大步长'),
      maxThreshold: Schema.number().min(3).max(10).default(5).description('默认允许的最大重试步数'),
    }).description('安全性配置'),
  ])
}

export default OTPService
