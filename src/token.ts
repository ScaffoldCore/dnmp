import type { IConfigOptions } from '@/types'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createJiti } from 'jiti'
import { CACHE_FOLDER_NAME } from '@/constant.ts'
import { createDir } from '@/utils.ts'

export const setToken = async (config: IConfigOptions, token: string): Promise<void> => {
    createDir(resolve(config.cwd, CACHE_FOLDER_NAME))
    await writeFile(config.token.file, `export default "${token}"`)
}

export const loaderToken = async (config: IConfigOptions): Promise<string> => {
    const loader = createJiti(config.token.file)
    return await loader.import(config.token.file, { default: true })
}
