import { PlayerData } from '../types';

export class Player implements PlayerData {
  public id: string;
  public username: string;
  public score: number;
  public isReady: boolean;
  public hasGuessed: boolean;
  public avatarUrl?: string;

  constructor(socketId: string, username?: string, avatarUrl?: string) {
    this.id = socketId;
    this.username = username || 'Guest';
    this.score = 0;
    this.isReady = false;
    this.hasGuessed = false;
    this.avatarUrl = avatarUrl;
  }

  addScore(points: number): void {
    this.score += points;
  }

  resetRoundStatus(): void {
    this.hasGuessed = false;
  }
}
