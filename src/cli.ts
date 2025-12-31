import cac from 'cac'
import { resolveConfig } from '@/config.ts'
import { loaderToken } from '@/token.ts'
import { name, version } from '../package.json'

const cli = cac(name)

cli.command('')
    .action(async (options) => {
        const config = await resolveConfig()
        config.token = await loaderToken(config)
        console.log(config)
        console.log(import.meta)
        // await setToken(config, 'asdasdasd')
        // console.log(await loaderToken(config))
    })

cli.help()
cli.version(version)
cli.parse()
