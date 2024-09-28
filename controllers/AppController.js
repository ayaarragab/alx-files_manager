import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class AppController {
  static async getStatus(req, res) {
    res.status(200).json({
      redis: await redisClient.isAlive(),
      db: await dbClient.isAlive(),
    });
  }

  static async getStats(req, res) {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();

    res.statusCode = 200;
    res.end(JSON.stringify({ users: usersCount, files: filesCount }));
  }
}
