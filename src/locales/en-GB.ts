import { VariantError } from "../commands"

export default {
  [VariantError.NotInASafeContext]: 'should you use this plugin within private context? Use with `-p` option to overwrite this fail-safe.',
  [VariantError.UserNotFound]: 'User not found',
  [VariantError.ContextNotFound]: 'Chat not found',
  [VariantError.FoundNoToken]: 'Found nothing.',
  [VariantError.FoundNoTokenNamedAs]: 'Found nothing related to {0}.',
  [VariantError.WillOverWriteOldToken]: 'This operation will overwrite your old token, use with `-f` option to overwrite this fail-safe.',
  [VariantError.MissingRequired]: 'missing required inputs',
  'otp-results': 'your otp results ({0} results): {1}',
  'succeed-return-old-tokens': 'This is the last time you will see these token in our side. SAVE IT IF IT\'S STILL IMPORTANT TO YOU.',
  'succeed': 'Saved.'
}
