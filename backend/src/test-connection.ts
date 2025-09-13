import { MongoClient, ServerApiVersion } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI as string;

if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
    throw new Error('Invalid MONGODB_URI. Must start with "mongodb://" or "mongodb+srv://"');
}

async function testConnection() {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Successfully connected to MongoDB!");
        console.log("Using URI:", uri.replace(/\/\/[^@]*@/, '//<credentials>@')); // Safely log URI without credentials
    } catch (error) {
        console.error("Connection failed:", error);
    } finally {
        await client.close();
        console.log("Connection closed.");
    }
}

testConnection();