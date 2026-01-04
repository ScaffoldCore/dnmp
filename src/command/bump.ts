import type { IConfigOptions, IPackageContexts, IUpdatePackages } from '@/types'
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

/**
 * 创建包选择选项
 */
const createPackageOptions = (packageContexts: IPackageContexts[]) => {
    return packageContexts.map((file) => {
        return {
            value: file.name,
            label: file.name,
            hint: `${pc.red(file.version)} - ${file.file}`,
        }
    })
}

/**
 * 处理单个包的选择流程
 */
const processPackageSelection = async (
    config: IConfigOptions,
    selectedPackageName: string,
    packageContexts: IPackageContexts[],
): Promise<void> => {
    const selectedPackage = packageContexts.find(opt => opt.name === selectedPackageName) as IPackageContexts

    const resolvePackage: IUpdatePackages = {
        name: selectedPackageName,
        path: resolve(config.cwd, selectedPackage.file),
        currentVersion: selectedPackage.version,
        newVersion: selectedPackage.version,
    };

    (config.monorepo.updatePackages ??= []).push(resolvePackage)

    await promptForNewVersion(config, resolvePackage, config.monorepo.updatePackages.length - 1)
}

/**
 * 处理 monorepo 包的选择逻辑
 */
const handleMonorepoPackageSelection = async (config: IConfigOptions): Promise<void> => {
    const options = createPackageOptions(config.monorepo.packageContexts)
    let availableOptions = [...options]

    while (availableOptions.length > 0) {
        const selectedPackage = await select({
            message: '请选择要升级版本的包:',
            options: availableOptions,
        }) as string

        isCancelProcess(selectedPackage)

        await processPackageSelection(config, selectedPackage, config.monorepo.packageContexts)

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
}

export const bumpVersion = async () => {
    const config = await resolveConfig()

    intro(pc.bgCyan(` dnmp ${version} `))

    if (config.monorepo.is) {
        await handleMonorepoPackageSelection(config)
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
