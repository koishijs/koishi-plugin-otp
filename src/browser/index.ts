import { randomUUID } from "../shared"
import { OTPMethod, Tokenizer, VariantServiceError } from "../types"
import { ErrorMessageKey, raise } from "../utils"

/**
 * Generate a digest via browser api
 */
export async function createHmac(algorithm: string, secret: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const keyBuffer = await crypto.subtle.importKey('raw', encoder.encode(secret), {
    name: 'HMAC', hash: {
      name: algorithm || 'SHA-256'
    }
  }, false, ['sign'])
  const counterBuffer = new Uint8Array(new ArrayBuffer(8))
  return crypto.subtle.sign('HMAC', keyBuffer, counterBuffer)
}

/**
 * Generate a digital code from a digest via browser api
 */
export function digitalCodeGen(digits: number, digest: ArrayBuffer, method: OTPMethod): string {
  const bytes = new Uint8Array(digest)
  const offset = bytes[bytes.length - 1] & 0xf
  const code = ((digest[offset] & 0x7f) * (2 ** 24)) +
    ((digest[offset + 1] & 0xff) * (2 ** 16)) +
    ((digest[offset + 2] & 0xff) * (2 ** 8)) +
    (digest[offset + 3] & 0xff)
  return (code % (10 ** (!digits || digits < 6 || digits > 8 ? method === 'totp' ? 6 : 8 : digits))).toString().padStart(digits || 6, '0')
}

export function tokenizer(mode: Tokenizer, salt: string) {
  let token: string
  switch (mode) {
    case 'uuid':
      token = randomUUID()
      break
    case 'random':
      token = Math.random().toString(36).slice(2)
      break
    case 'timestamp':
      token = Date.now().toString(36)
      break
    default: raise(ErrorMessageKey, VariantServiceError.InvalidTokenizer, [mode])
  }
  return Array.from(new Uint8Array(new TextEncoder().encode(token + salt))
    .reduce((m, i) => m.set(i, (m.get(i) || 0) + 1), new Map<number, number>()))
    .sort((a, b) => b[1] - a[1])
    .map(i => i[0])
    .map(i => i.toString(36))
    .join('')
}
