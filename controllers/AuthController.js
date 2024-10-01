import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class AuthController {
  static async getConnect(request, response) {
    const auth = request.header('Authorization');
    if (!auth) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    let dataOneStr = auth.split(' ')[1];
    const buff = Buffer.from(dataOneStr, 'base64');
    dataOneStr = buff.toString('ascii');
    const data = dataOneStr.split(':');
    if (data.length !== 2) {
      return response.status(401).json({ error: 'Unauthorized' });
    }
    const hashedP = sha1(data[1]);

    // Ensure MongoDB connection is established before accessing the collection
    await dbClient.connecting;

    const users = dbClient.db.collection('users');
    users.findOne({ email: data[0], password: hashedP }, async (_, user) => {
      if (user) {
        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
        return response.status(200).json({ token });
      }
      return response.status(401).json({ error: 'Unauthorized' });
    });
    return 0;
  }

  static async getDisconnect(request, response) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    if (id) {
      await redisClient.del(key);
      return response.status(204).json({});
    }
    return response.status(401).json({ error: 'Unauthorized' });
  }
}
