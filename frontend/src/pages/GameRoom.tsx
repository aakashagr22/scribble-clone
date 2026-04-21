import React, { useState, useEffect } from 'react';
import CanvasBoard from '../components/CanvasBoard';
import Toolbar from '../components/Toolbar'; 
import PlayerSidebar from '../components/game/PlayerSidebar';
import ChatBox from '../components/game/ChatBox';
import GameHeader from '../components/game/GameHeader';
import { socket } from '../utils/socket';
import { GameStateData, PlayerData } from '../types';

interface GameRoomProps {
    username: string;
    roomCode: string;
    onGameEnd?: () => void;
}

const playSfx = (type: 'ping' | 'gong') => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'ping') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.2);
        } else {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, audioCtx.currentTime); 
            gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 1.5);
        }
    } catch(e) { } 
};

const GameRoom: React.FC<GameRoomProps> = ({ username, roomCode, onGameEnd }) => {
  const [color, setColor] = useState<string>('#1e293b');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [clearKey, setClearKey] = useState<number>(0);
  const [undoKey, setUndoKey] = useState<number>(0);

  
  const [initialCanvasBase64, setInitialCanvasBase64] = useState<string | null>(null);

  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<Partial<GameStateData>>({ status: 'LOBBY', timeLeft: 0, wordHints: '' });
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [secretWord, setSecretWord] = useState<string>(''); 
  const [wordChoices, setWordChoices] = useState<string[]>([]);

  useEffect(() => {
    socket.on('room_update', (data: any) => {
        console.log('[ROOM UPDATE] Received:', data.players.map((p: any) => `${p.username}:${p.score}`).join(', '));
        setPlayers(data.players);
        setHostId(data.host);
        if (data.gameState) setGameState(data.gameState);
    });

    socket.on('game_state_update', (data: GameStateData) => {
        setGameState(data);
        if (data.status === 'ROUND_END') {
            setSecretWord('');
            setWordChoices([]);
        } else if (data.status === 'GAME_OVER') {
            setTimeout(() => {
                if (onGameEnd) {
                    onGameEnd(); 
                } else {
                    window.location.reload();
                }
            }, 6000); 
        }
    });

    socket.on('timer_update', (timeLeft: number) => setGameState(prev => ({ ...prev, timeLeft })));
    socket.on('secret_word', (word: string) => setSecretWord(word));
    socket.on('word_choices', (choices: string[]) => setWordChoices(choices));

    socket.on('hint_update', ({ hint }: { hint: string }) => {
        setGameState(prev => ({ ...prev, wordHints: hint }));
        console.log(`[HINT UPDATE] ${hint}`); 
    });

    socket.on('score_update', (updatedPlayers: any[]) => {
        console.log('[SCORE UPDATE] Received players:', updatedPlayers.map(p => `${p.username}:${p.score}`).join(', '));
        console.log('[SCORE UPDATE] Current state before update:', players.map(p => `${p.username}:${p.score}`).join(', '));
       
        setPlayers(updatedPlayers);
        console.log('[SCORE UPDATE] State updated');
    });

    socket.on('chat_msg', ({ sender, text }: any) => {
        setMessages(prev => [...prev, { sender, text, type: 'chat' }]);
    });

    socket.on('close_guess', ({ message }: { message: string }) => {
        setMessages(prev => [...prev, { text: message, type: 'system-info' }]);
    });

    socket.on('correct_guess', ({ username }: any) => {
        setMessages(prev => [...prev, { text: `${username} guessed the word!`, type: 'system-success' }]);
        playSfx('ping');
    });

    socket.on('round_end', ({ word }: any) => {
        setMessages(prev => [...prev, { text: `Round Over! The word was: ${word}`, type: 'system-info' }]);
        playSfx('gong');
    });

    socket.on('canvas_state_sync', (base64Image: string) => {
        setInitialCanvasBase64(base64Image); 
    });

    return () => {
        socket.off('room_update');
        socket.off('game_state_update');
        socket.off('timer_update');
        socket.off('secret_word');
        socket.off('word_choices');
        socket.off('hint_update');
        socket.off('score_update');
        socket.off('chat_msg');
        socket.off('close_guess');
        socket.off('correct_guess');
        socket.off('round_end');
        socket.off('canvas_state_sync');
    };
  }, []);

  const handleClear = () => {
    socket.emit('canvas_clear');
    setClearKey(prev => prev + 1);
  };

  const handleUndo = () => {
      setUndoKey(prev => prev + 1);
  };

  const submitChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('chat_msg', { text: chatInput });
    setChatInput('');
  };

  const startGame = () => socket.emit('start_game');

  const selectWord = (word: string) => {
      socket.emit('word_chosen', word);
      setWordChoices([]);
  };

  const isDrawer = gameState.currentDrawer === socket.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem', gap: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      <GameHeader 
          roomCode={roomCode} 
          gameState={gameState} 
          isDrawer={isDrawer} 
          secretWord={secretWord} 
          wordChoices={wordChoices} 
          onSelectWord={selectWord} 
      />

      <div style={{ display: 'flex', flex: 1, gap: '1rem', minHeight: '0' }}>
        
        <PlayerSidebar 
            players={players}
            hostId={hostId}
            gameState={gameState} 
            socketId={socket.id || ''} 
            onStartGame={startGame} 
            onReady={() => socket.emit('player_ready')}
        />

        <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
            <div style={{ opacity: isDrawer ? 1 : 0.4, pointerEvents: isDrawer ? 'auto' : 'none' }}>
               <Toolbar 
                   currentColor={color} setCurrentColor={setColor} 
                   currentSize={brushSize} setCurrentSize={setBrushSize} 
                   tool={tool} setTool={setTool}
                   onClear={handleClear} onUndo={handleUndo} 
               />
            </div>

            <div className="brutal-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
               <div style={{ pointerEvents: isDrawer ? 'auto' : 'none', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CanvasBoard 
                      key={clearKey} 
                      color={color} 
                      brushSize={brushSize} 
                      tool={tool}
                      undoKey={undoKey} 
                      isDrawer={isDrawer!}
                      initialCanvasBase64={initialCanvasBase64} 
                  />
               </div>
            </div>
        </div>

        <ChatBox 
            messages={messages} 
            chatInput={chatInput} 
            setChatInput={setChatInput} 
            onSubmitChat={submitChat} 
            isDrawer={isDrawer!} 
            gameState={gameState} 
        />
      </div>
    
    </div>
  );
};

export default GameRoom;
