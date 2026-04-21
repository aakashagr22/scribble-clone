import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import handleSockets from './sockets/socketHandler';

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || "*"
}));
app.use(express.json());


console.log('Using Prisma/SQLite as per strict requirement.');


import leaderboardRouter from './routes/leaderboard.routes';
app.use('/api/leaderboard', leaderboardRouter);

app.get('/', (req: Request, res: Response) => {
  res.send('Skribbl.io Clone API is running with TypeScript & Prisma!');
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    message: message,
    errors: err.errors || []
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});

import { Room } from './classes/Room';
const rooms = new Map<string, Room>();

handleSockets(io, rooms);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
