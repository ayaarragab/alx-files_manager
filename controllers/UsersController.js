import crypto from 'crypto';
import dbClient from '../utils/db';

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

    return users.findOne({ email }, (err, user) => { // Added return here
      if (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (user) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      return users.insertOne({ email, password: hashedPassword },
        (err, result) => { // Added return here
          if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
          }
          return res.status(201).json({ id: result.insertedId, email });
        });
    });
  }
}
