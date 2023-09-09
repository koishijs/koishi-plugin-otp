import {
  VariantCommandError as CommandError,
  VariantServiceError as ServiceError,
  VariantCommandTranslationKey as CommandTranslationKey,
  type LanguageKey,
} from '../types'
import { PLUGIN_NAME, commandLocaleGen } from '../utils'


const autoComplete: Record<LanguageKey, string> = {
  [CommandError.NotInASafeContext]: 'Should you use this plugin within private context? Use with `-p` option to overwrite this fail-safe.',
  [CommandError.UserNotFound]: 'User not found',
  [CommandError.ContextNotFound]: 'Chat not found',
  [CommandError.FoundNoToken]: 'Found nothing, use `otp.add` to add a token first.',
  [CommandError.FoundNoTokenNamedAs]: 'Found nothing named {0}.',
  [CommandError.MethodNotSupported]: 'Method "{0}" not supported.',
  [CommandError.WillOverWriteOldToken]: 'This operation will overwrite your old token, use with `-f` option to overwrite this fail-safe.',
  [CommandError.MissingRequired]: 'Missing required input(s).',
  [CommandError.QRCodeNotFound]: 'Please send QR Code with this command.',
  [CommandError.InvalidQRCode]: 'Invalid QR Code. (hint: http schema in this qr code is not for adding OTP.)',
  [CommandError.RequireName]: 'Requires <name> to be set.',
  [CommandError.RequireToken]: 'Requires <token> to be set.',

  [CommandTranslationKey.OTPResults]: 'Your otp(s) ({0} result(s)):',
  [CommandTranslationKey.Succeed]: 'Saved.',
  [CommandTranslationKey.SucceedReturnOldTokens]: 'This is the LAST time you will see this token from our side. SAVE IT NOW IF YOU MAY NEED THIS TOKEN IN THE FUTURE.',
  [CommandTranslationKey.Unknown]: 'Unknown',
  [CommandTranslationKey.RemovedTokens]: 'Removed Tokens',
  [CommandTranslationKey.Token]: 'Token',
  [CommandTranslationKey.Algo]: 'Algorithm',
  [CommandTranslationKey.Method]: 'Method (TOTP/HOTP)',
  [CommandTranslationKey.Name]: 'Name',
  [CommandTranslationKey.Code]: 'Code',

  [ServiceError.InvalidCounter]: 'Invalid Counter',
  [ServiceError.CounterMustBePositive]: 'Counter must be positive',
  [ServiceError.CounterMustLessThan]: 'Counter must be less than {0}, given {1}',
  [ServiceError.RequireSecret]: 'Secret is required',
  [ServiceError.InvalidTokenizer]: 'Invalid Tokenizer: {0}',
  [ServiceError.MethodNotSupported]: 'Method not supported.(given {0}, we support HOTP/TOTP)'
}

const description: Record<string, string> = {
  _name: PLUGIN_NAME,
  _root: '2FA One-time Password Service',
  add: 'Add or overwrite a token',
  rm: 'Remove a token'
}

const options: Record<keyof typeof description, Record<string, string>> = {
  add: {
    force: 'Overwrite old token. Will return old token if used in private environment or with `-p` option.',
    public: 'Allow to use this command in public environment.',
    method: 'Method to generate token. Currently supported methods: totp, hotp'
  }
}

export default {
  commands: commandLocaleGen(description, options),
  ...autoComplete
}
