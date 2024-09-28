import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import fs from 'fs/promises';
import ObjectId from 'mongodb';


export default class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      console.log("here?");
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const {
      name, // Filename
      type, // Type of the file (folder, file, image)
      parentId, // Parent ID, default is 0 (root)
      isPublic = false, // Public flag, default is false
      data, // Base64 encoded file data
    } = req.body;


    if (!parentId) parentId = '0';
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

    if (data && type === 'folder') {
      return res.status(400).json({ error: 'cannot upload file as folder' });
    }


    if (parentId !== '0') {
      const parentFolder = await DBCrud.findFile({ _id: new ObjectId(parentId) });


      // Check if the parent folder exists
      if (!parentFolder) {
        return res.status(400).json({ error: 'Parent not found' });
      }


      if (parentFolder.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    const files = dbClient.db.collection('files');
    if (type === 'folder') {
      files.insertOne(
        {
          userId: user._id,
          name,
          type,
          parentId: parentId || 0,
          isPublic,
        });
        res.status(201).json({
        id: result.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      });
    } else {
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fname = `${filePath}/${uuidv4()}`;
      const buff = Buffer.from(data, 'base64');
      try {
        try {
          await fs.mkdir(filePath);
        } catch (error) {
        }
      await fs.writeFile(fname, buff, 'utf-8');
      } catch (error) {
        console.log(error);
      }
        files.insertOne({
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
          localPath: fname
        }).then((res) => {
          res.status(201).json({
            id: result.insertedId,
            userId: user._id,
            name,
            type,
            isPublic,
            parentId: parentId || 0
          })
        });
    }
  }
}
