import { Server, Socket } from 'socket.io';
import { Room } from '../classes/Room';
import { Player } from '../classes/Player';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const saveInitialUser = async (username: string): Promise<void> => {
    if (!username || username === 'Guest') return;
    try {
        await prisma.user.upsert({
            where: { username },
            update: {}, 
            create: {
                username,
                played: 0,
                won: 0,
            }
        });
    } catch (e) {
        console.error("Initial DB insert failed via Prisma", e);
    }
};

const handleSockets = (io: Server, rooms: Map<string, Room>): void => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);
    let currentRoomId: string | null = null;

    socket.on('get_public_rooms', () => {
       const publicRooms: any[] = [];
       for(const [roomId, room] of rooms.entries()) {
           if (room.settings.isPublic) {
               publicRooms.push({ roomId, playerCount: room.players.size, maxPlayers: room.settings.maxPlayers });
           }
       }
       socket.emit('public_rooms_list', publicRooms);
    });

    socket.on('create_room', ({ username, settings }: { username: string, settings: any }) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      currentRoomId = roomId;
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Room(roomId, io, settings));
      }
      
      const room = rooms.get(roomId);
      if (room) {
        const player = new Player(socket.id, username);
        room.addPlayer(player);
        console.log(`[ROOM] ${username} created room ${roomId} (public: ${room.settings.isPublic})`); 
        socket.emit('room_created', roomId);

        if (room.settings.isPublic) {
            io.emit('public_rooms_update');
        }
      }

      saveInitialUser(username);
    });

    socket.on('join_room', ({ roomId, username }: { roomId: string, username: string }) => {
      currentRoomId = roomId;
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Room(roomId, io, {}));
      }
      
      const room = rooms.get(roomId);
      if (room) {
        const player = new Player(socket.id, username);
        room.addPlayer(player);
        console.log(`[ROOM] ${username} joined room ${roomId} (${room.players.size}/${room.settings.maxPlayers})`); // DEBUG
        
        if (room.settings.isPublic) {
            io.emit('public_rooms_update');
        }
        
        if (room.game.status === 'PLAYING' && room.game.currentDrawerId) {
            const drawerSocket = io.sockets.sockets.get(room.game.currentDrawerId);
            if (drawerSocket) {
               drawerSocket.emit('request_canvas_state', { targetSocketId: socket.id });
            }
        }
      }

      saveInitialUser(username);
    });

    socket.on('player_ready', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (room && room.players.has(socket.id)) {
          const p = room.players.get(socket.id);
          if (p) p.isReady = true;
          room.broadcast('room_update', room.getRoomState());
      }
    });

    socket.on('start_game', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (room && room.players.has(socket.id)) {
          
          if (room.host === socket.id) {
              console.log(`[GAME] Host ${room.players.get(socket.id)?.username} started game in room ${currentRoomId}`); // DEBUG
              room.game.startGame();
          }
      }
    });

    socket.on('word_chosen', (word: string) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      if (room.game.currentDrawerId === socket.id) {
          room.game.selectWord(word);
      }
    });

    socket.on('chat_msg', ({ text }: { text: string }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;
      
      const player = room.players.get(socket.id);
      if (!player) return;

      console.log(`[CHAT] ${player.username}: "${text}"`); 

      const isCorrect = room.game.checkGuess(player, text);
      if (!isCorrect) {
         room.broadcast('chat_msg', { sender: player.username, text: text });
      }
    });

    socket.on('draw_start', (data: any) => {
      if (currentRoomId) socket.to(currentRoomId).emit('draw_start', data);
    });
    
    socket.on('draw_move', (data: any) => {
      if (currentRoomId) socket.to(currentRoomId).emit('draw_move', data);
    });

    socket.on('draw_move_batched', (data: any) => {
      if (currentRoomId) socket.to(currentRoomId).emit('draw_move_batched', data);
    });

    socket.on('draw_end', () => {
      if (currentRoomId) socket.to(currentRoomId).emit('draw_end');
    });

    socket.on('draw_data', (stroke: any) => {
      if (currentRoomId) socket.to(currentRoomId).emit('draw_data', stroke);
    });

    socket.on('canvas_clear', () => {
      if (currentRoomId) socket.to(currentRoomId).emit('canvas_clear');
    });

    socket.on('draw_undo', () => {
      if (currentRoomId) socket.to(currentRoomId).emit('draw_undo');
    });

    socket.on('vote_kick', ({ targetPlayerId }: { targetPlayerId: string }) => {
        if (currentRoomId && rooms.has(currentRoomId)) {
            const room = rooms.get(currentRoomId);
            if (room) room.voteKickManager.registerVote(socket.id, targetPlayerId);
        }
    });

    socket.on('canvas_state_send', ({ targetSocketId, base64Image }: { targetSocketId: string, base64Image: string }) => {
       
        if (currentRoomId) {
            io.to(targetSocketId).emit('canvas_state_sync', base64Image);
        }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      if (currentRoomId && rooms.has(currentRoomId)) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const wasPublic = room.settings.isPublic;
            room.removePlayer(socket.id);
            
            if (room.players.size === 0) {
                rooms.delete(currentRoomId);
                
                if (wasPublic) {
                    io.emit('public_rooms_update');
                }
            }
          }
      }
    });
  });
};

export default handleSockets;
