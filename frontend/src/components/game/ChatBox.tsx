import React, { useRef, useEffect } from 'react';
import { GameStateData } from '../../types';

interface Message {
    sender?: string;
    text: string;
    type: 'chat' | 'system-success' | 'system-info';
}

interface ChatBoxProps {
    messages: Message[];
    chatInput: string;
    setChatInput: (val: string) => void;
    onSubmitChat: (e: React.FormEvent) => void;
    isDrawer: boolean;
    gameState: Partial<GameStateData>;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, chatInput, setChatInput, onSubmitChat, isDrawer, gameState }) => {
    const chatBottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="brutal-panel" style={{ width: '300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '3px solid var(--stroke-main)' }}>
                <h3 className="brand-font">Chat & Guesses</h3>
            </div>
            
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               {messages.map((m, i) => (
                   <div key={i} style={{
                       fontSize: '0.9rem',
                       fontWeight: 600,
                       padding: '0.4rem 0.5rem',
                       borderRadius: '4px',
                       backgroundColor: m.type === 'system-success' ? 'var(--accent-success)' : m.type === 'system-info' ? 'var(--accent-secondary)' : i % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'transparent',
                       color: (m.type === 'system-success' || m.type === 'system-info') ? 'white' : 'var(--text-main)' // adjusted info color to white logic if needed
                   }}>
                       {m.type === 'chat' ? <strong>{m.sender}: </strong> : null}
                       <span>{m.text}</span>
                   </div>
               ))}
               <div ref={chatBottomRef} />
            </div>

            <form onSubmit={onSubmitChat} style={{ padding: '1rem', borderTop: '3px solid var(--stroke-main)' }}>
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={isDrawer ? "You cannot guess..." : "Type guess..."}
                  disabled={isDrawer || gameState.status !== 'DRAWING'} 
                  style={{
                      width: '100%', padding: '0.75rem', 
                      outline: 'none', border: '3px solid var(--stroke-main)',
                      opacity: (isDrawer || gameState.status !== 'DRAWING') ? 0.6 : 1
                  }}
                />
            </form>
        </div>
    );
};

export default ChatBox;
