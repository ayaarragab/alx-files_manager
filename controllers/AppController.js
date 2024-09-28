import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

/**
 * Controller class for application status and statistics.
 */
export default class AppController {
  /**
   * Retrieves the status of the Redis and database clients.
   * 
   * @param {Object} _ - The request object (not used).
   * @param {Object} res - The response object.
   * @returns {Promise<void>} - A promise that resolves when the status is sent.
   */
  static async getStatus(_, res) {}

  /**
   * Retrieves the statistics of the application, including the number of users and files.
   * 
   * @param {Object} _ - The request object (not used).
   * @param {Object} res - The response object.
   * @returns {Promise<void>} - A promise that resolves when the statistics are sent.
   */
  static async getStats(_, res) {

    res.status(200).json({
      redis: await redisClient.isAlive(),
      db: await dbClient.isAlive()
    });
  }

  static async getStats(_, res) {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();

    res.statusCode = 200;
    res.end(JSON.stringify({ users: usersCount, files: filesCount }));
  }
}
