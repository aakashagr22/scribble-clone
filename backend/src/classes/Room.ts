import { Server, Socket } from 'socket.io';
import { Player } from './Player';
import Game from './Game';
import { VoteKickManager } from './VoteKickManager';
import { RoomSettings, RoomState } from '../types';

export class Room {
  public id: string;
  public io: Server;
  public settings: RoomSettings;
  public players: Map<string, Player>;
  public host: string | null;
  public game: Game;
  public voteKickManager: VoteKickManager;

  constructor(roomId: string, io: Server, settings?: Partial<RoomSettings>) {
    this.id = roomId;
    this.io = io;
    this.settings = {
      maxPlayers: settings?.maxPlayers || 8,
      rounds: settings?.rounds || 3,
      drawTime: settings?.drawTime || 60,
      language: settings?.language || 'en',
      isPublic: settings?.isPublic || false, 
      customWords: settings?.customWords || []
    } as RoomSettings;
    this.players = new Map<string, Player>();
    this.host = null;
    this.game = new Game(this);
    this.voteKickManager = new VoteKickManager(this);
  }

  addPlayer(player: Player): void {
    if (this.players.size === 0) {
      this.host = player.id;
    }
    this.players.set(player.id, player);
    
    const socket = this.io.sockets.sockets.get(player.id);
    if (socket) socket.join(this.id);
    
    this.broadcast('room_update', this.getRoomState());
  }

  removePlayer(socketId: string): void {
    this.players.delete(socketId);
    
    if (this.host === socketId && this.players.size > 0) {
      this.host = Array.from(this.players.keys())[0];
    }
    
    this.game.handlePlayerLeave(socketId);
    this.voteKickManager.removeTarget(socketId);
    
    this.broadcast('room_update', this.getRoomState());
  }

  broadcast(event: string, data: any): void {
    if (event === 'room_update') {
      console.log(`[ROOM BROADCAST] room_update with players:`, (data as any).players?.map((p: any) => `${p.username}:${p.score}`).join(', '));
    }
    this.io.to(this.id).emit(event, data);
  }

  getRoomState(): RoomState {
    return {
      roomId: this.id,
      host: this.host,
      settings: this.settings,
      players: Array.from(this.players.values()),
      gameState: this.game.getState() as any 
    };
  }
}
