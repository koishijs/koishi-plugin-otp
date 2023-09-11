import {
  VariantCommandError as CommandError,
  VariantServiceError as ServiceError,
  VariantCommandTranslationKey as CommandTranslationKey,
  type LanguageKey,
} from '../types'
import { PLUGIN_NAME, commandLocaleGen } from '../utils'


const autoComplete: Record<LanguageKey, string> = {
  [CommandError.NotInASafeContext]: 'このプラグインはプライベート コンテキスト内で使用する必要がありますか?このフェイルセーフを上書きするには、「-p」オプションとともに使用します。',
  [CommandError.UserNotFound]: 'ユーザーが見つかりません',
  [CommandError.ContextNotFound]: 'チャットが見つかりません',
  [CommandError.FoundNoToken]: '何も見つかりませんでした。最初に `otp.add` を使用してトークンを追加してください。',
  [CommandError.FoundNoTokenNamedAs]: '{0} という名前のトークンが見つかりませんでした。',
  [CommandError.MethodNotSupported]: 'メソッド "{0}" はサポートされていません。',
  [CommandError.WillOverWriteOldToken]: 'この操作は古いトークンを上書きします。このフェイルセーフを上書きするには、「-f」オプションとともに使用します。',
  [CommandError.MissingRequired]: '必要な入力がありません。',
  [CommandError.QRCodeNotFound]: 'このコマンドで QR コードを送信してください。',
  [CommandError.InvalidQRCode]: '無効な QR コードです。 (ヒント: この QR コードの http スキーマは OTP を追加するためのものではありません。)',
  [CommandError.RequireName]: '<name> を設定する必要があります。',
  [CommandError.RequireToken]: '<token> を設定する必要があります。',

  [CommandTranslationKey.OTPResults]: 'あなたの OTP ({0} result(s)):',
  [CommandTranslationKey.Succeed]: '保存されました。',
  [CommandTranslationKey.SucceedReturnOldTokens]: 'これは、最後にこのトークンを私たちから見ることになるでしょう。将来このトークンが必要になる場合は、今すぐ保存してください。',
  [CommandTranslationKey.Unknown]: '不明なエラー。',
  [CommandTranslationKey.RemovedTokens]: '削除されたトークン',
  [CommandTranslationKey.Token]: 'トークン: {0}',
  [CommandTranslationKey.Algo]: 'アルゴリズム: {0}',
  [CommandTranslationKey.Method]: 'メソッド (TOTP/HOTP): {0}',
  [CommandTranslationKey.Name]: '名前: {0}',
  [CommandTranslationKey.Code]: 'コード: {0}',

  [ServiceError.InvalidCounter]: '無効なカウンター',
  [ServiceError.CounterMustBePositive]: 'カウンターは正でなければなりません',
  [ServiceError.CounterMustLessThan]: 'カウンターは {0} より小さくなければなりません。 {1} を受け取りました',
  [ServiceError.RequireSecret]: '秘密が必要です',
  [ServiceError.InvalidTokenizer]: '無効なトークン生成方法: {0}',
  [ServiceError.MethodNotSupported]: 'メソッドはサポートされていません。(受信 {0}, 私たちは HOTP/TOTP をサポートしています)'
}

const description: Record<string, string> = {
  _name: PLUGIN_NAME,
  _root: '2FA(OTP) 認証トークンサービス',
  add: 'トークンを追加または上書きします',
  rm: 'トークンを削除します'
}

const options: Record<keyof typeof description, Record<string, string>> = {
  add: {
    force: '古いトークンを上書きします。プライベート環境で使用するか、`-p` オプションで使用すると、古いトークンが返されます。',
    public: '公共環境でこのコマンドを使用することを許可します。',
    method: 'トークンを生成する方法。現在サポートされている方法: totp, hotp'
  }
}

export default {
  commands: commandLocaleGen(description, options),
  ...autoComplete
}
