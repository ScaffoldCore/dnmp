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
        workspacePath: string
    }
    packages: string | string[]
}
