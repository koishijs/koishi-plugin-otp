import {
  VariantCommandError as CommandError,
  VariantServiceError as ServiceError,
  VariantCommandTranslationKey as CommandTranslationKey,
  LanguageKeys,
} from '../types'


const autoComplete: Record<LanguageKeys, string> = {
  [CommandError.NotInASafeContext]: 'Should you use this plugin within private context? Use with `-p` option to overwrite this fail-safe.',
  [CommandError.UserNotFound]: 'User not found',
  [CommandError.ContextNotFound]: 'Chat not found',
  [CommandError.FoundNoToken]: 'Found nothing.',
  [CommandError.FoundNoTokenNamedAs]: 'Found nothing named {0}.',
  [CommandError.WillOverWriteOldToken]: 'This operation will overwrite your old token, use with `-f` option to overwrite this fail-safe.',
  [CommandError.MissingRequired]: 'Missing required input(s).',

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
  [ServiceError.CounterMustLessThan10]: 'Counter must be less than 10'
}


export default autoComplete
