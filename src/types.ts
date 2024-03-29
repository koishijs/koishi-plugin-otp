export type Tokenizer = 'uuid' | 'random' | 'timestamp'

export interface OTPDatabase {
  id: number
  bid: number
  name: string
  method: OTPMethod
  token: string
  threshold?: number  // this is for HOTP service
  algorithm: HMACAlgorithm
  digits: number
  counter?: number    // HOTP only
  period?: number     // TOTP only
  initial?: number    // TOTP only
  created_at: Date
  updated_at: Date
}

export enum HMACAlgorithm {
  SHA1 = 'sha1',
  SHA256 = 'sha256',
  SHA512 = 'sha512'
}

export enum PASSAlgorithm {
  AES128ECB = 'aes-128-ecb',
  AES256ECB = 'aes-256-ecb',
}

export interface OTPConfig {
  algorithm?: HMACAlgorithm
  digits?: number
}

export interface TOTPConfig extends OTPConfig {
  period?: number
  initial?: number
}

export interface HOTPConfig extends OTPConfig {
  counter?: number
}

type OTPMap = {
  [Method.TOTP]: TOTPConfig
  [Method.HOTP]: HOTPConfig
}

export type OTPMethod = keyof OTPMap
export type OTPOptions<M extends OTPMethod> = { secret?: string } & OTPMap[M] & OTPConfig

export const enum Method {
  TOTP = 'totp',
  HOTP = 'hotp'
}

export const enum VariantCommandError {
  NotInASafeContext = 'ctx-not-safe',
  UserNotFound = 'user-not-found',
  ContextNotFound = 'context-not-found',
  FoundNoToken = 'no-token-found',
  FoundNoTokenNamedAs = 'no-token-found-named',
  MethodNotSupported = 'command:method-not-supported',
  WillOverWriteOldToken = 'will-overwrite-old-token',
  MissingRequired = 'missing-inputs',
  QRCodeNotFound = 'qr-code-not-found',
  InvalidQRCode = 'invalid-qr-code',
  RequireName = 'require-name-to-be-set',
  RequireToken = 'require-token-to-be-set'
}

export const enum VariantCommandTranslationKey {
  Unknown = 'unknown',
  Succeed = 'succeed',
  SucceedReturnOldTokens = 'succeed-return-old-tokens',
  OTPResults = 'otp-results',
  RemovedTokens = 'removed-tokens',
  Token = 'token',
  Algo = 'algorithm',
  Method = 'method',
  Name = 'name',
  Code = 'code'
}

export const enum VariantServiceError {
  InvalidCounter = 'invalid-counter',
  CounterMustBePositive = 'counter-must-be-positive',
  CounterMustLessThan = 'counter-must-be-lt-provided',
  RequireSecret = 'require-secret',
  InvalidTokenizer = 'invalid-tokenizer',
  MethodNotSupported = 'service:method-not-supported'
}

export type LanguageKey = VariantCommandError | VariantCommandTranslationKey | VariantServiceError
