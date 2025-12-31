import type { IConfig } from '@/types'
import path, { resolve } from 'node:path'
import process from 'node:process'
import { CACHE_TOKEN_FILE_PATH } from '@/constant.ts'

export const resolveConfig = async (cwd: string): Promise<IConfig> => {
    const cwdPath = cwd ? path.resolve(cwd) : process.cwd()
    const tokenPath = resolve(cwdPath, `${CACHE_TOKEN_FILE_PATH}`)

    return {
        cwd: cwdPath,
        tokenFile: tokenPath,
        token: '',
    }
}
