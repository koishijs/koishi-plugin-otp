import {
  VariantCommandError as CommandError,
  VariantServiceError as ServiceError,
  VariantCommandTranslationKey as CommandTranslationKey,
  type LanguageKeys,
} from '../types'
import { PLUGIN_NAME, commandLocaleGen } from '../utils'


const autoComplete: Record<LanguageKeys, string> = {
  [CommandError.NotInASafeContext]: '请在私聊中使用。使用 `-p` 选项以覆盖此安全检查。',
  [CommandError.UserNotFound]: '用户不存在',
  [CommandError.ContextNotFound]: '消息不存在',
  [CommandError.FoundNoToken]: 'Token 不存在',
  [CommandError.FoundNoTokenNamedAs]: '找不到名称 {0}.',
  [CommandError.FailMethod]: '错误的算法类型。',
  [CommandError.WillOverWriteOldToken]: '这将覆盖你的旧 Token ，使用 `-f` 选项以覆盖此安全检查。',
  [CommandError.MissingRequired]: '缺少必要的输入。',

  [CommandTranslationKey.OTPResults]: '已保存的一次性密码 ({0} result(s)): ',
  [CommandTranslationKey.Succeed]: '已保存。',
  [CommandTranslationKey.SucceedReturnOldTokens]: '这是您最后一次看到此令牌。如果将来需要此令牌，请立即保存。',
  [CommandTranslationKey.Unknown]: '未知错误。',
  [CommandTranslationKey.RemovedTokens]: 'Token 已删除',
  [CommandTranslationKey.Token]: 'Token',
  [CommandTranslationKey.Algo]: '加密算法',
  [CommandTranslationKey.Type]: '类型 (TOTP/HOTP)',
  [CommandTranslationKey.Name]: '密码名称',
  [CommandTranslationKey.Code]: '密码',

  [ServiceError.InvalidCounter]: '计数失败或这是一个无效的计数器',
  [ServiceError.CounterMustBePositive]: '计数器必须为正数',
  [ServiceError.CounterMustLessThan10]: '计数器必须小于 10',
  [ServiceError.RequireSecret]: '缺少 Secret'
}

const description: Record<string, string> = {
  _name: PLUGIN_NAME,
  _root: '2FA(OTP) 认证令牌服务',
  add: '添加或覆盖认证令牌',
  rm: '移除令牌'
}

const options: Record<keyof typeof description, Record<string, string>> = {
  add: {
    force: '强制覆盖旧令牌',
    public: '在公开环境中使用',
    method: '算法 [TOTP/HOTP]'
  }
}

export default {
  commands: commandLocaleGen(description, options),
  ...autoComplete
}
