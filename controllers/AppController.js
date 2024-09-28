import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class AppController {
  static async getStatus(req, res) {
    if (dbClient.isAlive() && redisClient.isAlive()) {
      res.status(200).json({
        redis: await redisClient.isAlive(),
        db: await dbClient.isAlive(),
      });
    }
  }

  static async getStats(req, res) {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();
    res.status(200).json({ users: usersCount, files: filesCount })
  }
}
