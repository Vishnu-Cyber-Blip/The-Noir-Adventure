import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

// --- Audio Utility for Procedural Typewriter Sounds ---
const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    if (!w.__audioCtx) {
        const Ctx = w.AudioContext || w.webkitAudioContext;
        if (Ctx) w.__audioCtx = new Ctx();
    }
    return w.__audioCtx as AudioContext;
};

const getNoiseBuffer = (ctx: AudioContext) => {
    const w = window as any;
    if (!w.__noiseBuffer) {
        // Create 50ms of white noise
        const bufferSize = ctx.sampleRate * 0.05; 
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        w.__noiseBuffer = buffer;
    }
    return w.__noiseBuffer as AudioBuffer;
};

const playTypewriterSound = () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        if (ctx.state === 'suspended') {
             ctx.resume().catch(() => {});
        }

        const t = ctx.currentTime;
        
        // Mechanical "thock" (Filtered Noise)
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = getNoiseBuffer(ctx);
        
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        // Randomize tone slightly for realism
        noiseFilter.frequency.setValueAtTime(600 + Math.random() * 200, t); 
        
        const noiseGain = ctx.createGain();
        // Vary volume slightly
        noiseGain.gain.setValueAtTime(0.03 + Math.random() * 0.02, t); 
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseSource.start(t);

    } catch (e) {
        // Silently fail if audio is blocked or unsupported
    }
};

export const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed = 30, 
  onComplete,
  className = "" 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayedText('');
    indexRef.current = 0;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const typeChar = () => {
      if (indexRef.current < text.length) {
        const char = text.charAt(indexRef.current);
        setDisplayedText((prev) => prev + char);
        indexRef.current++;
        
        // Play sound for non-whitespace characters
        if (char.trim() !== '') {
            playTypewriterSound();
        }

        // --- Calculate Dynamic Delay ---
        let delay = speed;
        
        // 1. Human Imperfection: Randomize speed by +/- 50%
        const variance = (Math.random() * 1.0) + 0.5; // Multiplier between 0.5x and 1.5x
        delay *= variance;

        // 2. Contextual Pauses
        if (char === '.' || char === '?' || char === '!') {
            delay += 500; // End of sentence reflection
        } else if (char === ',' || char === ';') {
            delay += 250; // Mid-sentence pause
        } else if (char === '\n') {
            delay += 600; // Carriage return thought process
        } else if (char === ' ') {
            delay += 10; // Slight pause between words
        }

        timeoutRef.current = window.setTimeout(typeChar, delay);
      } else {
        if (onComplete) onComplete();
      }
    };

    // Start typing
    timeoutRef.current = window.setTimeout(typeChar, speed);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, speed, onComplete]);

  return (
    <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>
      {displayedText}
      <span className="animate-pulse inline-block w-2 h-4 bg-zinc-500 ml-1 align-middle opacity-70"></span>
    </div>
  );
};