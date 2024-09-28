import redisClient from "../utils/redis.js";
import dbClient from "../utils/db.js";
import crypto from 'crypto';

export default class UsersController{
    static postNew(req, res) {              
      const { email } = req.body;
      const { password } = req.body;
       if (!email) {
         res.status(400).json({"error":"Missing email"});
       }
       else if (!password) {
        res.status(400).json({"error":"Missing password"});
       }
       const users = dbClient.db.collection('users');
       users.findOne({email}, (error, user) => {
        if (user) {
            res.status(400).json({ error: 'Already exist' });
        }
        else {
            const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
            users.insertOne({ email, password: hashedPassword }, (err, result) => {
                if (err) {
                    res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    res.status(201).json({ id: result.insertedId, email });
                }
            });
        }
       })
    }
}
