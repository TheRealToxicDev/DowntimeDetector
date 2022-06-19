import { IOptions, IOutage, IUp } from './types';
import { EventEmitter } from 'events';
import { config } from './config';
import fetch from 'node-fetch';

export class DownDetector extends EventEmitter {
    public url: string;
	public interval: number = config.default.interval;
	public retries: number = config.default.retries;
	public timeout: number = config.default.timeout
	public headers: ({ [key: string]: string } | undefined) = config.default.headers;
	public available: (boolean | null) = config.default.available;
	public uptime: (number | null) = config.default.uptime;
	public ping: (number | null) = config.default.ping;
	public unavailability: (number | null) = config.default.unavailability;

	private startTime: number = Date.now();;
	private lastSuccessCheck: number = Date.now();;
	private intervalFunction: any;
	private failures: (number) = config.default.failures

    constructor(url: string, options?: IOptions) {

        super()

        if (!url) throw new Error('Invalid URL Provided or URL is missing. Please check the URL and try again!');

        this.url = url;

        if (options) {

            if (options.interval) {
                if (typeof options.interval !== 'number') throw new TypeError('INVALID_OPTION: Interval should be a valid Integer or Number');
                if (options.interval < config.minInterval) throw new RangeError(`INVALID_RANGE: Interval should be greater then ${config.minInterval}ms`);
                this.interval = options.interval;
            }

            if (options.retries) {
                if (typeof options.retries !== 'number') throw new TypeError('INVALID_OPTION: Retries should be a valid Integer or Number.');
                if (options.retries < config.default.retries) throw new RangeError(`INVALID_RANGE: Retries should be greater then the default value of "3"`)
                this.retries = options.retries;
            }

            if (options.timeout) {
                if (typeof options.timeout !== 'number') throw new TypeError('INVALID_OPTION: Timeout should be a valid Integer or Number.');
                if (options.timeout < config.default.timeout) throw new RangeError(`INVALID_RANGE: Timeout should be greater then ${config.default.timeout}ms`)
                this.timeout = options.timeout;
            }

            if (options.headers) {
                if (typeof options.headers !== 'object') throw new TypeError('INVALID_OPTION: Headers should be a valid object.');
                this.headers = options.headers;
            }
        }
    }

    private fetchURL() {
        const startPing: number = Date.now();
        const timeout: Promise<Error> = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('timeout'));
            }, this.timeout);
        });

        const fetchFunction = new Promise((resolve, reject) => {
            
        })
    }
}
