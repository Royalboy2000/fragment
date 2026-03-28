import { useState, useEffect } from 'react';
import { useWeb3Modal, useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react';
import { BrowserProvider, ethers } from 'ethers';
import { CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';

const ETH_RPC = 'https://eth.llamarpc.com';
const BNB_RPC = 'https://bsc-dataseed.binance.org';
const POLYGON_RPC = 'https://polygon-rpc.com';

export default function BatchTransfer({ onComplete }: { onComplete: () => void }) {
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [balances, setBalances] = useState<{ [key: string]: string }>({});
  const [destinations, setDestinations] = useState<any[]>([]);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [chainDestinations, setChainDestinations] = useState<{ [key: string]: number }>({});
  const [estimates, setEstimates] = useState<{ [key: string]: { gas: string, amount: string } }>({});
  const [step, setStep] = useState<'dash' | 'review' | 'processing' | 'success'>('dash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      fetchBalances();
      fetchDestinations();
    }
  }, [address]);

  const fetchBalances = async () => {
    setLoading(true);
    const chains = [
      { name: 'ethereum', rpc: ETH_RPC },
      { name: 'bnb', rpc: BNB_RPC },
      { name: 'polygon', rpc: POLYGON_RPC }
    ];

    const results: any = {};
    for (const chain of chains) {
      try {
        const provider = new ethers.JsonRpcProvider(chain.rpc);
        const bal = await provider.getBalance(address!);
        results[chain.name] = ethers.formatEther(bal);
      } catch (e) {
        results[chain.name] = '0.0';
      }
    }
    setBalances(results);
    setLoading(false);
  };

  const fetchDestinations = async () => {
    const res = await fetch('/api/destinations');
    if (res.ok) {
      const data = await res.json();
      setDestinations(data);
    }
  };

  const estimateGas = async () => {
    if (!walletProvider) return;
    setLoading(true);
    setError(null);

    const newEstimates: any = {};
    try {
      for (const chain of selectedChains) {
        const destId = chainDestinations[chain];
        const dest = destinations.find(d => d.id === destId);
        if (!dest) continue;

        const rpc = chain === 'ethereum' ? ETH_RPC : chain === 'bnb' ? BNB_RPC : POLYGON_RPC;
        const provider = new ethers.JsonRpcProvider(rpc);
        const feeData = await provider.getFeeData();

        const gasLimit = 21000n; // Basic transfer
        const gasPrice = feeData.gasPrice || 20000000000n;
        const gasCost = gasLimit * gasPrice;

        const bal = ethers.parseEther(balances[chain]);
        if (bal <= gasCost) {
            newEstimates[chain] = { gas: ethers.formatEther(gasCost), amount: '0.0', error: 'Insufficient' };
        } else {
            // Buffer gas by 20% to be safe
            const totalCost = gasCost * 120n / 100n;
            newEstimates[chain] = {
                gas: ethers.formatEther(gasCost),
                amount: ethers.formatEther(bal - totalCost)
            };
        }
      }
      setEstimates(newEstimates);
      setStep('review');
    } catch (e: any) {
      setError("Gas estimation failed: " + e.message);
    }
    setLoading(false);
  };

  const handleTransfer = async () => {
    if (!walletProvider) return;
    setStep('processing');
    setError(null);

    const ethersProvider = new BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();
    const chainMap: { [key: string]: number } = { ethereum: 1, bnb: 56, polygon: 137 };

    try {
      for (const chain of selectedChains) {
        const currentChainId = (await ethersProvider.getNetwork()).chainId;
        if (Number(currentChainId) !== chainMap[chain]) {
          setError(`Please switch your wallet network to ${chain.toUpperCase()} and try again.`);
          setStep('dash');
          return;
        }

        const destId = chainDestinations[chain];
        const dest = destinations.find(d => d.id === destId);
        const est = estimates[chain];
        if (!dest || !est || est.amount === '0.0') continue;

        const tx = await signer.sendTransaction({
          to: dest.address,
          value: ethers.parseEther(est.amount)
        });
        await tx.wait();
      }
      setStep('success');
    } catch (e: any) {
      setError(e.message || 'Transfer failed');
      setStep('dash');
    }
  };

  if (step === 'success') {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle2 size={64} className="text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Transfers Complete!</h2>
        <button onClick={onComplete} className="w-full p-4 bg-white/10 text-white rounded-xl">Close</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {step === 'dash' && (
        <>
          <div className="space-y-4">
            {['ethereum', 'bnb', 'polygon'].map(chain => (
              <div key={chain} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedChains.includes(chain)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedChains([...selectedChains, chain]);
                        else setSelectedChains(selectedChains.filter(c => c !== chain));
                      }}
                      className="w-5 h-5 rounded bg-white/10 border-white/20 text-fragment-blue focus:ring-0"
                    />
                    <div>
                      <p className="font-bold text-white uppercase text-xs">{chain}</p>
                      <p className="text-fragment-text-dim text-sm">{balances[chain] || '0.0'} {chain === 'ethereum' ? 'ETH' : chain === 'bnb' ? 'BNB' : 'MATIC'}</p>
                    </div>
                  </div>
                </div>

                {selectedChains.includes(chain) && (
                  <select
                    value={chainDestinations[chain] || ''}
                    onChange={e => setChainDestinations({...chainDestinations, [chain]: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white/60 outline-none"
                  >
                    <option value="">Select Destination</option>
                    {destinations.filter(d => d.network === chain || d.network === 'all').map(d => (
                      <option key={d.id} value={d.id}>{d.label} ({d.address.slice(0, 6)}...)</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={estimateGas}
            disabled={selectedChains.length === 0 || loading || selectedChains.some(c => !chainDestinations[c])}
            className="w-full py-5 bg-fragment-blue text-white rounded-2xl font-black disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Calculate Fees & Review'}
          </button>
        </>
      )}

      {step === 'review' && (
        <div className="space-y-6">
          <div className="space-y-4">
            {selectedChains.map(chain => {
              const est = estimates[chain];
              const dest = destinations.find(d => d.id === chainDestinations[chain]);
              return (
                <div key={chain} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-white/40 uppercase">{chain} Transfer</p>
                      <p className="text-sm font-bold text-white">{est?.amount} {chain === 'ethereum' ? 'ETH' : chain === 'bnb' ? 'BNB' : 'MATIC'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-white/40 uppercase">Est. Gas</p>
                      <p className="text-[10px] font-medium text-white/60">{est?.gas}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[10px] text-white/40 font-bold uppercase">Destination</p>
                    <p className="text-xs text-fragment-blue font-mono">{dest?.label} ({dest?.address.slice(0, 10)}...)</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3 text-blue-400 text-[10px] leading-relaxed">
            <Info size={16} className="shrink-0" />
            Amounts are automatically adjusted to leave enough balance for network transaction fees.
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep('dash')} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold">Back</button>
            <button onClick={handleTransfer} className="flex-[2] py-4 bg-fragment-blue text-white rounded-2xl font-black">Send Now</button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="text-center py-12 space-y-4">
          <Loader2 size={48} className="text-fragment-blue animate-spin mx-auto" />
          <p className="text-white font-bold">Awaiting Wallet Confirmation...</p>
          <p className="text-xs text-fragment-text-dim px-8">Confirm the transaction in your wallet. If sending multiple chains, your wallet will prompt you one-by-one. You may need to manually switch networks in your wallet app.</p>
        </div>
      )}
    </div>
  );
}
