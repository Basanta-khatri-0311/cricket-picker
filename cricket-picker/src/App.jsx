import React, { useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

registerSW({ onNeedRefresh() { window.location.reload(); } });

function App() {
  const [view, setView] = useState('home');
  const [numPlayers, setNumPlayers] = useState("");
  const [playersPerTeam, setPlayersPerTeam] = useState("2");
  const [cards, setCards] = useState([]);
  const [tossResult, setTossResult] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);

  // --- AUDIO & HAPTIC ---
  const playSound = (type) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type === 'flip' ? 'sine' : 'square';
    osc.frequency.setValueAtTime(type === 'flip' ? 600 : 800, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
  };

  const triggerHaptic = () => { if (navigator.vibrate) navigator.vibrate(50); };

  const setupOrder = () => {
    const count = parseInt(numPlayers);
    if (isNaN(count) || count < 1) return;
    let pool = Array.from({ length: count }, (_, i) => ({
      id: i, value: i + 1, isRevealed: false
    }));
    pool.sort(() => Math.random() - 0.5);
    setCards(pool);
    setView('cards');
  };

  const setupSquads = () => {
    const total = parseInt(numPlayers);
    const perTeam = parseInt(playersPerTeam);
    if (isNaN(total) || total < 1) return;
    let pool = [];
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    for (let i = 0; i < total; i++) {
      const teamIndex = Math.floor(i / perTeam);
      pool.push(alphabet[teamIndex] || teamIndex + 1);
    }
    pool.sort(() => Math.random() - 0.5);
    setCards(pool.map((val, index) => ({ id: index, value: val, isRevealed: false })));
    setView('cards');
  };

  const handleReveal = (id) => {
    playSound('flip');
    triggerHaptic();
    const updatedCards = cards.map(c => c.id === id ? { ...c, isRevealed: true } : c);
    setCards(updatedCards);
    if (updatedCards.filter(c => !c.isRevealed).length === 1) {
      setTimeout(() => { playSound('success'); setCards(prev => prev.map(c => ({ ...c, isRevealed: true }))); }, 600);
    }
  };

  const handleToss = () => {
    setIsFlipping(true); setTossResult(null); playSound('flip');
    setTimeout(() => {
      setTossResult(Math.random() < 0.5 ? 'HEADS' : 'TAILS');
      setIsFlipping(false); playSound('success'); triggerHaptic();
    }, 3000);
  };

  return (
    <div className="h-screen bg-[#09090b] text-zinc-100 font-sans antialiased selection:bg-white selection:text-black overflow-x-hidden p-6 relative">

      {/* Dynamic Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-800/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md mx-auto flex flex-col min-h-screen relative z-10">

        {/* HEADER */}
        <header className="mb-12 text-center shrink-0">
          <h1 className="text-xs font-bold tracking-[0.6em] uppercase text-zinc-600 mb-1">
            12th MEN <span className="text-white">Protocol</span>
          </h1>
          <div className="h-[2px] w-6 bg-gradient-to-r from-transparent via-zinc-500 to-transparent mx-auto"></div>
        </header>

        {/* HOME MENU */}
        {view === 'home' && (
          <div className="flex-1 flex flex-col justify-center gap-6 animate-in fade-in zoom-in-95 duration-700">
            {[
              { id: 'toss', num: '01', title: 'Coin Toss', icon: '🪙' },
              { id: 'order-setup', num: '02', title: 'Order Selection', icon: '🏏' },
              { id: 'squad-setup', num: '03', title: 'Squad Match', icon: '🤝' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className="group relative bg-zinc-900/40 backdrop-blur-md border border-white/5 p-8 rounded-2xl text-left transition-all hover:bg-zinc-800/60 hover:border-white/20 active:scale-[0.97]"
              >
                <span className="text-zinc-600 text-[10px] font-mono tracking-widest block mb-2">PROTOCOL {item.num}</span>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter group-hover:translate-x-1 transition-transform">{item.title}</h2>
                <div className="absolute right-6 bottom-6 text-4xl opacity-[0.03] group-hover:opacity-10 transition-opacity grayscale">{item.icon}</div>
              </button>
            ))}
          </div>
        )}

        {/* SETUP VIEWS */}
        {(view === 'order-setup' || view === 'squad-setup') && (
          <div className="flex-1 flex flex-col justify-center space-y-12 animate-in slide-in-from-bottom-8 duration-500">
            <div className="text-center">
              <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-500 mb-12 italic">
                {view === 'order-setup' ? "Batting Order" : "Team Matching"}
              </h2>
              <div className="relative inline-block">
                <input
                  type="number"
                  className="w-full bg-transparent text-center focus:outline-none text-[10rem] leading-none font-black text-white placeholder-zinc-900 tracking-tighter"
                  value={numPlayers}
                  onChange={(e) => setNumPlayers(e.target.value)}
                  autoFocus
                  placeholder="00"
                />
                <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>
              <p className="mt-8 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Target Squad Size</p>
            </div>

            {view === 'squad-setup' && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6 font-bold">Players Per Team</span>
                <div className="grid grid-cols-5 gap-3 w-full max-w-[320px] mb-8">
                  {Array.from({ length: 10 }, (_, i) => (i + 2).toString()).map(n => (
                    <button
                      key={n}
                      onClick={() => setPlayersPerTeam(n)}
                      className={`h-12 rounded-xl border transition-all font-mono text-sm flex items-center justify-center
            ${playersPerTeam === n
                          ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                          : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 bg-zinc-900/20'
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="w-12 h-[1px] bg-zinc-800 mb-2"></div>
              </div>
            )}

            <div className="space-y-4 pt-8">
              <button
                onClick={view === 'order-setup' ? setupOrder : setupSquads}
                className="w-full bg-white text-black font-black py-6 rounded-2xl uppercase tracking-[0.2em] text-xs shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95 transition-all"
              >
                Begin Protocol
              </button>
              <button onClick={() => setView('home')} className="w-full text-zinc-600 text-[10px] uppercase tracking-widest text-center py-2 hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* CARDS DISPLAY - MAXIMUM VISIBILITY */}
        {view === 'cards' && (
          <div className="flex-1 animate-in fade-in duration-1000">
            <div className="grid grid-cols-3 gap-4">
              {cards.map((card) => (
                <div 
                  key={card.id} 
                  onClick={() => !card.isRevealed && handleReveal(card.id)} 
                  className="perspective-1000 h-36 cursor-pointer"
                >
                  <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${card.isRevealed ? 'rotate-y-180' : ''}`}>
                    
                    {/* Front: SUPER VISIBLE - Bright card with strong border */}
                    <div className="absolute inset-0 backface-hidden bg-zinc-800 border-4 border-zinc-600 rounded-2xl flex items-center justify-center shadow-2xl hover:border-zinc-500 hover:bg-zinc-700 transition-all">
                      <div className="flex flex-col items-center gap-2">
                        {/* Large visible icon */}
                        <div className="w-16 h-16 rounded-full border-4 border-zinc-500 flex items-center justify-center bg-zinc-700">
                          <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                        </div>
                        {/* Clear label */}
                        <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">TAP</span>
                      </div>
                    </div>
                    
                    {/* Back: Revealed card - bright white */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white border-4 border-white rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                      <span className="text-black text-6xl font-black italic tracking-tighter">{card.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-12 space-y-3">
              <button 
                onClick={() => setCards(prev => prev.map(c => ({ ...c, isRevealed: true })))}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold py-5 rounded-xl border-2 border-zinc-600 transition-all shadow-xl"
              >
                REVEAL ALL CARDS
              </button>
              <button 
                onClick={() => setView('home')} 
                className="w-full text-zinc-500 hover:text-white text-xs uppercase tracking-[0.4em] text-center border-2 border-zinc-800 hover:border-zinc-700 py-4 rounded-xl transition-all"
              >
                End Session
              </button>
            </div>
          </div>
        )}

        {/* COIN TOSS */}
        {view === 'toss' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
            <div className="relative mb-20">
              <div className={`w-56 h-56 rounded-full bg-gradient-to-tr from-zinc-200 to-white flex items-center justify-center text-zinc-950 text-8xl font-black shadow-[0_30px_60px_rgba(0,0,0,0.5),0_0_100px_rgba(255,255,255,0.1)] transition-transform duration-700 preserve-3d ${isFlipping ? 'animate-coin' : ''}`}>
                {tossResult ? (tossResult === 'HEADS' ? 'H' : 'T') : '•'}
              </div>
            </div>
            <h2 className="text-5xl font-black italic mb-20 uppercase tracking-tighter h-12 text-white">
              {isFlipping ? "shuffling..." : tossResult}
            </h2>
            <button onClick={handleToss} disabled={isFlipping} className="w-full bg-white text-black font-black py-6 rounded-2xl uppercase tracking-[0.2em] text-xs active:scale-95 disabled:opacity-30 transition-all">
              Commit Flip
            </button>
            <button onClick={() => setView('home')} className="mt-8 text-zinc-600 text-[10px] uppercase tracking-widest">Return</button>
          </div>
        )}
      </div>

      {/* Custom styles for 3D flip */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes coin {
          0%, 100% { transform: rotateX(0deg) rotateY(0deg); }
          25% { transform: rotateX(180deg) rotateY(180deg); }
          50% { transform: rotateX(360deg) rotateY(360deg); }
          75% { transform: rotateX(540deg) rotateY(540deg); }
        }
        .animate-coin {
          animation: coin 3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default App;