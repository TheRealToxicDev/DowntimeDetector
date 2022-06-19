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
            fetch(this.url, { headers: this.headers })
            .then(res => {
                resolve({
                    statusCode: res.status,
                    statusText: res.statusText,
                    ping: Date.now() - startPing
                })
            }).catch(err => reject(err));
        })

        Promise.race([fetchFunction, timeout])
         .then((result: any) => {
            this.ping = result.ping;

            if (result.statusCode > 299) {
                this.failures++;
                console.log(`Monitor Failure: ${this.failures}`);

                if (this.failures > this.retries) {
                    this.emitOutage(result.statusCode, result.statusText);
                }
            } else {
                this.failures = 0;
                this.available = true;
                this.uptime = Date.now() - this.startTime;
                this.lastSuccessCheck = Date.now()
				this.emitUp(result.statusCode, result.statusText)
            }
         }).catch((error) => {

            if (error.message.match('timeout')) {
                this.failures++;
                console.log(`Monitor Failure: ${this.failures}`);

                if (this.failures > this.retries) {
                    this.emitOutage(undefined, 'timeout');
                }
            }
            else {
                if (error.message.match('Only absolute URLs are supported')) return this.emit('error', TypeError('INVALID_PARAMETER Only absolute URLs are supported'))
                if (error.message.match('ECONNREFUSED')) return this.emit('error', TypeError(`INVALID_PARAMETER Unknown host ${this.url}`))
                this.emit('error', error)
            }
         })
    }

    private emitOutage(statusCode?: number, statusText?: string) {
        this.available = false;
        this.unavailability = Date.now() - this.lastSuccessCheck;

        const outage: IOutage = {
            type: 'outage',
            statusCode: statusCode || undefined,
            statusText: statusText || undefined,
            url: this.url,
            ping: this.ping,
            unavailability: this.unavailability
        }

        this.emit('outage', outage);
    }

    private emitUp(statusCode?: number, statusText?: string) {
        this.available = false;
        this.unavailability = Date.now() - this.lastSuccessCheck;

        const up: IUp = {
            type: 'up',
            statusCode: statusCode || undefined,
            statusText: statusText || undefined,
            url: this.url,
            ping: this.ping,
            uptime: this.uptime
        }

        this.emit('up', up);
    }

    setInterval(newInterval: number): (boolean) {
        if (!newInterval) throw new Error(`MISSING_PARAMETER: Please provide a valid Interval Value greater then ${config.minInterval}`);
        if (newInterval < config.minInterval) throw new RangeError(`INVALID_PARAMETER: Interval must be greater then ${config.minInterval}`);
        this.interval = newInterval;
        return true;
    }

    setURL(newURL: string | number): (boolean) {
        if (!newURL) throw new Error(`MISSING_PARAMETER: Please provide a new URL to monitor`);
        if (typeof newURL !== 'string') throw new TypeError(`INVALID_PARAMETER: new URL should be a valid string`);
        this.url = newURL;
        return true;
    }

    start(): boolean {
		if (!this.url) throw new Error("MISSING_PARAMETER: Please provide a valid URL to monitor")
		this.intervalFunction = setInterval(() => { this.fetchURL() }, this.interval)
		return true;
	}

    restart(): boolean {
        clearInterval(this.intervalFunction);
        this.emit('restart');
        this.start();
        return true;
    }

    stop(): boolean {
        clearInterval(this.intervalFunction);
        this.emit('stopped', { reason: 'Stopped by client' });
        return true;
    }

    get infos() {
        return {
            "url": this.url,
			"interval": this.interval,
			"timeout": this.timeout,
			"available": this.available,
			"ping": this.ping,
			"uptime:": this.uptime,
			"unavailability": this.unavailability
        }
    }
}
