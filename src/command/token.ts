import process from 'node:process'
import { resolveConfig } from '@/config.ts'
import { setToken } from '@/token.ts'
import { printWarning } from '@/utils.ts'

export const token = async (token: string = '') => {
    try {
        const config = await resolveConfig()
        await setToken(config, token)
    }
    catch (error: any) {
        printWarning(error.message)
        process.exit(0)
    }
}
