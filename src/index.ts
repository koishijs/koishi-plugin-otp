
import { Context, Schema } from 'koishi'

import { OTPService } from "./service"
import * as Commands from './commands'
import { Tokenizer, PASSAlgorithm } from './types'
import enGB from './locales/en-GB'
import zhCN from './locales/zh-CN'

export const usage = `
## 插件说明

提供了一次性密码认证服务，支持 TOTP、HOTP 算法。

最大步长在 TOTP 算法中表示每隔多少秒更新一次密码，HOTP 算法中表示每隔多少次更新一次密码。

密钥盐用于加密令牌与保存的认证令牌，建议使用随机字符串以加强安全性。
`

export interface Config {
  tokenizer: Tokenizer
  salt: string
  qrcode: boolean
  maxStep: number
  maxThreshold: number
  algorithm: PASSAlgorithm
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    tokenizer: Schema.union<Tokenizer>([
      'uuid',
      'random',
      'timestamp']).default('uuid').description('令牌生成方式'),
    salt: Schema.string().role('secret').description('密钥盐（为保证账户安全性，请尽量使用复杂密码）').required(),
    qrcode: Schema.boolean().default(false).description('[⚠ 实验性]是否使用二维码识别（需要 qrcode 服务）'),
  }).description('基础配置'),
  Schema.object({
    maxStep: Schema.number().min(10).max(100).default(30).description('默认允许的最大步长'),
    maxThreshold: Schema.number().min(3).max(10).default(5).description('默认允许的最大重试步数'),
    algorithm: Schema.union([PASSAlgorithm.AES128ECB, PASSAlgorithm.AES256ECB]).default(PASSAlgorithm.AES128ECB).description('存储算法'),
  }).description('安全性配置'),
  Schema.union([
    Schema.object({
      qrcode: Schema.const(true).required(),
    }).description('二维码配置'),
    Schema.object({})
  ]),
])
export function apply(ctx: Context, opt: Config) {
  ctx.plugin(OTPService, opt)
  ctx.plugin(Commands, opt)

  ctx.i18n.define('zh-CN', zhCN)
  ctx.i18n.define('en-GB', enGB)
  ctx.i18n.define('en-US', enGB)
}
