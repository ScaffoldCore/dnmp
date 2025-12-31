import fs from 'node:fs'
import boxen from 'boxen'

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
