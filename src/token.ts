import type { IConfigOptions } from '@/types'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import boxen from 'boxen'
import { x } from 'tinyexec'
import { CACHE_FOLDER_NAME } from '@/constant.ts'
import { createDir } from '@/utils.ts'

export const setToken = async (config: IConfigOptions, token: string): Promise<void> => {
    createDir(resolve(config.cwd, CACHE_FOLDER_NAME))
    await writeFile(config.token.file, `export default "${token}"`)
}

export const loaderToken = async (config: IConfigOptions): Promise<string> => {
    const npmrcPath = await x('npm', ['config', 'get', 'userconfig'], {
        nodeOptions: {
            cwd: config.cwd,
            stdio: 'pipe',
        },
    })

    const content = await readFile(npmrcPath.stdout.trim(), 'utf-8')
    const [, tokenValue] = content.match(/\/\/registry.npmjs.org\/:_authToken=(.*)/) || []
    const token = tokenValue?.trim() || null
    if (!token) {
        console.log(boxen(
            `_authToken not found in your .npmrc file,
you can use the following codemod:
Run "dnmp set <token> or npm config set //registry.npmjs.org/:_authToken=<token>"`,
            {
                title: 'Warning',
                padding: 1,
                margin: 0,
                borderStyle: 'round',
                borderColor: 'yellow',
            },
        ))
        process.exit(0)
    }
    return token
}
