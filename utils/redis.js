import redis from 'redis';
import { promisify } from 'util';
class RedisClient{
    constructor() {
        this.client = redis.createClient();
        this.getAsync = promisify(this.client.get).bind(this.client);
        this.client.on('error', (err) => {
            console.error('Redis Client Error', err);
        });
    }
    isAlive() {
        return this.client.connected;
    }
    async get(key) {
        const val = await this.getAsync(key);
        return val;
    }
    async set(key, value, duration) {
        await this.client.set(key, value, 'EX', duration);
    }
    async del(key) {
        await this.client.del(key);
    }
}

const redisClient = new RedisClient();
export default redisClient;
