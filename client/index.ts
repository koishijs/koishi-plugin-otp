import { HOTPConfig, OTPMethod, OTPOptions, TOTPConfig, VariantServiceError } from '../src/types'
import { OTPAlgorithm, OTPGenerator } from '../src/shared'

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
    if (counter < 0) throw new Error(VariantServiceError.CounterMustBePositive)
    if (counter > 10) throw new Error(VariantServiceError.CounterMustLessThan)

    return await OTPGenerator(secret, counter, digits, algorMap[algorithm ?? 'sha512'] as OTPAlgorithm)
}
