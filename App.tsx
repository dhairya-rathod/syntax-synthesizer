import React, { useState, useEffect, useCallback } from 'react';
import CodeEditor from './components/CodeEditor';
import Visualizer from './components/Visualizer';
import { audioEngine } from './services/audioEngine';
import { parseCodeToMusic } from './services/codeParser';
import { DEFAULT_CODE } from './constants';
import { Play, Square, RotateCcw, Zap, Code2, Music2, Activity } from 'lucide-react';

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(0);
  const [eventCount, setEventCount] = useState(0);

  const handlePlay = async () => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      // Initialize audio context on first interaction
      await audioEngine.initialize();
      
      const composition = parseCodeToMusic(code);
      setBpm(composition.bpm);
      setEventCount(composition.melodyEvents.length);
      
      audioEngine.play(composition);
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    audioEngine.stop();
    setIsPlaying(false);
    setCode(DEFAULT_CODE);
  };

  // Stop audio if component unmounts
  useEffect(() => {
    return () => {
      audioEngine.stop();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="flex-none h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Zap className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Syntax Synthesizer
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1">
                <Code2 className="w-3 h-3" /> PARSER: READY
            </span>
            <span className="flex items-center gap-1">
                <Music2 className="w-3 h-3" /> TONE.JS: {isPlaying ? 'ACTIVE' : 'STANDBY'}
            </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Panel: Code Editor */}
        <div className="flex-1 flex flex-col min-h-[50vh] md:h-auto p-4 relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CodeEditor code={code} onChange={setCode} />
          
          {/* Info Bar under code */}
          <div className="mt-2 flex justify-between items-center text-xs font-mono text-slate-400 px-2">
             <span>{code.split('\n').length} lines</span>
             <span>Indentation depth controls Pitch</span>
          </div>
        </div>

        {/* Right Panel: Visualizer & Controls */}
        <div className="flex-1 flex flex-col border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/30">
          
          {/* Visualizer Area */}
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
                 <Visualizer isPlaying={isPlaying} />
            </div>
            
            {/* Overlay Stats */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end pointer-events-none">
                {isPlaying && (
                    <>
                        <div className="bg-black/40 backdrop-blur px-3 py-1 rounded-full border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono animate-pulse">
                            BPM: {bpm}
                        </div>
                        <div className="bg-black/40 backdrop-blur px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400 text-xs font-bold font-mono">
                            EVENTS: {eventCount}
                        </div>
                    </>
                )}
            </div>
          </div>

          {/* Control Dock */}
          <div className="h-24 flex-none border-t border-slate-800 bg-slate-950 flex items-center justify-center gap-6">
             <button 
                onClick={handleReset}
                className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all transform hover:scale-105 active:scale-95"
                title="Reset Code"
             >
                <RotateCcw className="w-5 h-5" />
             </button>

             <button 
                onClick={handlePlay}
                className={`group relative flex items-center justify-center w-16 h-16 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-900/20 ${
                    isPlaying 
                    ? 'bg-rose-500/10 border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white' 
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                }`}
             >
                {isPlaying ? (
                    <Square className="w-6 h-6 fill-current" />
                ) : (
                    <Play className="w-8 h-8 fill-current ml-1" />
                )}
             </button>
             
             <div className="flex flex-col items-center justify-center w-10">
                 <Activity className={`w-5 h-5 ${isPlaying ? 'text-emerald-400 animate-bounce' : 'text-slate-600'}`} />
             </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
