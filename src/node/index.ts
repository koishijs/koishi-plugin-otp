import _crypto from 'node:crypto'
import { HMACAlgorithm, OTPMethod, Tokenizer, VariantServiceError } from '../types'
import { ErrorMessageKey, raise } from '../utils'

/**
 * Generate a digest via node api
 */
export function createHmac(algorithm: HMACAlgorithm, secret: string): Buffer {
    const hmac = _crypto.createHmac(algorithm, secret)
    return hmac.digest()
}

/**
 * Generate a digital code from a digest via node api
 */
export function digitalCodeGen(digits: number, digest: Buffer, method: OTPMethod): string {
    const offset = digest[digest.byteLength - 1] & 0xf
    const code = (digest[offset] & 0x7f) << 24
        | (digest[offset + 1] & 0xff) << 16
        | (digest[offset + 2] & 0xff) << 8
        | (digest[offset + 3] & 0xff)
    return (code % (10 ** (!digits || digits < 6 || digits > 8 ? method === 'totp' ? 6 : 8 : digits))).toString().padStart(digits || 6, '0')
}

export function tokenizer(mode: Tokenizer, salt: string) {
    let token: string
    switch (mode) {
        case 'uuid':
            token = _crypto.randomUUID()
            break
        case 'random':
            token = Math.random().toString(36).slice(2)
            break
        case 'timestamp':
            token = Date.now().toString(36)
            break
        default: raise(ErrorMessageKey, VariantServiceError.InvalidTokenizer, [mode])
    }
    return Buffer.from(token + salt).toString('hex')
}

export function getCrypto() {
    return (
        // nodejs >= 19: Crypto is a concrete interface, but calling require('crypto') returns an instance of the Crypto class.
        globalThis.crypto
        ?? NODEJS__tryModule('node:crypto')
        // nodejs < 19: Crypto is not a concrete interface, but calling require('crypto').webcrypto returns an instance of the Crypto class.
        ?? NODEJS__tryModule('crypto').webcrypto
        ?? raise(ReferenceError, '')
    )
}

function NODEJS__tryModule(...imp: Parameters<NodeRequire>) {
    try {
        return require(...imp)
    } catch (e) {
        return undefined
    }
}
