import { Context } from "koishi";

export default class OTPClient {
  constructor(ctx: Context) {
    require
    const cmd = ctx.command('otp [name:string]')
      .userFields(['id', 'name'])
      .action(async ({ session }, name) => {
        const otps = await ctx.database.get('otp', {
          bid: session.user.id
        }, ['name', 'token', 'type', 'algorithm', 'digits', 'counter', 'period', 'initial'])

        if (!otps.length) return session.text('none')

        const codes = otps.map(otp => {
          const { type, algorithm, digits, counter, period, initial } = otp
          let code: string
          ctx.otp.generate(type, {
            secret: otp.token,
            algorithm, digits, counter, period, initial
          }).then(coder => code = coder.toString())
            .catch(() => code = 'error')
          return {
            name: otp.name,
            token: code
          }
        })

        return `<message>
          <i18n path="list-title"/>
          ${(codes).filter(otp => !name || otp.name === name).map(otp => `<p>${otp.name} - ${otp.token}</p>`).join('')}
        </message>`
      })

    cmd.subcommand('.add [qrcode]')
      .option('name', '-n <name:string>')
      .option('qrcode', '-c')
      .action(async ({ session }) => {

      })
  }
}
