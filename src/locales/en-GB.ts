import {
  VariantCommandError as CommandError,
  VariantServiceError as ServiceError,
  VariantCommandTranslationKey as CommandTranslationKey,
  type LanguageKeys,
} from '../types'
import { PLUGIN_NAME, commandLocaleGen } from '../utils'


const autoComplete: Record<LanguageKeys, string> = {
  [CommandError.NotInASafeContext]: 'Should you use this plugin within private context? Use with `-p` option to overwrite this fail-safe.',
  [CommandError.UserNotFound]: 'User not found',
  [CommandError.ContextNotFound]: 'Chat not found',
  [CommandError.FoundNoToken]: 'Found nothing.',
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
  [CommandTranslationKey.Type]: 'Type',
  [CommandTranslationKey.Name]: 'Name',
  [CommandTranslationKey.Code]: 'Code',

  [ServiceError.InvalidCounter]: 'Invalid Counter',
  [ServiceError.CounterMustBePositive]: 'Counter must be positive',
  [ServiceError.CounterMustLessThan10]: 'Counter must be less than 10',
  [ServiceError.RequireSecret]: 'Secret is required',
}

const description: Record<string, string> = {
  _name: PLUGIN_NAME,
  _root: '2FA One-time Password Service',
  add: 'Add or overwrite a token',
  rm: 'Remove a token'
}

const options: Record<keyof typeof description, Record<string, string>> = {
  add: {
    force: 'Force overwrite old token',
    public: 'Use in public environment',
    method: 'Algorithm [TOTP/HOTP]'
  }
}

export default {
  commands: commandLocaleGen(description, options),
  ...autoComplete
}
