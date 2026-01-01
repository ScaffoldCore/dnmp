export interface IConfigOptions {
    root: string
    cwd: string
    token: {
        name: string
        file: string
        value: string
    }
    release: string
    currentVersion: string
    monorepo: {
        is: boolean
        path: string
    }
    packages: string | string[]
}
