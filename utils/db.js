import pkg from 'mongodb';
const { MongoClient } = pkg;

const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || 27017;
const DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${HOST}:${PORT}/${DATABASE}`;

class DBClient{
    constructor() {
        this.client = new MongoClient(url, { useUnifiedTopology: true, useNewUrlParser: true });
        this.client.connect().then(() => {
            this.db = this.client.db(`${DATABASE}`);
        })
    }
    isAlive() {
        return this.client.isConnected();
    }

    async nbUsers() {
        return await this.client.db(`${DATABASE}`).collection('users').countDocuments();
    }

    async nbFiles() {
        return await this.client.db(`${DATABASE}`).collection('files').countDocuments();
    }
}

const dbClient = new DBClient();

export default dbClient;
