import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { confirm, intro, outro, select } from '@clack/prompts'
import { glob } from 'glob'
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

    // TODO 如果 config.monorepo.is 为 true 则执行 monorepo 相关操作
    if (config.monorepo.is) {
        const packages = ['package.json']
        packages.push(...await glob(config.packages, {
            cwd: config.cwd,
            ignore: ['**/node_modules/**'],
        }))

        const options = packages.map((file) => {
            const files = JSON.parse(readFileSync(resolve(config.cwd, file), 'utf-8'))

            return {
                value: file,
                label: `${files.name}`,
                hint: `${pc.red(files.version)} - ${file}`,
            }
        })

        // 让用户选择要升级的包
        const selectedPackage = await select({
            message: '请选择要升级版本的包:',
            options,
        }) as string

        isCancelProcess(selectedPackage)

        outro(pc.cyan(`已选择: ${selectedPackage}`))
        return process.exit(0)
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
