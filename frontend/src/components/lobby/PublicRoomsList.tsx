import React, { useState, useEffect } from 'react';
import { socket } from '../../utils/socket';

const AVATARS = ['🐵', '🦊', '🐱', '🐶', '🦁', '🐸', '🐼', '🦄'];

interface PublicRoom {
    roomId: string;
    playerCount: number;
    maxPlayers: number;
}

interface PublicRoomsListProps {
    username: string;
    setUsername: (u: string) => void;
    onJoinSuite: (username: string, roomCode: string) => void;
}

const PublicRoomsList: React.FC<PublicRoomsListProps> = ({ username, setUsername, onJoinSuite }) => {
    const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const connectAndFetch = () => {
            if (!socket.connected) {
                socket.connect();
            }
            setTimeout(() => {
                socket.emit('get_public_rooms');
            }, 100);
        };
        
        connectAndFetch();

        const handlePublicRoomsList = (rooms: PublicRoom[]) => {
            console.log('[PUBLIC ROOMS] Received:', rooms);
            setPublicRooms(rooms);
            setLoading(false);
        };

        const handlePublicRoomsUpdate = () => {
            console.log('[PUBLIC ROOMS] Update event received');
            
            socket.emit('get_public_rooms');
        };

        socket.on('public_rooms_list', handlePublicRoomsList);
        socket.on('public_rooms_update', handlePublicRoomsUpdate);

        const refreshInterval = setInterval(() => {
            socket.emit('get_public_rooms');
        }, 5000);

        return () => {
            socket.off('public_rooms_list', handlePublicRoomsList);
            socket.off('public_rooms_update', handlePublicRoomsUpdate);
            clearInterval(refreshInterval);
        };
    }, []);

    const handleJoin = (roomId: string) => {
        if (!username.trim()) {
            alert('Please enter a name');
            return;
        }
        const finalUsername = `${selectedAvatar} ${username}`;
        onJoinSuite(finalUsername, roomId);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
         
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {AVATARS.map(avatar => (
                    <button 
                        type="button" 
                        key={avatar} 
                        onClick={() => setSelectedAvatar(avatar)}
                        style={{ 
                            fontSize: '1.5rem', 
                            background: selectedAvatar === avatar ? 'var(--stroke-main)' : 'white', 
                            border: '2px solid var(--stroke-main)', 
                            borderRadius: '8px', 
                            cursor: 'pointer' 
                        }}
                    >
                        {avatar}
                    </button>
                ))}
            </div>

            
            <input 
                type="text" 
                placeholder="Enter your Name" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                style={{ 
                    padding: '1rem', 
                    outline: 'none', 
                    border: '3px solid var(--stroke-main)' 
                }} 
            />

           
            {loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading rooms...</p>
            ) : publicRooms.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No public rooms available</p>
            ) : (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.75rem',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    {publicRooms.map((room) => (
                        <div 
                            key={room.roomId}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                background: 'white',
                                border: '3px solid var(--stroke-main)',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                            onClick={() => handleJoin(room.roomId)}
                        >
                            <div>
                                <strong style={{ color: 'var(--text-main)' }}>Room {room.roomId}</strong>
                                <p style={{ margin: '0.25rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    👥 {room.playerCount}/{room.maxPlayers}
                                </p>
                            </div>
                            <button 
                                type="button"
                                className="btn btn-primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleJoin(room.roomId);
                                }}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                Join
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PublicRoomsList;
