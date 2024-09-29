import crypto from 'crypto';
import {ObjectId} from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class UsersController {
  static postNew(req, res) {
    const { email } = req.body;
    const { password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const users = dbClient.db.collection('users');

    users.findOne({ email }, (err, user) => { // Added return here
      if (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (user) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      users.insertOne({ email, password: hashedPassword },
        (err, result) => { // Added return here
          if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
          }
          return res.status(201).json({ id: result.insertedId, email });
        });
    });
  }

  static async getMe(req, res) {
    try {
      const token = req.header('X-Token');
      if (!token) {
        console.log('token not found');

        return res.status(401).json({ error: 'Unauthorized' });
      }
      const key = `auth_${token}`;
      const id = await redisClient.get(key);
      if (id) {
        const users = dbClient.db.collection('users');
        await users.findOne({ _id: new ObjectId(id) }, (error, user) => {
          if (user) {
            return res.status(200).json({ id: user._id, email: user.email });
          }
          console.log('not found user?????');

          return res.status(401).json({ error: 'Unauthorized' });
        });
      } else {
        console.log('id??????');

        return res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      console.log(error);

      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
