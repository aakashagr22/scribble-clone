import { Room } from './Room';
import { Player } from './Player';
import { getRandomWords, getLevenshteinDistance, normalizeWord } from '../utils/wordUtils';
import { PrismaClient } from '@prisma/client';
import { GameStateData } from '../types';

const prisma = new PrismaClient();

export default class Game {
  public room: Room;
  public status: 'LOBBY' | 'CHOOSING_WORD' | 'PLAYING' | 'ROUND_END' | 'GAME_OVER';
  public currentDrawerId: string | null;
  public currentWord: string;
  public timer: number;
  public intervalId: NodeJS.Timeout | null;
  public chooseTimer: number;

  public drawerQueue: string[];
  public currentRoundNumber: number;
  public currentChoices: string[];
  public revealedHintIndices: number[];
  public correctGuessers: Set<string>; 
  public hintTimer: NodeJS.Timeout | null; 

  constructor(room: Room) {
    this.room = room;
    this.status = 'LOBBY';
    this.currentDrawerId = null;
    this.currentWord = "";
    this.timer = 0;
    this.intervalId = null;
    this.chooseTimer = 0;
    
    this.drawerQueue = [];
    this.currentRoundNumber = 1;
    this.currentChoices = [];
    this.revealedHintIndices = [];
    this.correctGuessers = new Set<string>(); 
    this.hintTimer = null;
  }

  startGame(): void {
    if (this.room.players.size < 2) return; 
    
    this.drawerQueue = Array.from(this.room.players.keys());
    this.startRound();
  }

  startRound(): void {
    if (this.drawerQueue.length === 0) {
        if (this.currentRoundNumber < this.room.settings.rounds) {
            this.currentRoundNumber++;
            this.drawerQueue = Array.from(this.room.players.keys());
        } else {
            this.endGame();
            return;
        }
    }

    this.status = 'CHOOSING_WORD';
    this.currentDrawerId = this.drawerQueue.shift() || null;
    
    if (!this.currentDrawerId) {
        this.endGame();
        return;
    }

    const baseChoices = getRandomWords(3);
    const customWords = this.room.settings.customWords || [];
    
    
    if (customWords.length > 0 && Math.random() > 0.5) {
        const injectedCustom = customWords[Math.floor(Math.random() * customWords.length)];
        baseChoices[Math.floor(Math.random() * 3)] = injectedCustom;
    }

    this.currentChoices = baseChoices;
    
    if (this.intervalId) clearInterval(this.intervalId);
    this.chooseTimer = 10;
    this.intervalId = setInterval(() => {
        this.chooseTimer--;
        if (this.chooseTimer <= 0) {
            this.selectWord(this.currentChoices[Math.floor(Math.random() * this.currentChoices.length)]);
        }
    }, 1000);
    
    this.room.players.forEach(p => p.resetRoundStatus());

    this.room.broadcast('room_update', this.room.getRoomState());
    this.room.broadcast('game_state_update', this.getState());
    
    const drawerSocket = this.room.io.sockets.sockets.get(this.currentDrawerId);
    if (drawerSocket) {
        drawerSocket.emit('word_choices', baseChoices);
    }
  }

  selectWord(word: string): void {
      if (this.status !== 'CHOOSING_WORD') return;
      this.currentWord = word;
      this.status = 'PLAYING';
      this.timer = this.room.settings.drawTime;
      this.revealedHintIndices = [];
      this.correctGuessers = new Set<string>(); 
      
      console.log(`[ROUND ${this.currentRoundNumber}] Word selected: ${word}, Starting 60s round`); 
      this.room.broadcast('game_state_update', this.getState());
      
      if (this.currentDrawerId) {
        const drawerSocket = this.room.io.sockets.sockets.get(this.currentDrawerId);
        if (drawerSocket) {
            drawerSocket.emit('secret_word', this.currentWord);
        }
      }

      if (this.intervalId) clearInterval(this.intervalId);
      if (this.hintTimer) clearInterval(this.hintTimer);


      this.intervalId = setInterval(() => this.tick(), 1000);
      
      const hintRevealInterval = 15000; 
      this.hintTimer = setInterval(() => this.revealHint(), hintRevealInterval);
  }

  endGame(): void {
      this.status = 'GAME_OVER';
      this.room.broadcast('game_state_update', this.getState());
      

      this.room.players.forEach(async (player) => {
          if (!player.username || player.username === 'Guest') return;
          try {
              await prisma.user.upsert({
                  where: { username: player.username },
                  update: { played: { increment: 1 } },
                  create: {
                      username: player.username,
                      played: 1,
                      won: 0,
                  }
              });
          } catch (e) {
              console.error("Failed to save score for via Prisma", player.username, e);
          }
      });
      
      this.room.broadcast('room_update', this.room.getRoomState());
  }

  tick(): void {
    this.timer--;
    if (this.timer <= 0) {
      this.endRound();
    } else {
        this.room.broadcast('timer_update', this.timer);
    }
  }

  revealHint(): void {
    if (this.status !== 'PLAYING' || !this.currentWord) return;
    
    let possibleIndices: number[] = [];
    for(let i = 0; i < this.currentWord.length; i++) {
        if (this.currentWord[i] !== ' ' && !this.revealedHintIndices.includes(i)) {
            possibleIndices.push(i);
        }
    }
    
    if (possibleIndices.length > 0) {
        const idx = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
        this.revealedHintIndices.push(idx);
        
        console.log(`[HINT] Revealed index ${idx}: '${this.currentWord[idx]}' in word '${this.currentWord}'`); // DEBUG
        
      
        const hintStr = this.generateHintString();
        this.room.broadcast('hint_update', { hint: hintStr });
        this.room.broadcast('game_state_update', this.getState());
    }
  }

