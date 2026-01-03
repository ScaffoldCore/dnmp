import * as process from 'node:process'
import cac from 'cac'
import { bumpVersion } from '@/command/bump.ts'
import { token as setToken } from '@/command/token.ts'
import { printWarning } from '@/utils.ts'
import { name, version } from '../package.json'

const cli = cac(name)

// TODO 完成主目录下的 package.json 版本发布
// TODO 完成 monorepo 相关版本，多选版本发布

cli.command('')
    .action(async (options) => {
        await bumpVersion()
    })

cli.command('set <token>', 'Set the local release Token')
    .action(async (token: string = '') => {
        await setToken(token)
    })

cli.help()
cli.version(version)

try {
    cli.parse()
}
catch (error: any) {
    printWarning(error.message)
    process.exit(0)
}
