import type { IConfigOptions, IPackageContexts, IUpdatePackages } from '@/types'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { confirm, intro, outro, select } from '@clack/prompts'
import { findUp } from 'find-up'
import pc from 'picocolors'
import { resolveConfig } from '@/config.ts'
import { CANCEL_PROCESS } from '@/constant.ts'
import { gitCommit, gitTags } from '@/git.ts'
import { updateFiles } from '@/update-files.ts'
import { isCancelProcess, loaderTs } from '@/utils.ts'
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

/**
 * 获取缓存文件路径
 */
const getCachePath = async (cwd: string): Promise<string | null> => {
    const path = await findUp('node_modules/.cache/dnmp.ts', {
        cwd,
    })
    return path || null
}

/**
 * 读取或设置统一更新版本选项
 */
const getOrUpdateAllUpdateVersion = async (config: IConfigOptions): Promise<boolean> => {
    const cachePath = await getCachePath(config.cwd)

    if (cachePath) {
        return Boolean(await loaderTs(cachePath))
    }

    const allUpdateVersion = await confirm({
        message: '是否以根 package.json 为主版本统一更新 workspace 所有版本',
        initialValue: true,
    }) as boolean

    isCancelProcess(allUpdateVersion, CANCEL_PROCESS)

    const cacheFilePath = resolve(config.cwd, './node_modules/.cache/dnmp.ts')
    await writeFile(cacheFilePath, `export default ${allUpdateVersion}`)

    return allUpdateVersion
}

/**
 * 读取包文件内容
 */
const readPackageFile = async (filePath: string): Promise<{ version: string }> => {
    return JSON.parse(await readFile(filePath, 'utf-8')) as { version: string }
}

/**
 * 统一更新所有包的版本
 */
const updateAllPackagesVersion = async (config: IConfigOptions): Promise<void> => {
    const pkg = await readPackageFile(config.packages)
    config.currentVersion = pkg.version

    await promptForNewVersion(config)

    for (const item of config.monorepo.packageContexts) {
        const resolvePkgPath = resolve(config.cwd, item.file)
        const packageInfo = await readPackageFile(resolvePkgPath);

        (config.monorepo.updatePackages ??= []).push({
            name: item.name,
            path: resolvePkgPath,
            currentVersion: packageInfo.version,
            newVersion: config.release,
        })
    }
}

export const bumpVersion = async () => {
    const config = await resolveConfig()

    intro(pc.bgCyan(` dnmp ${version} `))

    if (config.monorepo.is) {
        const allUpdateVersion = await getOrUpdateAllUpdateVersion(config)

        if (allUpdateVersion) {
            await updateAllPackagesVersion(config)
        }
        else {
            await handleMonorepoPackageSelection(config)
        }
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
