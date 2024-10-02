import { promises as fs } from 'fs';
import { ObjectID, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid'; // Correct UUID import
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class FilesController {
  static async getUser(request) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (userId) {
      const users = dbClient.db.collection('users');
      const idObject = new ObjectID(userId);
      const user = await users.findOne({ _id: idObject });
      if (!user) {
        return null;
      }
      return user;
    }
    return null;
  }

  static async postUpload(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      console.log('Token cannot be extracted');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      console.log('UserId cannot be found');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const users = dbClient.db.collection('users');
    const idObject = new ObjectID(userId);
    const user = await users.findOne({ _id: idObject });
    if (!user) {
      console.log('User cannot be found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, // Filename
      type, // Type of the file (folder, file, image)
      parentId = '0', // Parent ID default to '0' (root)
      isPublic = false, // Public flag, default is false
      data, // Base64 encoded file data
    } = req.body;
    console.log(req.body);

    // Ensure 'parentId' has a default value if undefined
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const acceptedTypes = ['folder', 'file', 'image'];
    if (!type || !acceptedTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (data === null && type === 'folder') {
      return res.status(400).json({ error: 'Cannot upload file as folder' });
    }

    // If 'parentId' is provided, validate that the parent is a folder
    if (parentId !== '0') {
      const parentFolder = await dbClient.db.collection('files').findOne({ _id: new ObjectID(parentId) });

      if (!parentFolder) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parentFolder.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const files = dbClient.db.collection('files');
    if (type === 'folder') {
      const result = await files.insertOne({
        userId: user._id,
        name,
        type,
        parentId: parentId || '0',
        isPublic,
      });

      return res.status(201).json({
        id: result.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || '0',
      });
    }
    // Create folder and save file
    const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const fname = `${filePath}/${uuidv4()}`;
    const buff = Buffer.from(data, 'base64');
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(filePath, { recursive: true });
      await fs.writeFile(fname, buff, 'utf-8');
    } catch (error) {
      console.error('File saving error:', error);
      return res.status(500).json({ error: 'Could not save the file' });
    }

    const result = await files.insertOne({
      userId: user._id,
      name,
      type,
      isPublic,
      parentId: parentId || '0',
      localPath: fname,
    });

    return res.status(201).json({
      id: result.insertedId,
      userId: user._id,
      name,
      type,
      isPublic,
      parentId: parentId || '0',
      localPath: fname,
    });
  }

  static async getShow(req, res) {
    try {
      const token = req.header('X-Token');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const key = `auth_${token}`;
      const id = await redisClient.get(key);
      if (id) {
        const users = dbClient.db.collection('users');
        await users.findOne({ _id: ObjectId(id) }, async (error, user) => {
          if (user) {
            try {
              const fileId = req.params.id;
              if (!fileId) {
                return res.status(404).json({ error: 'not found' });
              }
              const files = dbClient.db.collection('files');
              const file = await files.findOne({ userId: ObjectId(id), _id: ObjectId(fileId) });
              if (!file) {
                return res.status(404).json({ error: 'not found' });
              }
              return res.status(200).json(file);
            } catch (error) {
              console.log(error);
            }
          }
          console.log('not found user?????');

          return res.status(401).json({ error: 'Unauthorized' });
        });
      } else {
        console.log('id??????');

        res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return 0;
  }

  static async getIndex(req, res) {
    const user = await FilesController.getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const {
      parentId,
      page,
    } = req.query;
    const pageNum = page || 0;
    const files = dbClient.db.collection('files');
    let query;
    if (!parentId) {
      query = { userId: user._id };
    } else {
      query = { parentId: parentId, userId: user._id };
    }
    files.aggregate(
      [
        { $match: query },
        { $sort: { _id: -1 } },
        {
          $facet: {
            metadata: [{ $count: 'total' }, { $addFields: { page: parseInt(pageNum, 10) } }],
            data: [{ $skip: 20 * parseInt(pageNum, 10) }, { $limit: 20 }],
          },
        },
      ],
    ).toArray((err, result) => {
      if (res) {
        const finalFormat = result[0].data.map((file) => {
          const formattedFile = {
            ...file,
            id: file._id,
          };
          delete formattedFile._id;
          delete formattedFile.localPath;
          return formattedFile;
        });
        return res.status(200).json(finalFormat);
      }
      if (err) {
        console.log(err);
      }
      return 0;
    });
    return 0;
  }
}
