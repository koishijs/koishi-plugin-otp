export type Tokenizer = 'uuid' | 'random' | 'timestamp'

export interface OTPDatabase {
  id: number
  bid: number
  name: string
  type: OTPModule
  token: string
  step: number
  threshold: number
  algorithm: HMACAlgorithm
  digits: number
  counter?: number
  period?: number
  initial?: number
  created_at: Date
  updated_at: Date
}

export enum HMACAlgorithm {
  SHA1 = 'sha1',
  SHA256 = 'sha256',
  SHA512 = 'sha512'
}

export interface OTPConfig {
  algorithm?: HMACAlgorithm
  digits?: number
}

export interface TOTPConfig extends OTPConfig {
  period: number
  initial: number
}

export interface HOTPConfig extends OTPConfig {
  counter: number
}

type OTPMap = {
  totp: TOTPConfig
  hotp: HOTPConfig
}

export type OTPModule = keyof OTPMap
export type OTPOptions<M extends OTPModule> = { secret?: string } & OTPMap[M] & OTPConfig



export const enum VariantCommandError {
  NotInASafeContext = 'ctx-not-safe',
  UserNotFound = 'user-not-found',
  ContextNotFound = 'context-not-found',
  FoundNoToken = 'no-token-found',
  FoundNoTokenNamedAs = 'no-token-found-named',
  WillOverWriteOldToken = 'will-overwrite-old-token',
  MissingRequired = 'missing-inputs'
}

export const enum VariantCommandTranslationKey {
  Unknown = 'unknown',
  Succeed = 'succeed',
  SucceedReturnOldTokens = 'succeed-return-old-tokens',
  OTPResults = 'otp-results',
  RemovedTokens = 'removed-tokens',
  Token = 'token',
  Algo = 'algorithm',
  Type = 'type',
  Name = 'name',
  Code = 'code'
}

export const enum VariantServiceError {
  InvalidCounter = 'invalid-counter',
  CounterMustBePositive = 'counter-must-be-positive',
  CounterMustLessThan10 = 'counter-must-be-lt-10',
  RequireSecret = 'require-secret'
}

export type LanguageKeys = VariantCommandError | VariantCommandTranslationKey | VariantServiceError
