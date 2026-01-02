import type { IConfigOptions, VersionResult } from '@/types'
import { cancel, isCancel, select, text } from '@clack/prompts'
import pc from 'picocolors'
import semver from 'semver'
import { CUSTOM_RELEASE_PREFIX } from '@/constant.ts'

// https://semver.org/

const PADDING = 13
export const validateVersion = (version: string) => !!semver.valid(version)

export const getNextVersions = (version: string): VersionResult => {
    const s = semver.parse(version)
    if (!s)
        throw new Error(`[Invalid SemVer]: ${version}`)

    const { major: M, minor: m, patch: p, prerelease: preParts } = s
    const base = `${M}.${m}.${p}`

    /**
     * 完美的层级处理逻辑
     * 支持 alpha.3 -> alpha.3.0.1 (跨级补零)
     */
    const processIncrementalPre = (prefix: string, expectedLen: number, fallback: string): string => {
        // 1. 检查前缀是否匹配
        if (preParts[0] === prefix) {
            const newPre = [...preParts]

            // 2. 如果当前层级太深（超过目标长度），则截断到目标长度
            if (newPre.length > expectedLen) {
                newPre.length = expectedLen
            }

            // 3. 填充缺失的中间层级为 0
            while (newPre.length < expectedLen) {
                newPre.push(0)
            }

            // 4. 对最后一位进行处理
            const lastIdx = expectedLen - 1
            const lastVal = newPre[lastIdx]
            const numericVal = typeof lastVal === 'number' ? lastVal : Number.parseInt(String(lastVal), 10)

            if (!Number.isNaN(numericVal)) {
                // 如果原本长度就够，说明是同级，最后一位 +1
                // 如果原本长度不够（是补出来的 0），则按照规则最后一位应该是 1
                // 但根据你的预期 alpha.3 -> alpha.3.0.1，这里补齐后最后一位设为 1 是最准确的
                const isExtension = preParts.length < expectedLen
                newPre[lastIdx] = isExtension ? 1 : numericVal + 1

                return `${base}-${newPre.join('.')}`
            }
        }

        // 前缀不匹配，直接返回初始定义的 fallback
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
        'alpha-beta': `${base}-alpha.beta`,
        'alpha-major': processIncrementalPre('alpha', 2, 'alpha.1'),
        'alpha-minor': processIncrementalPre('alpha', 3, 'alpha.0.1'),
        'alpha-patch': processIncrementalPre('alpha', 4, 'alpha.0.0.1'),
    }
}

export const promptForNewVersion = async (config: IConfigOptions) => {
    let custom: string = ''

    console.log('current version', config.currentVersion)
    const next = getNextVersions(config.currentVersion)
    console.log(next)

    const beta = pc.magenta('beta')
    const alpha = pc.yellow('alpha')

    const release = await select({
        message: `Current version ${config.currentVersion}`,
        options: [
            { value: 'major', label: `${'major'.padStart(PADDING, ' ')} ${next.major}` },
            { value: 'minor', label: `${'minor'.padStart(PADDING, ' ')} ${next.minor}` },
            { value: 'patch', label: `${'patch'.padStart(PADDING, ' ')} ${next.patch}` },
            { value: 'next', label: `${'next'.padStart(PADDING, ' ')} ${next.next}` },
            { value: 'rc', label: `${'rc'.padStart(PADDING, ' ')} ${next.rc.replace('rc', pc.green('rc'))}` },
            {
                value: 'pre-beta-major',
                label: `${'pre-beta'.padStart(PADDING, ' ')} ${next['beta-major'].replace('beta', beta)}`,
            },
            {
                value: 'pre-beta-minor',
                label: `${'pre-beta'.padStart(PADDING, ' ')} ${next['beta-minor'].replace('beta', beta)}`,
            },
            {
                value: 'pre-beta-minor',
                label: `${'pre-beta'.padStart(PADDING, ' ')} ${next['beta-patch'].replace('beta', beta)}`,
            },
            {
                value: 'pre-beta',
                label: `${'pre-beta'.padStart(PADDING, ' ')} ${next['pre-beta'].replace('beta', beta)}`,
            },
            {
                value: 'alpha-beta',
                label: `${'alpha'.padStart(PADDING, ' ')} ${next['alpha-beta'].replace('alpha', alpha)}`,
            },

            {
                value: 'alpha-major',
                label: `${'alpha'.padStart(PADDING, ' ')} ${next['alpha-major'].replace('alpha', alpha)}`,
            },
            {
                value: 'alpha-minor',
                label: `${'alpha'.padStart(PADDING, ' ')} ${next['alpha-minor'].replace('alpha', alpha)}`,
            },
            {
                value: 'alpha-patch',
                label: `${'alpha'.padStart(PADDING, ' ')} ${next['alpha-patch'].replace('alpha', alpha)}`,
            },
            { value: CUSTOM_RELEASE_PREFIX, label: `${'custom'.padStart(PADDING, ' ')} ...` },
        ],
        initialValue: 'next',
    })

    if (isCancel(release)) {
        cancel('No version selected')
        return process.exit(0)
    }

    if (release === CUSTOM_RELEASE_PREFIX) {
        custom = await text({
            message: 'Enter the new version number',
            placeholder: 'e.g. major, minor, patch, pre-alpha, pre-beta, rc, ...',
        }) as string

        if (isCancel(custom)) {
            cancel('No version enter')
            return process.exit(0)
        }
    }

    console.log({
        release,
        custom,
    })
}
