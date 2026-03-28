import { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, LogOut, Trash2, Plus, Wallet, Shield, Loader2, QrCode } from 'lucide-react';
import { useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react';

export default function AdminView({ onLogout, userRole }: { onLogout: () => void, userRole: string }) {
  const { address, isConnected } = useWeb3ModalAccount();
  const { open } = useWeb3Modal();
  const [activeTab, setActiveTab] = useState<'balances' | 'destinations'>('balances');
  const [wallets, setWallets] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWallet, setNewWallet] = useState({ label: '', address: '' });
  const [newDest, setNewDest] = useState({ label: '', address: '', network: 'all' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'balances') {
        const res = await fetch('/api/balances');
        const data = await res.json();
        setWallets(data);
      } else {
        const res = await fetch('/api/destinations');
        const data = await res.json();
        setDestinations(data);
      }
    } catch (e) {}
    setLoading(false);
  };

  const addWallet = async () => {
    await fetch('/api/watched', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWallet)
    });
    setNewWallet({ label: '', address: '' });
    fetchData();
  };

  const addWalletWithAddress = async (addr: string) => {
    await fetch('/api/watched', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newWallet.label || 'Connected Wallet', address: addr })
    });
    setNewWallet({ label: '', address: '' });
    fetchData();
  };

  const addDest = async () => {
    await fetch('/api/destinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDest)
    });
    setNewDest({ label: '', address: '', network: 'all' });
    fetchData();
  };

  const deleteItem = async (type: 'watched' | 'destinations', id: number) => {
    await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex gap-6">
            <button onClick={() => setActiveTab('balances')} className={`flex items-center gap-2 font-bold text-sm ${activeTab === 'balances' ? 'text-fragment-blue' : 'text-white/40'}`}>
              <LayoutDashboard size={18} /> Balances
            </button>
            <button onClick={() => setActiveTab('destinations')} className={`flex items-center gap-2 font-bold text-sm ${activeTab === 'destinations' ? 'text-fragment-blue' : 'text-white/40'}`}>
              <Settings size={18} /> Destinations
            </button>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black uppercase text-white/20 bg-white/5 px-2 py-1 rounded tracking-widest">{userRole}</span>
             <button onClick={onLogout} className="text-white/20 hover:text-red-500 transition-colors">
               <LogOut size={20} />
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'balances' ? (
          <div className="space-y-6">
            <div className="grid gap-4">
              <h2 className="text-xl font-black">Watched Wallets</h2>
              {userRole === 'admin' && (
                <div className="glass-card p-6 border-white/10 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <input placeholder="Label" value={newWallet.label} onChange={e => setNewWallet({...newWallet, label: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-fragment-blue" />
                    <input placeholder="Address" value={newWallet.address} onChange={e => setNewWallet({...newWallet, address: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-fragment-blue" />
                    <button
                      onClick={() => open()}
                      className="bg-white/5 border border-white/10 text-white/60 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                    >
                      <QrCode size={16} /> {isConnected ? 'Connected' : 'Scan'}
                    </button>
                    <button
                      onClick={() => isConnected && !newWallet.address ? addWalletWithAddress(address!) : addWallet()}
                      className="bg-fragment-blue text-white rounded-xl font-bold text-sm"
                    >
                      Add Wallet
                    </button>
                  </div>
                  {isConnected && !newWallet.address && (
                    <p className="text-[10px] text-fragment-blue font-bold px-1">Detected: {address}</p>
                  )}
                </div>
              )}

              {loading ? <Loader2 className="animate-spin mx-auto text-fragment-blue" /> : (
                <div className="grid gap-4">
                  {wallets.map(w => (
                    <div key={w.id} className="glass-card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-white/5 hover:border-white/10 transition-colors">
                      <div>
                        <p className="font-bold text-white">{w.label}</p>
                        <p className="text-xs text-white/40 font-mono">{w.address}</p>
                      </div>
                      <div className="flex gap-6 items-center">
                        <div className="flex gap-4 text-[10px] font-black uppercase">
                          <div className="text-blue-400">ETH: {parseFloat(w.balances.ethereum).toFixed(4)}</div>
                          <div className="text-yellow-400">BNB: {parseFloat(w.balances.bnb).toFixed(4)}</div>
                          <div className="text-purple-400">POLY: {parseFloat(w.balances.polygon).toFixed(4)}</div>
                        </div>
                        {userRole === 'admin' && (
                          <button onClick={() => deleteItem('watched', w.id)} className="text-white/10 hover:text-red-500"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4">
              <h2 className="text-xl font-black">Receiving Addresses</h2>
              {userRole === 'admin' && (
                <div className="glass-card p-6 border-white/10 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <input placeholder="Label" value={newDest.label} onChange={e => setNewDest({...newDest, label: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-fragment-blue" />
                    <input placeholder="Address" value={newDest.address} onChange={e => setNewDest({...newDest, address: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-fragment-blue" />
                    <select value={newDest.network} onChange={e => setNewDest({...newDest, network: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none text-white/60">
                      <option value="all">All Networks</option>
                      <option value="ethereum">Ethereum</option>
                      <option value="bnb">BNB Chain</option>
                      <option value="polygon">Polygon</option>
                    </select>
                    <button onClick={addDest} className="bg-fragment-blue text-white rounded-xl font-bold text-sm">Add Destination</button>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                {destinations.map(d => (
                  <div key={d.id} className="glass-card p-5 flex justify-between items-center border-white/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white">{d.label}</p>
                        <span className="text-[8px] font-black uppercase bg-white/5 px-1.5 py-0.5 rounded text-white/40 border border-white/10">{d.network}</span>
                      </div>
                      <p className="text-xs text-white/40 font-mono">{d.address}</p>
                    </div>
                    {userRole === 'admin' && (
                      <button onClick={() => deleteItem('destinations', d.id)} className="text-white/10 hover:text-red-500"><Trash2 size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
