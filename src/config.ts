interface Iconfig {
    minInterval: number
    default: {
        interval: number
        retries: number
        timeout: number
        headers: { [key: string]: string } | undefined
        available: null
        uptime: null
        ping: null
        unavailability: null
        failures: number
    }
}

export const config: Iconfig = {
    minInterval: 3000,
    default: {
        interval: 3000,
        retries: 3,
        timeout: 3000,
        headers: undefined,
        available: null,
        uptime: null,
        ping: null,
        unavailability: null,
        failures: 0
    }
}