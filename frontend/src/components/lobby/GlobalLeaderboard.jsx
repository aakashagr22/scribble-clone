import React, { useState, useEffect } from 'react';

const GlobalLeaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const res = await fetch(`${URL}/api/leaderboard`);
                const response = await res.json();
                
                if (response.success) {
                    setLeaderboard(response.data);
                } else {
                    setError(response.message || "Failed to load leaderboard");
                }
            } catch(e) {
                setError("Network error bridging to server");
                console.error("Could not fetch leaderboard", e);
            }
        };

        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="brutal-panel" style={{ width: '100%', maxWidth: '350px', maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '3px solid var(--stroke-main)', textAlign: 'center' }}>
                <h2 className="brand-font" style={{ color: 'var(--text-main)', WebkitTextStroke: '1px white' }}>Global Leaderboard</h2>
            </div>
            <div style={{ overflowY: 'auto', padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {error && <div style={{ color: 'var(--accent-danger)', textAlign: 'center', fontSize: '0.9rem', padding: '1rem' }}>{error}</div>}
                
                {!error && leaderboard.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', fontWeight: 600 }}>No stats yet...</p>
                ) : (
                    leaderboard.map((user, index) => (
                        <div key={user._id || index} style={{ 
                            display: 'flex', justifyContent: 'space-between', padding: '0.75rem', 
                            background: 'white', borderRadius: '4px', border: '2px solid var(--stroke-main)' 
                        }}>
                            <span style={{ fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                                <span style={{ color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'var(--text-main)', width: '25px', display: 'inline-block' }}>
                                    #{index + 1}
                                </span>
                                <span style={{ marginLeft: '4px' }}>{user.username}</span>
                            </span>
                            <span style={{ color: 'var(--accent-danger)', fontWeight: 800 }}>{user.totalPoints} pts</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GlobalLeaderboard;
