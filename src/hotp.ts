import { createHmac } from "node:crypto"

export enum HMACAlgorithm {
  SHA1 = 'sha1',
  SHA256 = 'sha256',
  SHA512 = 'sha512'
}

export interface HOTPConfig {
  algorithm: HMACAlgorithm
  digits: number
  counter: number
}

export function HOTP(secret: any, config: HOTPConfig) {
  const { algorithm, digits, counter } = config
  const hmac = createHmac(algorithm, secret)
  hmac.update(Buffer.from(counter.toString(16).padStart(16, '0'), 'hex'))
  const digest = hmac.digest()
  const offset = digest[digest.length - 1] & 0xf
  const code = (digest[offset] & 0x7f) << 24
    | (digest[offset + 1] & 0xff) << 16
    | (digest[offset + 2] & 0xff) << 8
    | (digest[offset + 3] & 0xff)
  return code % (10 ** digits)
}
