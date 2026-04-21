import React, { useState } from 'react';
import { RoomSettings } from '../../../types';

const AVATARS = ['🐵', '🦊', '🐱', '🐶', '🦁', '🐸', '🐼', '🦄'];
const LANGUAGES = [{ id: 'en', name: 'English' }, { id: 'es', name: 'Spanish' }, { id: 'fr', name: 'French' }];

interface CreateRoomFormProps {
    username: string;
    setUsername: (u: string) => void;
    onCreateSuite: (username: string, settings: Partial<RoomSettings>) => void;
}

const CreateRoomForm: React.FC<CreateRoomFormProps> = ({ username, setUsername, onCreateSuite }) => {
    const [rounds, setRounds] = useState(3);
    const [drawTime, setDrawTime] = useState(60);
    const [language, setLanguage] = useState('en');
    const [customWords, setCustomWords] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [isPublic, setIsPublic] = useState(false); 

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (username) {
            const finalUsername = `${selectedAvatar} ${username}`;
            const parsedWords = customWords.split(',').map(w => w.trim()).filter(w => w.length > 0);
            onCreateSuite(finalUsername, { rounds, drawTime, language, customWords: parsedWords, isPublic }); // ISSUE 3 FIX: Pass isPublic
        }
    };

    return (
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {AVATARS.map(avatar => (
                    <button type="button" key={avatar} onClick={() => setSelectedAvatar(avatar)}
                        style={{ fontSize: '1.5rem', background: selectedAvatar === avatar ? 'var(--stroke-main)' : 'white', border: '2px solid var(--stroke-main)', borderRadius: '8px', cursor: 'pointer' }}>
                        {avatar}
                    </button>
                ))}
            </div>

            <input type="text" placeholder="Enter your Name" value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: '0.75rem', outline: 'none', border: '3px solid var(--stroke-main)' }} required />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: 'var(--text-main)', fontWeight: 600 }}>Rounds: {rounds}</label>
                <input type="range" min="1" max="10" value={rounds} onChange={e => setRounds(Number(e.target.value))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: 'var(--text-main)', fontWeight: 600 }}>Draw Time: {drawTime}s</label>
                <input type="range" min="30" max="120" step="10" value={drawTime} onChange={e => setDrawTime(Number(e.target.value))} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ color: 'var(--text-main)', fontWeight: 600 }}>Language:</label>
                <select value={language} onChange={e => setLanguage(e.target.value)} style={{ padding: '0.5rem', outline: 'none', border: '3px solid var(--stroke-main)' }}>
                    {LANGUAGES.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ color: 'var(--text-main)', fontWeight: 600 }}>Custom Words (comma separated):</label>
                <textarea rows={2} value={customWords} onChange={e => setCustomWords(e.target.value)} placeholder="e.g. React, Docker, Kubernetes" style={{ padding: '0.5rem', outline: 'none', border: '3px solid var(--stroke-main)', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                    type="checkbox" 
                    id="isPublic" 
                    checked={isPublic} 
                    onChange={e => setIsPublic(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="isPublic" style={{ color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>Make room public (visible in Browse)</label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Create Custom Room</button>
        </form>
    );
};

export default CreateRoomForm;
