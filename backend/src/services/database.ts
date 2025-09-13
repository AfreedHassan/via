import { MongoClient, ServerApiVersion } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

// MongoDB Atlas URI should start with mongodb+srv://
const uri:string = process.env.MONGODB_URI as string;

if (!uri || !uri.startsWith('mongodb+srv://')) {
    throw new Error('Invalid MONGODB_URI. Must be a MongoDB Atlas URI starting with mongodb+srv://');
}

export class DatabaseService {
    private client: MongoClient;

    constructor() {
        // Configure client with Atlas-specific options
        this.client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            // Additional Atlas-specific options
            maxPoolSize: 50,
            wtimeoutMS: 2500
        });
    }

    async connect() {
        try {
            // Connect to MongoDB Atlas cluster
            await this.client.connect();
            // Verify connection with ping
            await this.client.db("admin").command({ ping: 1 });
            console.log("Successfully connected to MongoDB Atlas!");
        } catch (error) {
            console.error("Connection to MongoDB Atlas failed:", error);
            throw error;
        }
    }

    // User operations
    async getUser(userId: string) {
        try {
            return await this.client.db("via").collection("users").findOne({ _id: userId });
        } catch (error) {
            console.error("Error fetching user:", error);
            throw error;
        }
    }

    async createUser(userData: { email: string; name?: string }) {
        try {
            const result = await this.client.db("via").collection("users").insertOne(userData);
            return result;
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    }

    async updateUser(userId: string, updates: Partial<{ email: string; name: string }>) {
        try {
            return await this.client.db("via").collection("users")
                .updateOne({ _id: userId }, { $set: updates });
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    }

    // Settings operations
    async getUserSettings(userId: string) {
        try {
            return await this.client.db("via").collection("settings")
                .findOne({ userId });
        } catch (error) {
            console.error("Error fetching settings:", error);
            throw error;
        }
    }

    async updateSettings(userId: string, settings: { theme?: string }) {
        try {
            return await this.client.db("via").collection("settings")
                .updateOne(
                    { userId },
                    { $set: settings },
                    { upsert: true }
                );
        } catch (error) {
            console.error("Error updating settings:", error);
            throw error;
        }
    }

    async disconnect() {
        try {
            await this.client.close();
            console.log("Disconnected from MongoDB Atlas");
        } catch (error) {
            console.error("Error disconnecting from MongoDB Atlas:", error);
            throw error;
        }
    }
}