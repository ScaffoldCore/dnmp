import type { IConfigOptions } from '@/types'
import { basename } from 'node:path'
import { x } from 'tinyexec'

export const gitCommit = async (config: IConfigOptions) => {
    const args = []

    args.push('--message', `release: v${config.release}`)

    args.push('--allow-empty')

    if (typeof config.packages === 'object') {
        args.push(config.packages.map(r => basename(r)).join(' '))
    }
    else {
        args.push(config.packages)
    }

    await x('git', ['commit', ...args], {
        nodeOptions: {
            cwd: config.cwd,
            stdio: 'pipe',
        },
    })
}

export const gitTags = async (config: IConfigOptions) => {
    await x('git', [
        'tag',
        '--annotate',
        '--message',
        '',
        `v${config.release}`,
    ], {
        nodeOptions: {
            cwd: config.cwd,
            stdio: 'pipe',
        },
    })
}

export const gitPush = async (config: IConfigOptions) => {
    await x('git', ['push', '--tags'], {
        throwOnError: true,
        nodeOptions: {
            cwd: config.cwd,
            stdio: 'pipe',
        },
    })
}
