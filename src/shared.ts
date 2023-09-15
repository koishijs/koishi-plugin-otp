export type OTPAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512'

export async function OTPGenerator(key: string,
	counter: number,
	digits: number = 6,
	algorithm: OTPAlgorithm = 'SHA-512'
): Promise<string> {
	const encoder = new TextEncoder(), K = encoder.encode(key), C = encoder.encode(counter.toString(16).padStart(16, '0'))
	const name = 'HMAC', hash = algorithm

	const keygen = await crypto.subtle.importKey('raw', K, { name, hash }, false, ['sign'])
	const digest = await crypto.subtle.sign({ name, hash }, keygen, C)
	const offset = digest[digest.byteLength - 1] & 0xf
	console.log(digest.byteLength)
	const code = (digest[offset] & 0x7f) << 24
		| (digest[offset + 1] & 0xff) << 16
		| (digest[offset + 2] & 0xff) << 8
		| (digest[offset + 3] & 0xff)

	return (code % (10 ** digits)).toString().padStart(digits, '0')
}
