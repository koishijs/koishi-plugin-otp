# koishi-plugin-otp

[![npm](https://img.shields.io/npm/v/koishi-plugin-otp?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-otp)

为 Koishi 提供了一次性密码认证服务，支持 TOTP、HOTP 算法。

## 安装

```shell
npm i koishi-plugin-otp
# or yarn
yarn add koishi-plugin-otp
```

## 使用

下面是一个简单的例子：

```typescript
import {} from 'koishi-plugin-otp'

export const name = 'otp-example';

export const using = ['otp'];

export function apply(ctx: Context) {
  const verify = (token: string, code: number) => ctx.otp('totp', {
      secret: token,
      digits: 6,
      period: 30,
      step: 1,
      window: 1,
    }) === code;

  ctx.command('foo', '一个需要验证 OTP 的指令')
    .action(async ({ session }) => {
      const code = await session.prompt('请输入一次性密码');
      if (verify(session.user!.otp_token, code)) {
        return '验证成功'
      } else {
        return '验证失败'
      }
    });
}

```

## 配置项

- tokenizer (`random`、`uuid`、`timestamp`): 公共令牌生成方式，默认值：`uuid`。
- maxStep (`number`): 最大步长，默认值：`30`。
- maxThreshold (`number`): 最大重试阈值，默认值：`5`。

> 最大步长在 TOTP 算法中表示每隔多少秒更新一次密码，HOTP 算法中表示每隔多少次更新一次密码。

## 在 WebUI 中使用

插件支持在 WebUI 中使用，但需要自行导入 HMAC 算法库（要求：支持 SHA1、SHA256、SHA512 算法）。

```typescript
import { hmac } from 'your hmac library'
import { useOTP } from 'koishi-plugin-otp/dist'

const algorithm = 'sha1';

const otp = useOTP('totp', {
  secret: 'your secret',
  algorithm,
  digits: 6,
  period: 30,
  step: 1,
  window: 1,
}, (secret, algorithm) => hmac(secret, algorithm));
```
