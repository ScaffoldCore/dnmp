import type { IConfig } from '@/types'
import { resolve } from 'node:path'
import { CACHE_TOKEN_FILE_PATH } from '@/constant.ts'

export const resolveConfig = async (cwd: string = ''): Promise<IConfig> => {
    const cwdPath = cwd ? resolve(cwd) : process.cwd()
    const tokenPath = resolve(cwdPath, `${CACHE_TOKEN_FILE_PATH}`)

    return {
        cwd: cwdPath,
        tokenFile: tokenPath,
        token: '',
    }
}
