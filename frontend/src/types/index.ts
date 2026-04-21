export interface RoomSettings {
    maxPlayers: number;
    rounds: number;
    drawTime: number;
    language?: string;
    customWords?: string[];
    isPublic?: boolean;
}
  
export interface PlayerData {
    id: string;
    username: string;
    score: number;
    isReady: boolean;
    hasGuessed: boolean;
    avatarUrl?: string; 
}

export interface GameStateData {
    status: 'LOBBY' | 'CHOOSING_WORD' | 'DRAWING' | 'ROUND_END' | 'GAME_OVER';
    currentRound: number;
    totalRounds: number;
    currentDrawer: string | null;
    wordHints: string | null;
    timeLeft: number;
}

export interface RoomState {
    roomId: string;
    host: string | null;
    settings: RoomSettings;
    players: PlayerData[];
    gameState: GameStateData;
}
