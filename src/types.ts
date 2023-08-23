export type Tokenizer = 'uuid' | 'random' | 'timestamp'


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

type ConfigMap = {
  totp: TOTPConfig
  hotp: HOTPConfig
}

export type OTPModule = keyof ConfigMap
export type OTPOptions<M extends OTPModule> = { secret?: string } & ConfigMap[M] & OTPConfig
