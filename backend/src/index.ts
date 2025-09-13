import express from 'express';
import cors from 'cors';
import { DatabaseService } from './services/database';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const db = new DatabaseService();

// Connect to MongoDB when starting the server
db.connect()
    .then(() => {
        console.log('Connected to MongoDB Atlas');
    })
    .catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await db.getUser(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const result = await db.createUser(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/users/:id/settings', async (req, res) => {
    try {
        const settings = await db.getUserSettings(req.params.id);
        if (!settings) {
            return res.status(404).json({ error: 'Settings not found' });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/users/:id/settings', async (req, res) => {
    try {
        const result = await db.updateSettings(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await db.disconnect();
    process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});