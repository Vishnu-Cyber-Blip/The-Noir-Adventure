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
        // Create 100ms of white noise
        const bufferSize = ctx.sampleRate * 0.1; 
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        w.__noiseBuffer = buffer;
    }
    return w.__noiseBuffer as AudioBuffer;
};

const playTypewriterSound = (char: string) => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        if (ctx.state === 'suspended') {
             ctx.resume().catch(() => {});
        }

        const t = ctx.currentTime;
        const isSpace = char === ' ';
        const isReturn = char === '\n';
        
        // 1. The "Click" (High frequency mechanical snap for keys, absent for space)
        if (!isSpace) {
            const clickOsc = ctx.createOscillator();
            clickOsc.type = 'square';
            // Randomize pitch slightly. Return key is lower "ka-chunk"
            clickOsc.frequency.setValueAtTime(isReturn ? 150 : 800 + Math.random() * 200, t); 
            
            const clickGain = ctx.createGain();
            clickGain.gain.setValueAtTime(0.02, t);
            clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            
            // Highpass filter to make it crisp
            const clickFilter = ctx.createBiquadFilter();
            clickFilter.type = 'highpass';
            clickFilter.frequency.value = 2000;

            clickOsc.connect(clickFilter);
            clickFilter.connect(clickGain);
            clickGain.connect(ctx.destination);
            
            clickOsc.start(t);
            clickOsc.stop(t + 0.05);
        }

        // 2. The "Thud" (Mechanical body sound - present for all keys)
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = getNoiseBuffer(ctx);
        
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        // Different resonance for spacebar
        noiseFilter.frequency.setValueAtTime(isSpace ? 300 : 600 + Math.random() * 100, t); 
        noiseFilter.Q.value = 1;
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(isSpace ? 0.08 : 0.05, t); 
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + (isSpace ? 0.15 : 0.08));
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        
        noiseSource.start(t);
        noiseSource.stop(t + 0.2);

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
        
        // Play sound
        playTypewriterSound(char);

        // --- Calculate Dynamic Delay ---
        let delay = speed;
        
        // 1. Human Imperfection: Randomize speed by +/- 50%
        const variance = (Math.random() * 0.8) + 0.6; 
        delay *= variance;

        // 2. Contextual Pauses
        if (char === '.' || char === '?' || char === '!') {
            delay += 400; // End of sentence reflection
        } else if (char === ',' || char === ';') {
            delay += 200; // Mid-sentence pause
        } else if (char === '\n') {
            delay += 500; // Carriage return thought process
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