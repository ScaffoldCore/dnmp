import type { IConfig } from '@/types'
import * as process from 'node:process'
import { cancel, isCancel, select, text } from '@clack/prompts'
import pc from 'picocolors'
import { CUSTOM_RELEASE_PREFIX } from '@/constant.ts'

// https://semver.org/

const PADDING = 13

export const promptForNewVersion = async (config: IConfig) => {
    let custom: string = ''
    const release = await select({
        message: 'Current version 0.0.0',
        options: [
            { value: 'major', label: `${'major'.padStart(PADDING, ' ')} 0.0.0` },
            { value: 'minor', label: `${'minor'.padStart(PADDING, ' ')} 0.0.0` },
            { value: 'patch', label: `${'patch'.padStart(PADDING, ' ')} 0.0.0` },
            { value: 'next', label: `${'next'.padStart(PADDING, ' ')} 0.0.0` },
            { value: 'rc', label: `${'rc'.padStart(PADDING, ' ')} 0.0.0-${pc.green('rc')}.1` },
            { value: 'pre-beta-major', label: `${'pre-major'.padStart(PADDING, ' ')} 0.0.0-${pc.magenta('beta')}.1` },
            { value: 'pre-beta-minor', label: `${'pre-minor'.padStart(PADDING, ' ')} 0.0.0-${pc.magenta('beta')}.1` },
            { value: 'pre-beta-patch', label: `${'pre-patch'.padStart(PADDING, ' ')} 0.0.0-${pc.magenta('beta')}.1` },
            { value: 'pre-beta', label: `${'pre-beta'.padStart(PADDING, ' ')} 0.0.0-${pc.magenta('beta')}` },
            { value: 'pre-alpha-major', label: `${'alpha'.padStart(PADDING, ' ')} 0.0.0-${pc.yellow('alpha')}.beta` },
            { value: 'pre-alpha-minor', label: `${'alpha'.padStart(PADDING, ' ')} 0.0.0-${pc.yellow('alpha')}.1` },
            { value: 'pre-alpha-patch', label: `${'alpha'.padStart(PADDING, ' ')} 0.0.0-${pc.yellow('alpha')}` },
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
