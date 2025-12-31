import type { IConfig } from '@/types'
import { resolve } from 'node:path'
import { CACHE_TOKEN_FILE_PATH } from '@/constant.ts'

const CURRENT_PATH = resolve(import.meta.dirname, '../')
export const resolveConfig = async (): Promise<IConfig> => {
    const root = process.cwd()
    const tokenPath = resolve(CURRENT_PATH, `${CACHE_TOKEN_FILE_PATH}`)

    return {
        cwd: CURRENT_PATH,
        root,
        tokenFile: tokenPath,
        token: '',
    }
}
