import cac from 'cac'
import { resolveConfig } from '@/config.ts'
import { loaderToken } from '@/token.ts'
import { name, version } from '../package.json'

const cli = cac(name)

cli.command('')
    .option('-c,--cwd', 'Specify the working directory', { default: process.cwd() })
    .action(async (options: {
        c?: string
        cwd?: string
    }) => {
        const config = await resolveConfig(options.cwd)
        config.token = await loaderToken(config)
        console.log(config)
        // await setToken(config, 'asdasdasd')
        // console.log(await loaderToken(config))
    })

cli.help()
cli.version(version)
cli.parse()
