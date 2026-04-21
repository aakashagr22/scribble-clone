import React, { useState } from 'react';

const AVATARS = ['🐵', '🦊', '🐱', '🐶', '🦁', '🐸', '🐼', '🦄'];

interface JoinRoomFormProps {
    username: string;
    setUsername: (u: string) => void;
    onJoinSuite: (username: string, roomCode: string) => void;
}

const JoinRoomForm: React.FC<JoinRoomFormProps> = ({ username, setUsername, onJoinSuite }) => {
    const [roomCode, setRoomCode] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username && roomCode) {
            const finalUsername = `${selectedAvatar} ${username}`;
            onJoinSuite(finalUsername, roomCode.toUpperCase());
        }
    };

    return (
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {AVATARS.map(avatar => (
                    <button type="button" key={avatar} onClick={() => setSelectedAvatar(avatar)}
                        style={{ fontSize: '1.5rem', background: selectedAvatar === avatar ? 'var(--stroke-main)' : 'white', border: '2px solid var(--stroke-main)', borderRadius: '8px', cursor: 'pointer' }}>
                        {avatar}
                    </button>
                ))}
            </div>

            <input type="text" placeholder="Enter your Name" value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: '1rem', outline: 'none', border: '3px solid var(--stroke-main)' }} required />
            <input type="text" placeholder="Enter Room Code (e.g. ABC)" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} style={{ padding: '1rem', outline: 'none', textTransform: 'uppercase', border: '3px solid var(--stroke-main)' }} required />
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Play Now</button>
        </form>
    );
};

export default JoinRoomForm;
