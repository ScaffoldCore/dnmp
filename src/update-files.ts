import type { IConfigOptions } from '@/types'
import { readFile, writeFile } from 'node:fs/promises'

const JSON_SPACING = 2

const updatePackageJson = async (path: string, version: string) => {
    const updatePackage = JSON.parse(await readFile(path, 'utf-8'))
    updatePackage.version = version
    await writeFile(path, JSON.stringify(updatePackage, null, JSON_SPACING))
}

export const updateFiles = async (config: IConfigOptions) => {
    if (config.monorepo.is) {
        for (const pkg of config.monorepo.updatePackages!) {
            await updatePackageJson(pkg.path, pkg.newVersion)
        }
    }
    else {
        await updatePackageJson(config.packages, config.release)
    }
}
