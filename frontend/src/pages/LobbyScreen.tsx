import React, { useState } from 'react';
import JoinRoomForm from '../components/lobby/JoinRoomForm';
import CreateRoomForm from '../components/lobby/CreateRoomForm';
import PublicRoomsList from '../components/lobby/PublicRoomsList';
import GlobalLeaderboard from '../components/lobby/GlobalLeaderboard';
import { RoomSettings } from '../types';

interface LobbyScreenProps {
  onJoinSuite: (username: string, roomCode: string) => void;
  onCreateSuite: (username: string, settings: Partial<RoomSettings>) => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ onJoinSuite, onCreateSuite }) => {
  const [username, setUsername] = useState<string>('');
  const [mode, setMode] = useState<'join' | 'create' | 'public'>('join');

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '2rem', flexWrap: 'wrap', padding: '1rem' }}>
        
        <div className="brutal-panel" style={{ padding: '3rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h1 className="brand-font" style={{ color: 'var(--text-main)', fontSize: '4rem', marginBottom: '0.5rem', WebkitTextStroke: '2px white', letterSpacing: '2px' }}>Happy</h1>
            <h1 className="brand-font" style={{ color: 'var(--accent-primary)', fontSize: '4rem', marginBottom: '1rem', WebkitTextStroke: '2px black', letterSpacing: '2px' }}>Draws</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.2rem' }}>Draw, guess, and win!</p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => setMode('join')} className="btn" style={{ flex: 1, background: mode === 'join' ? 'var(--text-main)' : 'white', color: mode === 'join' ? 'white' : 'var(--text-main)' }}>Join</button>
                <button onClick={() => setMode('create')} className="btn" style={{ flex: 1, background: mode === 'create' ? 'var(--text-main)' : 'white', color: mode === 'create' ? 'white' : 'var(--text-main)' }}>Create</button>
                <button onClick={() => setMode('public')} className="btn" style={{ flex: 1, background: mode === 'public' ? 'var(--text-main)' : 'white', color: mode === 'public' ? 'white' : 'var(--text-main)' }}>Public</button>
            </div>

            {mode === 'join' ? (
                <JoinRoomForm 
                    username={username} 
                    setUsername={setUsername} 
                    onJoinSuite={onJoinSuite} 
                />
            ) : mode === 'create' ? (
                <CreateRoomForm 
                    username={username} 
                    setUsername={setUsername} 
                    onCreateSuite={onCreateSuite} 
                />
            ) : (
                <PublicRoomsList 
                    username={username} 
                    setUsername={setUsername} 
                    onJoinSuite={onJoinSuite} 
                />
            )}
        </div>

        <GlobalLeaderboard />

    </div>
  );
};

export default LobbyScreen;
