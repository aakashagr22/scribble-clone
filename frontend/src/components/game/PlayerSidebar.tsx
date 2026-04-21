import React from 'react';
import { PlayerData, GameStateData } from '../../types';

interface PlayerSidebarProps {
    players: PlayerData[];
    hostId: string | null;
    gameState: Partial<GameStateData>;
    socketId: string;
    onStartGame: () => void;
    onReady: () => void;
}

const PlayerSidebar: React.FC<PlayerSidebarProps> = ({ players, hostId, gameState, socketId, onStartGame, onReady }) => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const readyPlayers = players.filter(p => p.isReady).length;
    const isHost = hostId === socketId;
    const me = players.find(p => p.id === socketId);
    
    return (
        <div className="brutal-panel" style={{ width: '220px', padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             {sortedPlayers.map((p, index) => (
                 <div key={p.id} style={{ 
                     padding: '0.75rem', 
                     borderRadius: '4px', 
                     background: p.hasGuessed ? 'var(--accent-success)' : 'white',
                     border: p.id === gameState.currentDrawer ? '3px solid var(--accent-primary)' : '3px solid var(--stroke-main)',
                     boxShadow: '2px 2px 0px var(--stroke-main)',
                     display: 'flex', flexDirection: 'column'
                 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontWeight: 800, color: p.hasGuessed ? 'white' : 'var(--text-main)' }}>
                             <span style={{ color: index === 0 ? '#f59e0b' : 'inherit', marginRight: '5px' }}>#{index + 1}</span>
                             {p.username} {p.id === socketId && '(You)'} 
                             {p.id === hostId && ' 👑'}
                         </span>
                         {p.id !== socketId && (
                             <button 
                                 onClick={() => {
                                     import('../../utils/socket').then(({ socket }) => socket.emit('vote_kick', { targetPlayerId: p.id }));
                                 }}
                                 title="Vote to Kick"
                                 style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
                             >👞</button>
                         )}
                     </div>
                     <span style={{ fontSize: '0.9rem', color: p.hasGuessed ? 'white' : 'var(--text-muted)' }}>Points: {p.score}</span>
                     {gameState.status === 'LOBBY' && (
                         <span style={{ fontSize: '0.8rem', color: p.isReady ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                             {p.isReady ? '✓ Ready' : 'Pending...'}
                         </span>
                     )}
                 </div>
             ))}

             {gameState.status === 'LOBBY' && !me?.isReady && (
                 <button onClick={onReady} className="btn" style={{ marginTop: 'auto', background: 'var(--accent-primary)', color: 'white' }}>Ready Up!</button>
             )}

             {gameState.status === 'LOBBY' && isHost && (
                 <button 
                     onClick={onStartGame} 
                     disabled={readyPlayers < 2}
                     className="btn btn-primary" 
                     style={{ marginTop: me?.isReady ? 'auto' : '10px', opacity: readyPlayers < 2 ? 0.5 : 1, cursor: readyPlayers < 2 ? 'not-allowed' : 'pointer' }}
                 >
                     Start Game {readyPlayers < 2 ? `(${readyPlayers}/2 Ready)` : ''}
                 </button>
             )}
             
             {gameState.status === 'LOBBY' && !isHost && readyPlayers < 2 && (
                 <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: me?.isReady ? 'auto' : '10px', textAlign: 'center' }}>
                     Waiting for others to ready up...
                 </p>
             )}
        </div>
    );
};

export default PlayerSidebar;
