import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../services/audioEngine';

interface VisualizerProps {
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 3;

      // Fade effect
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)'; // Dark slate trace
      ctx.fillRect(0, 0, width, height);

      if (!isPlaying) {
         // Idle animation
         ctx.beginPath();
         ctx.strokeStyle = '#334155';
         ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
         ctx.stroke();
         animationRef.current = requestAnimationFrame(render);
         return;
      }

      const values = audioEngine.getAnalyzerValue();
      if (!values) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      // Draw Circular FFT
      const bars = 64;
      const step = (Math.PI * 2) / bars;
      
      ctx.beginPath();
      for (let i = 0; i < bars; i++) {
        // Map FFT frequency data (values are -infinity to 0 usually, or float 0-1 depending on Analyzer type)
        // Tone.Analyser 'fft' returns Float32Array in dB. -100 to 0 approx.
        // We map to a positive height.
        const value = values[i % values.length]; 
        const heightMap = Math.max(0, (value + 100) * 2); // normalize roughly

        const angle = i * step;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + heightMap);
        const y2 = centerY + Math.sin(angle) * (radius + heightMap);

        // Color gradient based on intensity
        const hue = (i / bars) * 360 + (Date.now() / 20); // Rotating colors
        ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
        ctx.lineWidth = 4;
        
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.beginPath(); // separate paths for colors
      }

      animationRef.current = requestAnimationFrame(render);
    };

    // Handle Resize
    const resize = () => {
        if(canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
    };
    window.addEventListener('resize', resize);
    resize();

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isPlaying]);

  return (
    <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
    />
  );
};

export default Visualizer;