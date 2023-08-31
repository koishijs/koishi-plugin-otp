import { VariantError } from "../commands"

export default {
  [VariantError.NotInASafeContext]: 'Should you use this plugin within private context? Use with `-p` option to overwrite this fail-safe.',
  [VariantError.UserNotFound]: 'User not found',
  [VariantError.ContextNotFound]: 'Chat not found',
  [VariantError.FoundNoToken]: 'Found nothing.',
  [VariantError.FoundNoTokenNamedAs]: 'Found nothing named {0}.',
  [VariantError.WillOverWriteOldToken]: 'This operation will overwrite your old token, use with `-f` option to overwrite this fail-safe.',
  [VariantError.MissingRequired]: 'Missing required input(s).',
  'otp-results': 'Your otp(s) ({0} result(s)):',
  'succeed-return-old-tokens': 'This is the LAST time you will see this token from our side. SAVE IT NOW IF YOU MAY NEED THIS TOKEN IN THE FUTURE.',
  'succeed': 'Saved.'
}
