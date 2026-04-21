import React, { useRef, useEffect, useState, useCallback } from 'react';
import { socket } from '../utils/socket';

interface CanvasBoardProps {
  color?: string;
  brushSize?: number;
  tool?: 'brush' | 'eraser' | 'fill';
  undoKey: number;
  initialCanvasBase64?: string | null;
  onDraw?: (event: { type: string }) => void;
  isDrawer: boolean;
}

const CanvasBoard: React.FC<CanvasBoardProps> = ({
  color = '#f8fafc',
  brushSize = 5,
  tool = 'brush',
  undoKey,
  initialCanvasBase64,
  onDraw,
  isDrawer
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const strokesRef = useRef<any[]>([]);
  const currentStrokeRef = useRef<any>(null);
  const lastEmitTimeRef = useRef<number>(0);

  // Redraw array logic
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokesRef.current) {
      if (stroke.type === 'fill') {

        if (stroke.base64) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          img.src = stroke.base64;
        }
        continue;
      }

      if (!stroke.points || stroke.points.length === 0) continue;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';

      ctx.beginPath();
      const startX = stroke.points[0].x * (canvas.width / 2);
      const startY = stroke.points[0].y * (canvas.height / 2);
      ctx.moveTo(startX, startY);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * (canvas.width / 2), stroke.points[i].y * (canvas.height / 2));
      }
      ctx.stroke();
      ctx.closePath();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 1600;
    canvas.height = 1200;
    canvas.style.width = '100%';
    canvas.style.maxWidth = '800px';
    canvas.style.aspectRatio = '800 / 600';
    canvas.style.backgroundColor = '#fffffe';

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    if (initialCanvasBase64) {
      const img = new Image();
      img.onload = () => context.drawImage(img, 0, 0, 800, 600);
      img.src = initialCanvasBase64;
    }

  }, [initialCanvasBase64]);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize]);

  useEffect(() => {

    const handleDrawStart = ({ x, y, color: drawColor, size, tool: drawTool }: any) => {
      strokesRef.current.push({ tool: drawTool || 'brush', color: drawColor, size, points: [{ x, y }] });
      redrawCanvas();
    };

    const handleDrawMoveBatched = (pointsData: any[]) => {
      if (strokesRef.current.length === 0) return;
      const lastStroke = strokesRef.current[strokesRef.current.length - 1];
      for (const pt of pointsData) {
        if (lastStroke.points) lastStroke.points.push(pt);
      }
      redrawCanvas();
    };

    const handleDrawMove = ({ x, y }: any) => {
      if (strokesRef.current.length === 0) return;
      const lastStroke = strokesRef.current[strokesRef.current.length - 1];
      if (lastStroke.points) lastStroke.points.push({ x, y });
      redrawCanvas();
    };

    const handleDrawData = (stroke: any) => {
      strokesRef.current.push(stroke);
      redrawCanvas();
    };

    const handleClear = () => {
      strokesRef.current = [];
      redrawCanvas();
    };

    const handleUndo = () => {
      strokesRef.current.pop();
      redrawCanvas();
    };

    socket.on('draw_start', handleDrawStart);
    socket.on('draw_move', handleDrawMove);
    socket.on('draw_move_batched', handleDrawMoveBatched);
    socket.on('draw_end', redrawCanvas);
    socket.on('draw_data', handleDrawData);
    socket.on('canvas_clear', handleClear);
    socket.on('draw_undo', handleUndo);

    const handleCanvasStateRequest = ({ targetSocketId }: { targetSocketId: string }) => {
      if (isDrawer && canvasRef.current) {
        const base64Image = canvasRef.current.toDataURL('image/png');
        socket.emit('canvas_state_send', { targetSocketId, base64Image });
      }
    };
    socket.on('request_canvas_state', handleCanvasStateRequest);

    return () => {
      socket.off('draw_start', handleDrawStart);
      socket.off('draw_move', handleDrawMove);
      socket.off('draw_move_batched', handleDrawMoveBatched);
      socket.off('draw_end', redrawCanvas);
      socket.off('draw_data', handleDrawData);
      socket.off('canvas_clear', handleClear);
      socket.off('draw_undo', handleUndo);
      socket.off('request_canvas_state', handleCanvasStateRequest);
    };
  }, [redrawCanvas, isDrawer]);

  useEffect(() => {
    if (undoKey > 0) {
      socket.emit('draw_undo');
      strokesRef.current.pop();
      redrawCanvas();
    }
  }, [undoKey, redrawCanvas]);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16), a: 255 } : { r: 0, g: 0, b: 0, a: 255 };
  }

  const performFloodFill = (startX: number, startY: number, hexColor: string) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const targetPixel = (startY * canvas.width + startX) * 4;
    const startR = data[targetPixel];
    const startG = data[targetPixel + 1];
    const startB = data[targetPixel + 2];
    const startA = data[targetPixel + 3];

    const fillColor = hexToRgb(hexColor);

    if (startR === fillColor.r && startG === fillColor.g && startB === fillColor.b) return;

    const stack = [[startX, startY]];
    while (stack.length) {
      let [x, y] = stack.pop()!;
      let pixelPos = (y * canvas.width + x) * 4;

      while (y-- >= 0 && matchStartColor(pixelPos)) {
        pixelPos -= canvas.width * 4;
      }
      pixelPos += canvas.width * 4;
      y++;

      let reachLeft = false;
      let reachRight = false;

      while (y++ < canvas.height - 1 && matchStartColor(pixelPos)) {
        colorPixel(pixelPos);

        if (x > 0) {
          if (matchStartColor(pixelPos - 4)) {
            if (!reachLeft) {
              stack.push([x - 1, y]);
              reachLeft = true;
            }
          } else if (reachLeft) reachLeft = false;
        }

        if (x < canvas.width - 1) {
          if (matchStartColor(pixelPos + 4)) {
            if (!reachRight) {
              stack.push([x + 1, y]);
              reachRight = true;
            }
          } else if (reachRight) reachRight = false;
        }
        pixelPos += canvas.width * 4;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const finalBase64 = canvas.toDataURL('image/png');
    socket.emit('draw_data', { type: 'fill', base64: finalBase64 });
    strokesRef.current.push({ type: 'fill', base64: finalBase64 });

    function matchStartColor(pixelPos: number) {
      return data[pixelPos] === startR && data[pixelPos + 1] === startG && data[pixelPos + 2] === startB && data[pixelPos + 3] === startA;
    }
    function colorPixel(pixelPos: number) {
      data[pixelPos] = fillColor.r; data[pixelPos + 1] = fillColor.g; data[pixelPos + 2] = fillColor.b; data[pixelPos + 3] = 255;
    }
  };

  const getNormalizedCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
      rawX: Math.floor((clientX - rect.left) * (canvas.width / rect.width)),
      rawY: Math.floor((clientY - rect.top) * (canvas.height / rect.height))
    };
  };

  const startDrawing = (e: any) => {
    if (!isDrawer) return;
    const { x, y, rawX, rawY } = getNormalizedCoordinates(e);

    if (tool === 'fill') {
      performFloodFill(rawX, rawY, color);
      return;
    }

    setIsDrawing(true);

    currentStrokeRef.current = { tool, color, size: brushSize, points: [{ x, y }] };
    strokesRef.current.push(currentStrokeRef.current);

    redrawCanvas();

    socket.emit('draw_start', { x, y, color, size: brushSize, tool });
    if (onDraw) onDraw({ type: 'start' });
    lastEmitTimeRef.current = Date.now();
  };

  const moveQueueRef = useRef<any[]>([]);

  const draw = (e: any) => {
    if (!isDrawing || !isDrawer) return;
    const { x, y } = getNormalizedCoordinates(e);

    if (currentStrokeRef.current && currentStrokeRef.current.points) {
      currentStrokeRef.current.points.push({ x, y });
    }
    redrawCanvas();

    moveQueueRef.current.push({ x, y });

    const now = Date.now();
    if (now - lastEmitTimeRef.current >= 16) {
      socket.emit('draw_move_batched', moveQueueRef.current);
      moveQueueRef.current = [];
      lastEmitTimeRef.current = now;
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || !isDrawer) return;
    setIsDrawing(false);

    if (moveQueueRef.current.length > 0) {
      socket.emit('draw_move_batched', moveQueueRef.current);
      moveQueueRef.current = [];
    }

    socket.emit('draw_end');
    if (onDraw) onDraw({ type: 'stop' });
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      style={{
        borderRadius: '4px',
        border: '3px solid var(--stroke-main)',
        boxShadow: '4px 4px 0px 0px var(--stroke-main)',
        cursor: tool === 'fill' ? 'crosshair' : 'default',
        touchAction: 'none'
      }}
    />
  );
};

export default CanvasBoard;
