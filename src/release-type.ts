import type { ReleaseType as SemverReleaseType } from 'semver'

export type ReleaseType = SemverReleaseType | 'next' | 'conventional'

export type releaseType
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
        | 'date-version'

export type ReleaseTypes = Record<releaseType, string>
