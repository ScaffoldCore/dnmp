import { writeFile } from 'node:fs/promises'
import cac from 'cac'
import { resolveConfig } from '@/config.ts'
import { loaderToken } from '@/token.ts'
import { printWarning } from '@/utils.ts'
import { name, version } from '../package.json'

const cli = cac(name)

// TODO 完成主目录下的 package.json 版本发布
// TODO 完成 monorepo 相关版本，多选版本发布

cli.command('')
    .action(async (options) => {
        const config = await resolveConfig()
        config.token = await loaderToken(config)
        console.log(config)
        console.log(import.meta)
        // await setToken(config, 'asdasdasd')
        // console.log(await loaderToken(config))

        // TODO runCommadn
        // TODO ➜ npm publish --//registry.npmjs.org/:_authToken=${token} --access public
    })

cli.command('set <token>', 'Set the local release Token')
    .action(async (token: string = '') => {
        try {
            const config = await resolveConfig()
            await writeFile(config.tokenFile, `export default "${token}"`)
        }
        catch (error) {
            console.log(error)
        }
    })

cli.help()
cli.version(version)

try {
    cli.parse()
}
catch (error: any) {
    printWarning(error.message)
    process.exit(1)
}
