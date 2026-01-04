import type { IConfigOptions } from '@/types'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as process from 'node:process'
import { findUp } from 'find-up'
import { parse } from 'yaml'
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
    monorepo: {
        is: false,
        workspacePath: '',
    },
    packages: '',
}

export const isMonorepo = async (
    config: IConfigOptions,
): Promise<IConfigOptions['monorepo']> => {
    const workspacePath = await findUp('pnpm-workspace.yaml', {
        cwd: config.cwd,
    }) as string

    const workspaceYaml = workspacePath ? parse(readFileSync(workspacePath, 'utf-8')) : { packages: [] }

    const is = !!workspaceYaml?.packages.length

    return {
        is,
        workspacePath,
    }
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

    config.monorepo = await isMonorepo(config)

    // loader monorepo packages name and path, if is
    if (config.monorepo.is) {
        const packages = parse(readFileSync(config.monorepo.workspacePath, 'utf-8'))

        config.packages = packages.packages.map(
            (item: string) =>
                item.indexOf('*')
                    ? `${item.replace('/*', '')}/**/package.json`
                    : `${item}/**/package.json`,
        )
    }
    else {
        config.packages = resolve(config.cwd, 'package.json')
    }

    return config
}
