import type { IConfig } from '@/types'
import path from 'node:path'
import process from 'node:process'

export const resolveConfig = (cwd: string): IConfig => {
    return {
        cwd: cwd ? path.resolve(cwd) : process.cwd(),
    }
}
