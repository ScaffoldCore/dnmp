import fs from 'node:fs'

export const checkDirExist = (dirPath: string) => {
    return fs.existsSync(dirPath)
}

export const createDir = (dirPath: string) => {
    if (!checkDirExist(dirPath)) {
        fs.mkdirSync(dirPath)
    }
}
