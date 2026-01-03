import type { IConfigOptions } from '@/types'
import { readFile, writeFile } from 'node:fs/promises'

export const updateFiles = async (config: IConfigOptions) => {
    const updatePackage = JSON.parse(await readFile(config.packages as string, 'utf-8'))
    updatePackage.version = config.release as string
    await writeFile(config.packages as string, JSON.stringify(updatePackage, null, 2))
}
