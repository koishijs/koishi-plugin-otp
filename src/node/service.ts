import { Context, Service } from 'koishi'
import { } from '@koishijs/plugin-console'
import { } from '@koishijs/plugin-auth'
import {
  type OTPMethod,
  type OTPOptions,
  OTPDatabase,
  HOTPConfig
} from '../types'
import type { Config } from '..'
import { check } from '../shared'

import { PLUGIN_NAME, cihper } from '../utils'
import { createHmac, digitalCodeGen, tokenizer } from '.'

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
  constructor(ctx: Context, private config: Config) {
    super(ctx, PLUGIN_NAME)

    if (config.manager) ctx.inject(['console'], _ => {
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

  public createToken = tokenizer

  public async generate<M extends OTPMethod>(
    method: M,
    options: OTPOptions<M>
  ) {
    const { algorithm, digits, secret, counter } = check(method, options)
    const digest = createHmac(algorithm, secret)
    return digitalCodeGen(digits, digest, method)
  }

  public async hotp(options: { secret: string } & HOTPConfig) {
    const { algorithm, digits, secret, counter } = check('hotp', options)

  }
}
