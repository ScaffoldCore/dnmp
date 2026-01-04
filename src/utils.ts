import fs from 'node:fs'
import { cancel, isCancel } from '@clack/prompts'
import boxen from 'boxen'
import { createJiti } from 'jiti'
import { CANCEL_PROCESS } from '@/constant.ts'

export const checkDirExist = (dirPath: string) => {
    return fs.existsSync(dirPath)
}

export const createDir = (dirPath: string) => {
    if (!checkDirExist(dirPath)) {
        fs.mkdirSync(dirPath)
    }
}

export const printWarning = (message: string) =>
    console.log(boxen(message, {
        title: 'Warning',
        padding: 1,
        borderStyle: 'round',
        borderColor: 'yellow',
    }))

export const isCancelProcess = (value: unknown, message: string = CANCEL_PROCESS) => {
    if (isCancel(value)) {
        cancel(message)
        return process.exit(0)
    }
}

export const loaderTs = async (path: string): Promise<string> => {
    const loader = createJiti(path)
    return await loader.import(path, { default: true })
}
