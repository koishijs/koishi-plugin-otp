# koishi-plugin-otp

> [!WARNING]  
> 这是一个早期版本，可能会有较大的 API 变动。

[![npm](https://img.shields.io/npm/v/koishi-plugin-otp?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-otp) [![GitHub issues](https://img.shields.io/github/issues/koishijs/koishi-plugin-otp?style=flat-square)](https://github.com/koishijs/koishi-plugin-otp/issues) ![Rating](https://badge.koishi.chat/rating/koishi-plugin-otp)

为 Koishi 提供了一次性密码服务。

OTP 服务支持以下算法：

- TOTP: 基于时间的一次性密码算法 ([RFC 6238](https://tools.ietf.org/html/rfc6238))
- HOTP: 基于计数器的一次性密码算法 ([RFC 4226](https://tools.ietf.org/html/rfc4226))

更多算法欢迎提交 PR。

## 使用

### 安装

插件市场搜索 `otp` 并安装。

### 命令

- `otp [name]`: 列出用户保存的某个或所有密码。
- `otp.add <name> <token>`: 添加或覆盖认证账号。
- `otp.rm <name>`: 移除令牌。

### 配置项

> [!NOTE]  
> 最大步长在 TOTP 算法中表示每隔多少秒更新一次密码，HOTP 算法中表示每隔多少次更新一次密码。

- qrcode (`boolean`): 是否在添加令牌时显示二维码，默认值：`true`。
- tokenizer (`random`、`uuid`、`timestamp`): 公共令牌生成方式，默认值：`uuid`。 
- maxStep (`number`): 最大步长，默认值：`30`。
- maxThreshold (`number`): 最大重试阈值，默认值：`5`。

## 开发

### 安装开发依赖

```shell
npm i koishi-plugin-otp -D
# or yarn
yarn add koishi-plugin-otp -D
```
### API

#### 类: `OTPService`

可通过 `ctx.otp` 访问。

#### `otp.generate(method: OTPMethod, options: OTPOptions): Promise<string>`

- `method`: 认证算法，支持 `totp` 和 `hotp`。
- `options`: 认证配置项，支持以下属性：
  - `secret`: 共享密钥。
  - `algorithm`: 哈希算法，支持 `sha1`、`sha256` 和 `sha512`。
  - `digits`: 密码长度。
  - `period`: 密码更新周期。
  - `step`: 最大步长。

生成密码。

#### `otp.createToken(tokenizer?: Tokenizer, salt?: string): string`

- `tokenizer`: 密钥生成器，支持 `random`、`uuid` 和 `timestamp`。
- `salt`: 密钥生成器的盐。

创建共享密钥。

## 在 WebUI 中使用

> [!WARNING]  
> 浏览器 Crypto API 有一定的安全性限制，请确保浏览器支持与符合[安全上下文](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)。

插件支持在 WebUI 中使用，并且得益于浏览器的 Crypto API，不需要额外导入 HMAC 算法：

```typescript
import { useOTP } from 'koishi-plugin-otp/dist'

const otp = useOTP('totp', {
  secret: 'your secret',
  algorithm: 'sha1',
  digits: 6,
  period: 30,
  step: 1
});
```

## 贡献者

[![Star History Chart](https://contrib.rocks/image?repo=koishijs/koishi-plugin-otp)](https://github.com/koishijs/koishi-plugin-otp/graphs/contributors)

## License

This project is licensed under the [MIT license](./LICENSE).
