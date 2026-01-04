import process from 'node:process'
import { confirm, intro, outro } from '@clack/prompts'
import pc from 'picocolors'
import { resolveConfig } from '@/config.ts'
import { gitCommit, gitTags } from '@/git.ts'
import { updateFiles } from '@/update-files.ts'
import { isCancelProcess } from '@/utils.ts'
import { getCurrentVersion } from '@/version/current.ts'
import { promptForNewVersion } from '@/version/new.version.ts'
import { version } from '../../package.json'

export const bumpVersion = async () => {
    const config = await resolveConfig()

    intro(pc.bgCyan(` dnmp ${version} `))

    if (config.monorepo.is) {
        outro(pc.yellow('当前暂不支持 monorepo 的版本升级'))
        process.exit(0)
    }

    await getCurrentVersion(config)
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

    await updateFiles(config)

    await gitCommit(config)
    await gitTags(config)

    // await runCommand(config, 'npm', [
    //     'publish',
    //     `--//registry.npmjs.org/:_authToken=${config.token}`,
    //     '--access',
    //     'public',
    // ])

    outro('Done.')
}
