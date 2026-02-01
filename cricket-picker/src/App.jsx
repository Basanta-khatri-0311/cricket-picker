import React, { useState, useEffect } from 'react';

function App() {
  const [view, setView] = useState('home'); 
  const [numPlayers, setNumPlayers] = useState("");
  const [cards, setCards] = useState([]);
  const [tossResult, setTossResult] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);

  // --- AUDIO SYNTHESIZER ---
const playSound = (type) => {
  // Create context only after user gesture
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContext();
  
  // Safari fix: Resume context if it's suspended
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  if (type === 'flip') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } else if (type === 'success') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }
  osc.connect(gain);
  gain.connect(ctx.destination);
};

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(50);
  };

  // --- LINEUP LOGIC ---
  const setupOrder = () => {
    const count = parseInt(numPlayers);
    if (isNaN(count) || count < 1) return;
    let newCards = Array.from({ length: count }, (_, i) => ({
      id: i, value: i + 1, isRevealed: false
    }));
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }
    setCards(newCards);
    setView('cards');
  };

  const handleReveal = (id) => {
    playSound('flip');
    triggerHaptic();
    
    const updatedCards = cards.map(card => 
      card.id === id ? { ...card, isRevealed: true } : card
    );
    setCards(updatedCards);

    const hiddenCards = updatedCards.filter(c => !c.isRevealed);
    if (hiddenCards.length === 1) {
      setTimeout(() => {
        playSound('success');
        triggerHaptic();
        setCards(prev => prev.map(c => ({ ...c, isRevealed: true })));
      }, 600);
    }
  };

  // --- TOSS LOGIC ---
  const handleToss = () => {
    setIsFlipping(true);
    setTossResult(null);
    playSound('flip');
    
    setTimeout(() => {
      setTossResult(Math.random() < 0.5 ? 'HEADS' : 'TAILS');
      setIsFlipping(false);
      playSound('success');
      triggerHaptic();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans antialiased selection:bg-zinc-500 overflow-x-hidden">
      <div className="max-w-md mx-auto px-6 py-12 flex flex-col min-h-screen">
        
        {/* HEADER */}
        <header className="mb-12 text-center shrink-0">
          <h1 className="text-xl font-extralight tracking-[0.4em] uppercase text-zinc-500">
            Order <span className="font-bold text-white tracking-widest">Protocol</span>
          </h1>
          <div className="h-[1px] w-8 bg-zinc-800 mx-auto mt-4"></div>
        </header>

        {/* HOME MENU */}
        {view === 'home' && (
          <div className="flex-1 flex flex-col justify-center gap-4 animate-in fade-in zoom-in-95 duration-500">
            <button onClick={() => setView('toss')} className="group bg-zinc-900 border border-zinc-800 p-8 rounded-sm hover:border-zinc-400 transition-all text-left relative overflow-hidden">
              <span className="text-zinc-600 text-[10px] tracking-[0.3em] uppercase block mb-1 font-bold">Step 01</span>
              <h2 className="text-2xl font-black italic tracking-tight uppercase group-hover:text-white transition-colors">Coin Toss</h2>
              <div className="absolute -right-2.5 -bottom-2.5 text-6xl opacity-5 group-hover:opacity-10 transition-opacity">🪙</div>
            </button>

            <button onClick={() => setView('order')} className="group bg-zinc-900 border border-zinc-800 p-8 rounded-sm hover:border-zinc-400 transition-all text-left relative overflow-hidden">
              <span className="text-zinc-600 text-[10px] tracking-[0.3em] uppercase block mb-1 font-bold">Step 02</span>
              <h2 className="text-2xl font-black italic tracking-tight uppercase group-hover:text-white transition-colors">Order Selection</h2>
              <div className="absolute -right-2.5 -bottom-2.5 text-6xl opacity-5 group-hover:opacity-10 transition-opacity">🏏</div>
            </button>
          </div>
        )}

        {/* COIN TOSS VIEW */}
        {view === 'toss' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="perspective-1000 mb-12">
              <div className={`w-40 h-40 rounded-full bg-zinc-100 border-4 border-zinc-300 flex items-center justify-center text-zinc-900 text-6xl font-black shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-transform duration-700 preserve-3d ${isFlipping ? 'animate-coin' : ''}`}>
                 {tossResult ? (tossResult === 'HEADS' ? 'H' : 'T') : '🪙'}
              </div>
            </div>
            
            <h2 className="text-4xl font-black italic mb-12 tracking-tighter text-white uppercase h-10">
              {isFlipping ? "Flipping..." : tossResult}
            </h2>
            
            <button onClick={handleToss} disabled={isFlipping} className="w-full bg-white text-black font-black py-5 rounded-sm uppercase tracking-[0.2em] text-sm active:scale-95 disabled:opacity-30 transition-all shadow-lg">
              Perform Toss
            </button>
            <button onClick={() => {setView('home'); setTossResult(null);}} className="mt-8 text-zinc-600 text-[10px] uppercase tracking-widest underline underline-offset-8">Exit</button>
          </div>
        )}

        {/* ORDER SETUP VIEW */}
        {view === 'order' && (
          <div className="flex-1 flex flex-col justify-center space-y-12 animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 mb-6 block font-bold">Squad Size</span>
              <input type="number" placeholder="0" className="w-full bg-transparent text-center focus:outline-none text-9xl font-black text-white placeholder-zinc-900" value={numPlayers} onChange={(e) => setNumPlayers(e.target.value)} autoFocus />
            </div>
            <button onClick={setupOrder} className="w-full bg-white text-black font-black py-5 rounded-sm uppercase tracking-[0.2em] text-sm active:scale-95 transition-all">Initialize Deck</button>
            <button onClick={() => setView('home')} className="mt-4 text-zinc-600 text-[10px] uppercase tracking-widest text-center underline underline-offset-8">Cancel</button>
          </div>
        )}

        {/* CARDS DISPLAY VIEW */}
        {view === 'cards' && (
          <div className="flex-1 animate-in fade-in duration-700 pb-10">
            <div className="grid grid-cols-3 gap-3">
              {cards.map((card) => (
                <div key={card.id} onClick={() => !card.isRevealed && handleReveal(card.id)} className="perspective-1000 h-32 cursor-pointer">
                  <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${card.isRevealed ? 'rotate-y-180' : ''}`}>
                    <div className="absolute inset-0 backface-hidden bg-zinc-900 border border-zinc-800 rounded-sm flex flex-col items-center justify-center">
                       <span className="text-3xl grayscale opacity-30">🏏</span>
                    </div>
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white border border-white rounded-sm flex items-center justify-center">
                      <span className="text-zinc-950 text-5xl font-black italic tracking-tighter">{card.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setView('order')} className="mt-16 w-full text-zinc-600 text-[10px] uppercase tracking-[0.4em] text-center border border-zinc-900 py-4 hover:border-zinc-700 transition-all">← New Session</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;