import { readFile, writeFile } from 'node:fs/promises'
import * as process from 'node:process'
import { confirm, intro, outro } from '@clack/prompts'
import cac from 'cac'
import pc from 'picocolors'
import { resolveConfig } from '@/config.ts'
import { runCommand } from '@/runCommand.ts'
import { setToken } from '@/token.ts'
import { isCancelProcess, printWarning } from '@/utils.ts'
import { getCurrentVersion } from '@/version/current.ts'
import { promptForNewVersion } from '@/version/new.version'
import { name, version } from '../package.json'

const cli = cac(name)

// TODO 完成主目录下的 package.json 版本发布
// TODO 完成 monorepo 相关版本，多选版本发布

cli.command('')
    .action(async (options) => {
        const config = await resolveConfig()

        intro(pc.bgCyan(` dnmp ${version} `))

        if (config.monorepo.is) {
            outro(pc.yellow('当前暂不支持 monorepo 的版本升级'))
            process.exit(0)
        }
        // TODO 获取老的版本号
        await getCurrentVersion(config)

        // TODO 获取新的版本号
        await promptForNewVersion(config)

        console.log('npm', [
            'publish',
            `--//registry.npmjs.org/:_authToken=${config.token.value}`,
            '--access',
            'public',
        ].join(' '))

        const isConfirmUpdate = await confirm({
            message: '是否确认更新 package.json ?',
            initialValue: true,
        })

        isCancelProcess(isConfirmUpdate)

        if (!isConfirmUpdate) {
            outro('用户取消操作，后续进程停止')
            return process.exit(0)
        }

        // TODO 更新 package.json 相应版本号
        const updatePackage = JSON.parse(await readFile(config.packages as string, 'utf-8'))
        updatePackage.version = config.release as string

        console.log(updatePackage)
        await writeFile(config.packages as string, JSON.stringify(updatePackage, null, 2))

        // TODO 提交 Git Commits release 信息
        // TODO 创建 Git tag
        await runCommand(config, 'git', ['tag', '--annotate', '--message', '', `v${config.release}`])
        // TODO 发布 NPM

        // await runCommand(config, 'npm', [
        //     'publish',
        //     `--//registry.npmjs.org/:_authToken=${config.token}`,
        //     '--access',
        //     'public',
        // ])

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
            process.exit(0)
        }
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
