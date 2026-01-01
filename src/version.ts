import type { IConfigOptions, ReleaseType, VersionResult } from '@/types'
import * as console from 'node:console'
import { cancel, isCancel, select, text } from '@clack/prompts'
import pc from 'picocolors'
import semver from 'semver'
import { CUSTOM_RELEASE_PREFIX } from '@/constant.ts'

/**
 * 常量配置
 */
const PADDING = 13

/**
 * 核心逻辑：版本计算
 */
export const getNextVersions = (version: string): VersionResult => {
    const s = semver.parse(version)
    if (!s) {
        throw new Error(`[Invalid SemVer] 无法解析版本号: ${version}`)
    }

    const { major: M, minor: m, patch: p, prerelease: preParts } = s
    const base = `${M}.${m}.${p}`

    const processIncrementalPre = (prefix: string, expectedLen: number, fallback: string): string => {
        const isSamePrefix = preParts[0] === prefix

        if (isSamePrefix) {
            // 情况 1: 当前处于目标层级 (e.g., alpha.0.3 -> alpha.0.4)
            if (preParts.length === expectedLen) {
                const newPre = [...preParts]
                const lastIdx = expectedLen - 1
                const lastVal = Number.parseInt(String(newPre[lastIdx]), 10)
                newPre[lastIdx] = Number.isNaN(lastVal) ? 1 : lastVal + 1
                return `${base}-${newPre.join('.')}`
            }
            // 情况 2: 向下钻取 (e.g., alpha.0 -> alpha.0.1)
            if (preParts.length === expectedLen - 1) {
                return `${base}-${preParts.join('.')}.1`
            }
        }
        // 情况 3: 默认初始值
        return `${base}-${fallback}`
    }

    return {
        'major': `${M + 1}.0.0`,
        'minor': `${M}.${m + 1}.0`,
        'patch': `${M}.${m}.${p + 1}`,
        'next': `${M}.${m}.${p + 1}`,
        'rc': processIncrementalPre('rc', 2, 'rc.1'),
        'beta-major': processIncrementalPre('beta', 2, 'beta.1'),
        'beta-minor': processIncrementalPre('beta', 3, 'beta.0.1'),
        'beta-patch': processIncrementalPre('beta', 4, 'beta.0.0.1'),
        'pre-beta': `${base}-beta`,
        'alpha-major': processIncrementalPre('alpha', 2, 'alpha.1'),
        'alpha-minor': processIncrementalPre('alpha', 3, 'alpha.0.1'),
        'alpha-patch': processIncrementalPre('alpha', 4, 'alpha.0.0.1'),
        'alpha-beta': `${base}-alpha.beta`,
    }
}

/**
 * UI 辅助函数：格式化 Prompt 选项
 */
const formatOption = (label: string, version: string, colorFn: (s: string) => string = s => s) => {
    // 提取版本号中的标识符并着色
    const formattedVersion = version.replace(/(alpha|beta|rc)/g, (match) => {
        if (match === 'alpha')
            return pc.yellow(match)
        if (match === 'beta')
            return pc.magenta(match)
        if (match === 'rc')
            return pc.green(match)
        return match
    })

    return {
        label: `${pc.dim(label.padStart(PADDING))} ${formattedVersion}`,
        version,
    }
}

/**
 * 主交互函数
 */
export const promptForNewVersion = async (config: IConfigOptions) => {
    const next = getNextVersions(config.currentVersion)

    // 定义选项结构，方便维护
    const optionDefinitions = [
        { value: 'major', label: 'major' },
        { value: 'minor', label: 'minor' },
        { value: 'patch', label: 'patch' },
        { value: 'next', label: 'next' },
        { value: 'rc', label: 'rc' },
        { value: 'beta-major', label: 'pre-beta' }, // 修正了原代码中重复的 value
        { value: 'beta-minor', label: 'pre-beta' },
        { value: 'beta-patch', label: 'pre-beta' },
        { value: 'pre-beta', label: 'pre-beta' },
        { value: 'alpha-major', label: 'alpha' },
        { value: 'alpha-minor', label: 'alpha' },
        { value: 'alpha-patch', label: 'alpha' },
        { value: 'alpha-beta', label: 'alpha' },
    ] as const

    const options = optionDefinitions.map((opt) => {
        const version = next[opt.value] as string
        const { label } = formatOption(opt.label, version)
        return { value: opt.value as string, label }
    })
    // 注入自定义选项
    options.push({
        value: CUSTOM_RELEASE_PREFIX,
        label: `${pc.cyan('custom'.padStart(PADDING))} ${pc.dim('...')}`,
    })

    const release = await select({
        message: `Current version: ${pc.cyan(config.currentVersion)}`,
        options,
        initialValue: 'next',
    })

    if (isCancel(release)) {
        cancel('Operation cancelled.')
        return // 不要直接 process.exit，让调用者决定
    }

    let finalVersion = release === CUSTOM_RELEASE_PREFIX ? '' : next[release as ReleaseType]

    if (release === CUSTOM_RELEASE_PREFIX) {
        const custom = await text({
            message: 'Enter the new version number',
            placeholder: 'e.g. 1.0.1-beta.0',
            validate: value => !semver.valid(value) ? 'Invalid SemVer format' : undefined,
        })

        if (isCancel(custom)) {
            cancel('No version entered')
            return
        }
        finalVersion = custom
    }

    console.log(`\nSelected version: ${pc.green(finalVersion)}`)

    return finalVersion
}
