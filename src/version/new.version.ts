import type { releaseType, ReleaseTypes } from '@/release-type.ts'
import type { IConfigOptions } from '@/types'
import { cancel, isCancel, select, text } from '@clack/prompts'
import pc from 'picocolors'
import semver from 'semver'
import { CUSTOM_RELEASE_PREFIX } from '@/constant.ts'
import { isCancelProcess } from '@/utils.ts'

// https://semver.org/

const PADDING = 13
export const validateVersion = (version: string) => !!semver.valid(version)

interface UIStyle {
    label: string
    color: (t: string) => string
}

const DEFAULT_STYLE: UIStyle = { label: 'next', color: pc.cyan }

const UI_STYLE_MAP: Record<string, UIStyle> = {
    major: { label: 'major', color: pc.cyan },
    minor: { label: 'minor', color: pc.cyan },
    patch: { label: 'patch', color: pc.cyan },
    next: { label: 'next', color: pc.cyan },
    rc: { label: 'rc', color: pc.green },
    beta: { label: 'pre-beta', color: pc.magenta },
    alpha: { label: 'alpha', color: pc.yellow },
}

// --- 工具函数 ---

/**
 * 核心逻辑：增量处理预发布版本
 * 解决 TS2345: 使用 readonly 修饰符接受 semver 的返回类型
 */
const processIncrementalPre = (preParts: readonly (string | number)[], base: string, prefix: string, expectedLen: number, fallback: string): string => {
    if (preParts[0] !== prefix) {
        return `${base}-${fallback}`
    }

    const newPre = [...preParts].slice(0, expectedLen)
    while (newPre.length < expectedLen) {
        newPre.push(0)
    }

    const lastIdx = expectedLen - 1
    const lastVal = newPre[lastIdx]
    const numericVal = typeof lastVal === 'number' ? lastVal : Number.parseInt(String(lastVal), 10)

    const isExtension = preParts.length < expectedLen
    // 逻辑：如果是补位产生的 0，则起始为 1；如果是已有的数字，则递增
    newPre[lastIdx] = isExtension ? 1 : (Number.isNaN(numericVal) ? 1 : numericVal + 1)

    return `${base}-${newPre.join('.')}`
}

export const getNextVersions = (version: string): ReleaseTypes => {
    const s = semver.parse(version)
    if (!s)
        throw new Error(`[Invalid SemVer]: ${version}`)

    const { major: M, minor: m, patch: p, prerelease: pre } = s
    const base = `${M}.${m}.${p}`

    return {
        'major': `${M + 1}.0.0`,
        'minor': `${M}.${m + 1}.0`,
        'patch': `${M}.${m}.${p + 1}`,
        'next': `${M}.${m}.${p + 1}`,
        'rc': processIncrementalPre(pre, base, 'rc', 2, 'rc.1'),
        'beta-major': processIncrementalPre(pre, base, 'beta', 2, 'beta.1'),
        'beta-minor': processIncrementalPre(pre, base, 'beta', 3, 'beta.0.1'),
        'beta-patch': processIncrementalPre(pre, base, 'beta', 4, 'beta.0.0.1'),
        'pre-beta': `${base}-beta`,
        'alpha-beta': `${base}-alpha.beta`,
        'alpha-major': processIncrementalPre(pre, base, 'alpha', 2, 'alpha.1'),
        'alpha-minor': processIncrementalPre(pre, base, 'alpha', 3, 'alpha.0.1'),
        'alpha-patch': processIncrementalPre(pre, base, 'alpha', 4, 'alpha.0.0.1'),
    }
}

export const promptForNewVersion = async (config: IConfigOptions): Promise<string | void> => {
    const next = getNextVersions(config.currentVersion)

    // 动态生成选项
    const options = (Object.keys(next) as releaseType[]).map((key) => {
        const versionStr = next[key]

        // 1. 获取前缀（如 'alpha'）
        const prefix = key.split('-')[0] ?? 'next'

        // 2. 彻底解决 TS18048: 即使 prefix 在 Map 里，TS 仍认为可能返回 undefined
        // 使用空值合并运算符 (??) 确保 style 永远是 UIStyle 类型
        const style = UI_STYLE_MAP[prefix] ?? DEFAULT_STYLE

        const label = style.label.padStart(PADDING, ' ')

        // 渲染版本颜色，同样处理关键字匹配的安全性
        const coloredVersion = versionStr.replace(/(rc|beta|alpha)/g, (match) => {
            const matchStyle = UI_STYLE_MAP[match] ?? DEFAULT_STYLE
            return matchStyle.color(match)
        })

        return {
            value: key as string,
            label: `${label} ${coloredVersion}`,
        }
    })

    options.push({
        value: CUSTOM_RELEASE_PREFIX,
        label: `${'custom'.padStart(PADDING, ' ')} ...`,
    })

    const release = await select({
        message: `Current version ${pc.bold(config.currentVersion)}`,
        options,
        initialValue: 'next',
    }) as releaseType | 'custom'

    isCancelProcess(release)

    let finalVersion: string

    if (release === CUSTOM_RELEASE_PREFIX) {
        const custom = await text({
            message: 'Enter the new version number',
            validate: val => !validateVersion(val) ? 'Invalid semver' : undefined,
        })

        if (isCancel(custom)) {
            cancel('No version entered')
            return process.exit(0)
        }
        finalVersion = custom
    }
    else {
        // 这里的 release 已经排除了 CUSTOM 且必定属于 releaseType
        finalVersion = next[release]
    }

    console.log(`${pc.green('✔')} New version: ${pc.cyan(finalVersion)}`)
    return finalVersion
}
