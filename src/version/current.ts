import type { IConfigOptions } from '@/types'
import { readFile } from 'node:fs/promises'

export const getCurrentVersion = async (config: IConfigOptions) => {
    const { packages } = config

    if (typeof packages === 'object') {
        // TODO load monorepo package version
    }
    else {
        const manifest = JSON.parse(await readFile(packages, {
            encoding: 'utf-8',
        })) as {
            version?: string
        }

        config.currentVersion = manifest.version || ''
    }
}
