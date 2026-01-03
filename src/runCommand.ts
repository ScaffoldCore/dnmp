import type { IConfigOptions } from '@/types'
import { x } from 'tinyexec'

export const runCommand = async (config: IConfigOptions, command: string, args: string[]) => {
    await x(command, args, {
        nodeOptions: {
            stdio: 'inherit',
            cwd: config.cwd,
        },
    })
}
