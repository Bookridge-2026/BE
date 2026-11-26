const Redis = require('ioredis');

const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
};

const createClient = (name, extraOptions = {}) => {
    const client = new Redis({ ...redisOptions, ...extraOptions });
    client.on('connect', () => console.log(`[Redis:${name}] 연결 성공`));
    client.on('error', (err) => console.error(`[Redis:${name}] 오류:`, err.message || err.code));
    return client;
};


const publisher = createClient('pub', { enableOfflineQueue: false });
const subscriber = createClient('sub');

module.exports = { publisher, subscriber };
