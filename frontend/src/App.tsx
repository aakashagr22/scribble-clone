import React, { useState } from 'react';
import './index.css';
import GameRoom from './pages/GameRoom';
import LobbyScreen from './pages/LobbyScreen';
import { socket } from './utils/socket';
import { RoomSettings } from './types';

const App: React.FC = () => {
  const [inRoom, setInRoom] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');

  const handleJoin = (name: string, code: string) => {
    setUsername(name);
    setRoomCode(code);
    
    if (!socket.connected) { socket.connect(); }
    socket.emit('join_room', { roomId: code, username: name });
    
    setInRoom(true);
  };

  const handleCreate = (name: string, settings: Partial<RoomSettings>) => {
      setUsername(name);
      if (!socket.connected) { socket.connect(); }
      
      socket.emit('create_room', { username: name, settings });
      socket.once('room_created', (code: string) => {
          setRoomCode(code);
          setInRoom(true);
      });
  };

  const handleGameEnd = () => {
    setInRoom(false);
  };

  return (
    <div>
      {inRoom ? (
        <GameRoom username={username} roomCode={roomCode} onGameEnd={handleGameEnd} />
      ) : (
        <LobbyScreen onJoinSuite={handleJoin} onCreateSuite={handleCreate} />
      )}
    </div>
  );
}

export default App;
