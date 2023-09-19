import { Context, Schema } from 'koishi'
import { OTPService } from "./service"
import * as Commands from './commands'
import { Tokenizer, PASSAlgorithm, HMACAlgorithm } from './types'
import enGB from './locales/en-GB'
import zhCN from './locales/zh-CN'
import { resolve } from 'node:path'

export const usage = `
## 插件说明

提供了一次性密码认证服务，支持 TOTP、HOTP 算法。

最大步长在 TOTP 算法中表示每隔多少秒更新一次密码，HOTP 算法中表示每隔多少次更新一次密码。

为确保安全性，建议如下措施：
- 使用随机字符串来作为存储密码 (salt) ，用于加密令牌以及认证令牌
- 添加 Auth 插件，以保证 WebUI 有限度访问
`

export interface Config {
  tokenizer: Tokenizer
  salt: string
  qrcode: boolean
  manager: boolean
  command: boolean
  maxStep: number
  maxThreshold: number
  algorithm: HMACAlgorithm
  pscs: PASSAlgorithm
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    tokenizer: Schema.union<Tokenizer>([
      'uuid',
      'random',
      'timestamp']).default('uuid').description('令牌生成方式'),
    salt: Schema.string().role('secret').description('存储密码（为保证账户安全性，请尽量使用复杂密码）').required(),
    qrcode: Schema.boolean().default(false).description('[⚠ 实验性]是否使用二维码识别（需要 qrcode 服务）'),
    manager: Schema.boolean().default(false).description('允许在 WebUI 中管理令牌'),
    command: Schema.boolean().default(true).description('允许使用命令管理令牌'),
  }).description('基础配置'),
  Schema.object({
    maxStep: Schema.number().min(10).max(100).default(30).description('默认允许的最大步长'),
    maxThreshold: Schema.number().min(3).max(10).default(5).description('默认允许的最大重试步数'),
    pscs: Schema.union([PASSAlgorithm.AES128ECB, PASSAlgorithm.AES256ECB]).default(PASSAlgorithm.AES128ECB).description('密码存储加密算法'),
    algorithm: Schema.union([HMACAlgorithm.SHA1, HMACAlgorithm.SHA256, HMACAlgorithm.SHA512]).default(HMACAlgorithm.SHA512).description('加密算法'),
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
  if (opt.command) ctx.plugin(Commands, opt)

  ctx.i18n.define('zh-CN', zhCN)
  ctx.i18n.define('en-GB', enGB)
  ctx.i18n.define('en-US', enGB)

  if (opt.manager) ctx.using(['console'], (ctx) => {
    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })
  })
}
