import type { IConfigOptions } from '@/types'
import { resolve } from 'node:path'
import * as process from 'node:process'
import { CACHE_TOKEN_FILE_PATH } from '@/constant.ts'
import { loaderToken } from '@/token.ts'
import { name } from '../package.json'

const CURRENT_PATH = resolve(import.meta.dirname, '../')

const defaultConfig: IConfigOptions = {
    root: '',
    cwd: '',
    token: {
        name: 'token.ts',
        file: resolve(CURRENT_PATH, `${CACHE_TOKEN_FILE_PATH}`),
        value: '',
    },
    release: '',
    currentVersion: '',
    monorepo: false,
    packages: '',
}

export const resolveConfig = async (): Promise<IConfigOptions> => {
    const { loadConfig } = await import('c12')

    const config = await loadConfig<IConfigOptions>({
        name,
        defaultConfig,
    }).then(r => ({
        ...r.config,
        cwd: process.cwd(),
        root: CURRENT_PATH,
    }))

    config.token.value = await loaderToken(config) || ''

    return config
}
