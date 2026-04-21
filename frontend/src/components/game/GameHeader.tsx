import React, { useState } from 'react';
import { GameStateData } from '../../types';
import { Copy, Check } from 'lucide-react';

interface GameHeaderProps {
    roomCode: string;
    gameState: Partial<GameStateData>;
    isDrawer: boolean;
    secretWord: string;
    wordChoices: string[];
    onSelectWord: (w: string) => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({ roomCode, gameState, isDrawer, secretWord, wordChoices, onSelectWord }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
      <header className="brutal-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="brand-font" style={{ color: 'var(--text-main)', fontSize: '1.5rem', WebkitTextStroke: '1px white' }}>Skribbl MVP</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Room: <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{roomCode}</span></p>
              <button 
                  onClick={handleCopy} 
                  title="Copy Invite Link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                  {copied ? <Check size={16} color="var(--accent-success)" /> : <Copy size={16} color="var(--text-muted)" />}
              </button>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', flex: 1 }}>
            {gameState.status === 'LOBBY' && <h2>Waiting to start...</h2>}
            {gameState.status === 'ROUND_END' && <h2>Round Ending...</h2>}
            {gameState.status === 'GAME_OVER' && <h2 style={{color: 'var(--accent-danger)'}}>Game Over!</h2>}
            
            {gameState.status === 'CHOOSING_WORD' && (
                <div>
                    {isDrawer ? (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            {wordChoices.map(w => (
                                <button key={w} className="btn" onClick={() => onSelectWord(w)}>{w}</button>
                            ))}
                        </div>
                    ) : (
                        <h2 style={{ color: 'var(--accent-warning)', WebkitTextStroke: '1px black' }}>Drawer is choosing a word...</h2>
                    )}
                </div>
            )}

            {gameState.status === 'DRAWING' && (
                <div>
                   {isDrawer ? (
                       <h2 style={{ letterSpacing: '0.2rem', color: 'var(--accent-success)', WebkitTextStroke: '1px black' }}>{secretWord || 'WAIT...'}</h2>
                   ) : (
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                           <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>GUESS THIS</span>
                           <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{gameState.wordHints ? gameState.wordHints.replace(/[^_]/g, '').length : 0}</span>
                           <h2 style={{ letterSpacing: '0.4rem', WebkitTextStroke: '1px black', color: 'var(--text-main)' }}>{gameState.wordHints}</h2>
                       </div>
                   )}
                   <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                       {isDrawer ? 'You are DRAWING!' : `${gameState.currentDrawerName || 'Someone'} is drawing...`}
                   </p>
                </div>
            )}
        </div>

        <div style={{ textAlign: 'right', minWidth: '100px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: (gameState.timeLeft || 0) <= 10 ? 'var(--accent-danger)' : 'var(--accent-warning)' }}>
                {gameState.timeLeft}s
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Round {gameState.currentRound || 1} of {gameState.totalRounds || 3}
            </div>
        </div>
      </header>
    );
};

export default GameHeader;
