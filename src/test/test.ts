import { DownDetector } from "../index";

const Monitor = new DownDetector("https://google.com", {
    interval: 3000,
    timeout: 5000,
    headers: { 'Cache-Control': 'no-cache' }
});

Monitor.start();
console.log(Monitor.infos);

Monitor.on('outage', (outage) => {
    console.log(outage);
});

Monitor.on('up', (up) => {
    console.log(up);
});

Monitor.on('error', (error) => {
    console.log(error);
})