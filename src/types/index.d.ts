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
    monorepo: boolean
    packages: string | string[]
}
