import type { IConfigOptions, IPackage, IPackageContexts } from '@/types'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as process from 'node:process'
import { findUp } from 'find-up'
import { glob } from 'glob'
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
        packages: [],
        packageContexts: [],
        updatePackages: [],
    },
    packages: '',
}

const collectPackageFiles = async (config: IConfigOptions, packages: string[]) => {
    const files = ['package.json']
    files.push(...await glob(packages, {
        cwd: config.cwd,
        ignore: ['**/node_modules/**'],
    }))

    return [...files]
}

export const isMonorepo = async (
    config: IConfigOptions,
): Promise<IConfigOptions['monorepo']> => {
    const workspacePath = await findUp('pnpm-workspace.yaml', {
        cwd: config.cwd,
    }) as string

    if (!workspacePath) {
        return {
            is: false,
            workspacePath: '',
            packageContexts: [],
            packages: [],
        }
    }

    const workspaceYaml = workspacePath ? parse(readFileSync(workspacePath, 'utf-8')) : { packages: [] }

    const is = !!workspaceYaml?.packages.length

    const { packages: workSpacePackages } = parse(readFileSync(workspacePath, 'utf-8'))

    let packages = []
    let packageContexts: IPackageContexts[] = []
    if (workSpacePackages) {
        packages = workSpacePackages.map(
            (item: string) =>
                item.indexOf('*')
                    ? `${item.replace('/*', '')}/**/package.json`
                    : `${item}/**/package.json`,
        )

        const packageFiles = await collectPackageFiles(config, packages)
        packageContexts = packageFiles.map((file) => {
            const files = JSON.parse(readFileSync(resolve(config.cwd, file), 'utf-8')) as IPackage

            return {
                name: `${files.name}`,
                file,
                version: files?.version || '',
                context: files,
            }
        }) as IPackageContexts[]
    }

    return {
        is,
        workspacePath,
        packageContexts,
        packages,
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

    config.packages = resolve(config.cwd, 'package.json')

    return config
}
