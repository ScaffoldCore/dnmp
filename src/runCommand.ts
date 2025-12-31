import type { IConfig } from '@/types'
import { x } from 'tinyexec'

export const runCommand = async (config: IConfig, command: string, args: string[]) => {
    await x(command, args, {
        nodeOptions: {
            stdio: 'inherit',
            cwd: config.root,
        },
    })
}
