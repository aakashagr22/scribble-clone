import React from 'react';
import { Eraser, Trash2, Palette, Undo, PaintBucket, Brush } from 'lucide-react';

const COLORS = [
  '#f8fafc', '#94a3b8', '#0f172a', 
  '#ef4444', '#f97316', '#f59e0b', 
  '#84cc16', '#10b981', '#06b6d4', 
  '#3b82f6', '#6366f1', '#d946ef' 
];

const SIZES = [2, 5, 10, 20];

interface ToolbarProps {
  currentColor: string;
  setCurrentColor: (c: string) => void;
  currentSize: number;
  setCurrentSize: (s: number) => void;
  tool: 'brush' | 'eraser' | 'fill';
  setTool: (t: 'brush' | 'eraser' | 'fill') => void;
  onClear: () => void;
  onUndo: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  currentColor, setCurrentColor, 
  currentSize, setCurrentSize, 
  tool, setTool,
  onClear, onUndo 
}) => {
  return (
    <div className="brutal-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '80px', alignItems: 'center' }}>
      
      
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
        <div style={{ width: '100%', textAlign: 'center', marginBottom: '4px' }}>
            <Palette size={18} color="var(--text-main)" />
        </div>
        {COLORS.map(color => (
          <button
            key={color}
            onClick={() => {
                setCurrentColor(color);
                if (tool === 'eraser') setTool('brush'); 
            }}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: color,
              border: currentColor === color && tool !== 'eraser' ? '3px solid var(--stroke-main)' : '2px solid transparent',
              cursor: 'pointer',
              boxShadow: currentColor === color && tool !== 'eraser' ? '2px 2px 0px 0px var(--stroke-main)' : 'none',
              transition: 'all 0.1s'
            }}
            title={color}
          />
        ))}
      </div>

      <div style={{ width: '100%', height: '3px', background: 'var(--stroke-main)' }}></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        {SIZES.map(size => (
          <button
            key={size}
            onClick={() => setCurrentSize(size)}
            style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: currentSize === size ? 'var(--text-main)' : 'transparent',
                border: currentSize === size ? '3px solid var(--stroke-main)' : 'none',
                boxShadow: currentSize === size ? '2px 2px 0px 0px var(--stroke-main)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.1s'
            }}
          >
            <div style={{
              width: `${Math.min(size + 4, 24)}px`,
              height: `${Math.min(size + 4, 24)}px`,
              borderRadius: '50%',
              backgroundColor: currentSize === size ? 'white' : 'var(--text-main)'
            }}></div>
          </button>
        ))}
      </div>

      <div style={{ width: '100%', height: '3px', background: 'var(--stroke-main)' }}></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        
        <button 
          className={`btn-icon-only ${tool === 'brush' ? 'active' : ''}`}
          onClick={() => setTool('brush')} 
          title="Brush"
          style={{ background: tool === 'brush' ? 'var(--text-main)' : 'white', color: tool === 'brush' ? 'white' : 'var(--text-main)' }}
        >
          <Brush size={20} />
        </button>

        <button 
          className={`btn-icon-only ${tool === 'fill' ? 'active' : ''}`}
          onClick={() => setTool('fill')} 
          title="Flood Fill"
          style={{ background: tool === 'fill' ? 'var(--text-main)' : 'white', color: tool === 'fill' ? 'white' : 'var(--text-main)' }}
        >
          <PaintBucket size={20} />
        </button>

        <button 
          className={`btn-icon-only ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => {
              setTool('eraser');
              setCurrentColor('#ffffff');   }} 
          title="Eraser"
          style={{ background: tool === 'eraser' ? 'var(--text-main)' : 'white', color: tool === 'eraser' ? 'white' : 'var(--text-main)' }}
        >
          <Eraser size={20} />
        </button>
        
        <button 
          className="btn-icon-only" 
          onClick={onUndo}
          title="Undo"
          style={{ background: 'white', color: 'var(--text-main)' }}
        >
          <Undo size={20} />
        </button>

        <button 
          className="btn-icon-only" 
          onClick={onClear}
          title="Clear Canvas"
          style={{ color: 'var(--accent-danger)', background: 'white' }}
        >
          <Trash2 size={20} />
        </button>
      </div>

    </div>
  );
};

export default Toolbar;
