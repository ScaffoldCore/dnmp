import type { IPackageContexts, IUpdatePackages } from '@/types'
import { resolve } from 'node:path'
import process from 'node:process'
import { confirm, intro, outro, select } from '@clack/prompts'
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
        const options = config.monorepo.packageContexts.map((file) => {
            return {
                value: file.name,
                label: file.name,
                hint: `${pc.red(file.version)} - ${file.file}`,
            }
        })

        // 选择需要升级的包 - loop
        let availableOptions = [...options]
        const selectedPackages: string[] = []

        while (availableOptions.length > 0) {
            const selectedPackage = await select({
                message: '请选择要升级版本的包:',
                options: availableOptions,
            }) as string

            isCancelProcess(selectedPackage)

            const selectPackage = config.monorepo.packageContexts.find(opt => opt.name === selectedPackage) as IPackageContexts

            const resolvePackage: IUpdatePackages = {
                name: selectedPackage,
                path: resolve(config.cwd, selectPackage.file),
                currentVersion: selectPackage.version,
                newVersion: selectPackage.version,
            };

            (config.monorepo.updatePackages ??= []).push(resolvePackage)

            console.log('如果要往后续新增的话，key 是:', config.monorepo.updatePackages.length - 1)
            selectedPackages.push(selectedPackage)
            outro(pc.cyan(`已选择: ${selectedPackage}`))

            await promptForNewVersion(config, resolvePackage, config.monorepo.updatePackages.length - 1)

            // 从可用选项中移除已选择的包
            availableOptions = availableOptions.filter(opt => opt.value !== selectedPackage)

            if (availableOptions.length > 0) {
                const continueSelection = await confirm({
                    message: '是否继续选择其他包?',
                    initialValue: true,
                })
                isCancelProcess(continueSelection)

                if (!continueSelection) {
                    break
                }
            }
        }

        outro(`总共选择了 ${selectedPackages.length} 个包`)
    }
    else {
        await getCurrentVersion(config)
        await promptForNewVersion(config)
    }

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
