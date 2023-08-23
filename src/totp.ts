import { HOTP, HOTPConfig } from './hotp'

export interface TOTPConfig extends HOTPConfig {
  period: number
  initial: number
}

export function TOTP(secret: any, config: TOTPConfig){
  const { period, initial } = config
  const counter = Math.floor((Date.now() / 1000 - initial) / period)
  return HOTP(secret, { ...config, counter })
}
