import type { CustomReleaseType } from '@/version.ts'

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

export type ReleaseType
    = | 'major'
        | 'minor'
        | 'patch'
        | 'next'
        | 'rc'
        | 'beta-major'
        | 'beta-minor'
        | 'beta-patch'
        | 'pre-beta'
        | 'alpha-beta'
        | 'alpha-major'
        | 'alpha-minor'
        | 'alpha-patch'

export type VersionResult = Record<CustomReleaseType, string>
