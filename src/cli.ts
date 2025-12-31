import { intro, outro } from '@clack/prompts'
import cac from 'cac'
import pc from 'picocolors'
import { resolveConfig } from '@/config.ts'
import { loaderToken, setToken } from '@/token.ts'
import { printWarning } from '@/utils.ts'
import { promptForNewVersion } from '@/version.ts'
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

        intro(pc.bgCyan(` dnmp ${version} `))

        await promptForNewVersion(config)

        console.log('npm', [
            'publish',
            `--//registry.npmjs.org/:_authToken=${config.token}`,
            '--access',
            'public',
        ].join(' '))

        outro('Done.')
    })

cli.command('set <token>', 'Set the local release Token')
    .action(async (token: string = '') => {
        try {
            const config = await resolveConfig()
            await setToken(config, token)
        }
        catch (error: any) {
            printWarning(error.message)
            process.exit(1)
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