  generateHintString(): string {
    let hintStr = "";
    if (this.status === 'PLAYING' && this.currentWord) {
       for(let i = 0; i < this.currentWord.length; i++) {
           if (this.currentWord[i] === ' ') {
               hintStr += '  ';
           } else if (this.revealedHintIndices && this.revealedHintIndices.includes(i)) {
               hintStr += this.currentWord[i] + ' ';
           } else {
               hintStr += '_ ';
           }
       }
    }
    return hintStr.trim();
  }

  checkGuess(player: Player, guess: string): boolean {
    if (this.status !== 'PLAYING') return false;
    if (!player || !player.id) {
        console.error(`[ERROR] Invalid player in checkGuess:`, player);
        return false;
    }
    if (player.id === this.currentDrawerId) {
        console.log(`[GUESS] Drawer ${player.username} (${player.id}) tried to guess - IGNORED`); 
        return false;
    }
    if (player.hasGuessed) {
        console.log(`[GUESS] ${player.username} (${player.id}) already guessed - IGNORED`); 
        return false;
    }

    const normalizedGuess = normalizeWord(guess);
    const normalizedTarget = normalizeWord(this.currentWord);

    if (normalizedGuess === normalizedTarget) {
      console.log(`[GUESS] ${player.username} (${player.id}) guessed correctly: "${guess}" vs "${this.currentWord}"`);
      
      if (this.correctGuessers.has(player.id)) {
          console.log(`[GUESS] ${player.username} (${player.id}) already in correctGuessers set - IGNORED (duplicate)`); // DEBUG
          return true; 
      }

      this.correctGuessers.add(player.id);
      player.hasGuessed = true;
      
      const points = 100;
      
      const oldScore = player.score;
      player.addScore(points);
      const newScore = player.score;
      
      console.log(`[SCORE] ONLY ${player.username} (${player.id}) gets ${points} points. Old: ${oldScore} → New: ${newScore}`); // DEBUG
      console.log(`[CORRECTGUESSERS SET] Now contains: ${Array.from(this.correctGuessers).join(', ')}`);
      
      console.log(`[ALL PLAYERS AFTER SCORE]`);
      this.room.players.forEach((p, id) => {
        const marker = id === player.id ? '>>> JUST SCORED >>> ' : '    ';
        console.log(`  ${marker}${p.username} (${id}): ${p.score}`);
      });
      
      this.savePlayerScore(player, points);

      this.room.broadcast('correct_guess', { username: player.username });
      
      const playersData = Array.from(this.room.players.values()).map(p => ({
          id: p.id,
          username: p.username,
          score: p.score,
          isReady: p.isReady,
          hasGuessed: p.hasGuessed,
          avatarUrl: p.avatarUrl
      }));
      
      console.log(`[BROADCAST] score_update with ${playersData.length} players:`, playersData.map(p => `${p.username}:${p.score}`).join(', '));
      
      this.room.broadcast('score_update', playersData);

      const nonDrawers = Array.from(this.room.players.values()).filter(p => p.id !== this.currentDrawerId);
      const allGuessed = nonDrawers.length > 0 && nonDrawers.every(p => p.hasGuessed);

      if (allGuessed) {
          console.log(`[ROUND] All ${nonDrawers.length} players guessed correctly! Ending round early.`); 
          this.endRound();
      } else {
          console.log(`[ROUND] Progress: ${this.correctGuessers.size}/${nonDrawers.length} players guessed`); 
      }
      
      return true; 
    }
    
    if (normalizedTarget.length > 3) {
      const distance = getLevenshteinDistance(normalizedGuess, normalizedTarget);
      if (distance <= 2) {
        const pSocket = this.room.io.sockets.sockets.get(player.id);
        if (pSocket) {
            console.log(`[GUESS] Close guess from ${player.username}: '${guess}' (distance: ${distance})`); 
            pSocket.emit('close_guess', { message: `'${guess}' is very close!` });
        }
      }
    }

    return false;
  }

  endRound(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.hintTimer) clearInterval(this.hintTimer); 
    
    this.status = 'ROUND_END';
    
    let correctGuesserCount = 0;
    for (const [id, p] of this.room.players.entries()) {
        if (id !== this.currentDrawerId && p.hasGuessed) {
            correctGuesserCount++;
        }
    }

    console.log(`[ROUND END] Word: '${this.currentWord}', Correct guessers: ${correctGuesserCount}`); 

    this.room.broadcast('round_end', { word: this.currentWord });
    this.room.broadcast('game_state_update', this.getState());
    this.room.broadcast('room_update', this.room.getRoomState()); 
    
    setTimeout(() => this.startRound(), 5000);
  }

  handlePlayerLeave(socketId: string): void {
    if (this.currentDrawerId === socketId && this.status === 'PLAYING') {
      this.endRound(); 
    }
  }

  getState(): Partial<GameStateData> {
    const drawerName = this.currentDrawerId 
      ? this.room.players.get(this.currentDrawerId)?.username || 'Unknown'
      : null;
    
    return {
      status: this.status === 'PLAYING' ? 'DRAWING' : this.status as any,
      currentRound: this.currentRoundNumber,
      totalRounds: this.room.settings?.rounds || 3,
      currentDrawer: this.currentDrawerId,
      currentDrawerName: drawerName,
      timeLeft: this.timer,
      wordHints: this.generateHintString()
    };
  }

  async savePlayerScore(player: Player, points: number): Promise<void> {
      if (!player.username || player.username === 'Guest') return;
      try {
          await prisma.user.upsert({
              where: { username: player.username },
              update: { totalPoints: { increment: points } }, 
              create: {
                  username: player.username,
                  totalPoints: points,
                  played: 0,
                  won: 0,
              }
          });
      } catch (e) {
          console.error("Failed real-time save for DB", e);
      }
  }
}
