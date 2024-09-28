import sha1 from 'sha1';
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
import { v4 as uuidv4 } from 'uuid';

export default class AuthController {
    static getConnect(request, response) {
        const auth = request.header('Authorization');
        
        let dataOneStr = auth.split(' ')[1]
        const buff = Buffer.from(dataOneStr, 'base64');
        dataOneStr = buff.toString('ascii');
        const data = dataOneStr.split(':');
        if (data.length !== 2) {
            response.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const hashedP = sha1(data[1]);
        
        const users = dbClient.db.collection('users');
        users.findOne({email: data[0], password: hashedP}, async (_, user) => {
            if (user) {
                const token = uuidv4();
                const key = `auth_${token}`;
                await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
                return response.status(200).json({token: token})
            }
        })
    }

    static async getDisconnect(request, response) {
        const token = request.header('X-Token');
        const key = `auth_${token}`;
        const id = await redisClient.get(key);
        if (id) {
            await redisClient.del(key);
            return response.status(204).json({});
        } else {
            response.status(401).json({ error: 'Unauthorized' });
        }
    }

}
