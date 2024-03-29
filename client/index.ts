import { Context } from '@koishijs/client'
import { HOTPConfig, OTPDatabase, OTPMethod, OTPOptions, TOTPConfig, VariantServiceError } from '../src/types'
import { OTPAlgorithm, OTPGenerator } from '../src/shared'
import Page from './page.vue'

declare module '@koishijs/plugin-console' {
  interface Events {
    'otp/alive'(): boolean
    'otp/list'(): Promise<OTPDatabase[]>
    'otp/gen'(id: number): Promise<string>
    'otp/edit'(id: number, data: OTPDatabase): Promise<OTPDatabase>
    'otp/remove'(id: number): Promise<void>
  }
}

export default (ctx: Context) => {
  ctx.page({
    name: 'OTP 认证管理器',
    path: '/otp-manager',
    component: Page,
  })
}

export async function useOTP<M extends OTPMethod>(module: M, options: OTPOptions<M>): Promise<string> {
  const algorMap = {
    'sha1': 'SHA-1',
    'sha256': 'SHA-256',
    'sha512': 'SHA-512'
  }
  const { algorithm, digits } = options
  let { secret } = options
  let counter: number

  // check secret
  if (!secret) throw new Error(VariantServiceError.RequireSecret)

  if (module === 'totp') {
    const { period, initial } = options as TOTPConfig
    counter = Math.floor((Date.now() / 1000 - initial) / period)
  } else if (module === 'hotp') {
    counter = (options as HOTPConfig).counter
  } else {
    throw new Error('unknown module')
  }

  // check counter
  if (counter < 0) throw new Error(VariantServiceError.InvalidCounter)
  if (!counter) throw new Error(VariantServiceError.InvalidCounter)
  if (module === 'hotp' && counter > 10) throw new Error(VariantServiceError.CounterMustLessThan)

  const code = await OTPGenerator(secret, counter, digits, algorMap[algorithm ?? 'sha512'] as OTPAlgorithm)
  console.log(code)
  return code
}
