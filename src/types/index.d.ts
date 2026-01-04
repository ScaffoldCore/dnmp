export interface IPackage {
    name?: string
    version?: string
    private?: boolean
}

export interface IPackageContexts {
    name: string
    file: string
    version: string
    context: IPackage
}

export interface IUpdatePackages {
    name: string
    path: string
    currentVersion: string
    newVersion: string
}

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
        packages: string[]
        packageContexts: IPackageContexts[]
        updatePackages?: IUpdatePackages[]
    }
    packages: string
}
