import {
  VariantCommandError as CommandError,
  VariantServiceError as ServiceError,
  VariantCommandTranslationKey as CommandTranslationKey,
  type LanguageKey,
} from '../types'
import { PLUGIN_NAME, commandLocaleGen } from '../utils'


const autoComplete: Record<LanguageKey, string> = {
  [CommandError.NotInASafeContext]: '你试图在一个公共环境下暴露 Token。是认真的吗? 使用 `-p` 选项以执行。',
  [CommandError.UserNotFound]: '用户不存在',
  [CommandError.ContextNotFound]: '消息上下文不存在',
  [CommandError.FoundNoToken]: '找不到任何令牌，请先使用 `otp.add` 命令添加令牌。',
  [CommandError.FoundNoTokenNamedAs]: '找不到名为 {0} 的令牌',
  [CommandError.MethodNotSupported]: '尚未支持算法 {0}。',
  [CommandError.WillOverWriteOldToken]: '这将覆盖你的旧令牌，使用 `-f` 选项以确定覆盖。',
  [CommandError.MissingRequired]: '缺少必要的输入。',
  [CommandError.QRCodeNotFound]: '需要一并发送二维码。',
  [CommandError.InvalidQRCode]: '非法的二维码。（提示: 本二维码中的 HTTP Schema 不是添加 OTP 所用的。）',
  [CommandError.RequireName]: '需要提供 <name>',
  [CommandError.RequireToken]: '需要提供 <token>',

  [CommandTranslationKey.OTPResults]: '已保存的一次性密码 ({0} result(s)): ',
  [CommandTranslationKey.Succeed]: '已保存。',
  [CommandTranslationKey.SucceedReturnOldTokens]: '这是您最后一次看到此令牌。如果将来需要此令牌，请立即保存。',
  [CommandTranslationKey.Unknown]: '未知错误。',
  [CommandTranslationKey.RemovedTokens]: '令牌已删除',
  [CommandTranslationKey.Token]: 'Token: {0}',
  [CommandTranslationKey.Algo]: '加密算法: {0}',
  [CommandTranslationKey.Method]: '生成方法: {0}',
  [CommandTranslationKey.Name]: '密码名称: {0}',
  [CommandTranslationKey.Code]: '密码: {0}',

  [ServiceError.InvalidCounter]: '计数失败或这是一个无效的计数器: {0}',
  [ServiceError.CounterMustBePositive]: '计数器必须为正数',
  [ServiceError.CounterMustLessThan]: '计数器必须小于 {0}, 收到 {1}',
  [ServiceError.RequireSecret]: '缺少 Secret',
  [ServiceError.InvalidTokenizer]: '错误的令牌生成方法',
  [ServiceError.MethodNotSupported]: '不支持提供的生成方法 (收到 {0}, 支持 HOTP/TOTP)'
}

const description: Record<string, string> = {
  _name: PLUGIN_NAME,
  _root: '2FA(OTP) 认证令牌服务',
  add: '添加或覆盖认证令牌',
  rm: '移除令牌'
}

const options: Record<keyof typeof description, Record<string, string>> = {
  add: {
    force: '无视安全隐患，覆盖已经保存的 token。在私信环境或“允许在非私信环境下使用”时会返回旧 token。',
    public: '无视安全隐患，允许在非私信环境下使用。',
    method: '生成令牌的方法 当前可用的方法有: totp, hotp'
  }
}

export default {
  commands: commandLocaleGen(description, options),
  ...autoComplete
}
