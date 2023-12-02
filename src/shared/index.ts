import {
  type HOTPConfig,
  type OTPMethod,
  type OTPOptions,
  type TOTPConfig,
  type Tokenizer,
  VariantServiceError as VariantError,
} from '../types'
import { ErrorMessageKey, raise } from "../utils";

export function check<M extends OTPMethod>(method: M, options: OTPOptions<M>) {
  const { algorithm, digits } = options
  let { secret } = options
  let counter: number

  if (!secret) raise(ErrorMessageKey, VariantError.RequireSecret)
  if (!algorithm) raise(ErrorMessageKey, VariantError.RequireAlgorithm)
  if (!digits) raise(ErrorMessageKey, VariantError.RequireDigits)

  switch (method) {
    case 'totp': {
      const { period, initial } = options as TOTPConfig
      if (!period || !initial) throw 42
      counter = Math.floor((Date.now() / 1000 - initial) / period)
      break
    }
    case 'hotp': {
      counter = (options as HOTPConfig).counter ?? raise(ErrorMessageKey, VariantError.InvalidCounter)
      break
    }
    default: raise(ErrorMessageKey, VariantError.MethodNotSupported, [method])
  }

  // check counter
  if (!counter) raise(ErrorMessageKey, VariantError.InvalidCounter)
  if (counter < 0) raise(ErrorMessageKey, VariantError.CounterMustBePositive)
  if (counter > this.config.maxStep && method === 'hotp') raise(ErrorMessageKey, VariantError.CounterMustLessThan, [this.config.maxStep, counter])

  return {
    algorithm,
    digits,
    secret,
    counter,
  }
}

export function randomUUID(): string {
  const uuid = crypto.randomUUID()
  return uuid
}
