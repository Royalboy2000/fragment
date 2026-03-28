import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'

const projectId = '71aee37d416435724b88c898b71df97a'

const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://eth.llamarpc.com'
}

const bsc = {
  chainId: 56,
  name: 'BNB Chain',
  currency: 'BNB',
  explorerUrl: 'https://bscscan.com',
  rpcUrl: 'https://bsc-dataseed.binance.org'
}

const polygon = {
  chainId: 137,
  name: 'Polygon',
  currency: 'MATIC',
  explorerUrl: 'https://polygonscan.com',
  rpcUrl: 'https://polygon-rpc.com'
}

const metadata = {
  name: 'Fragment Wallet',
  description: 'Connect your wallet to Fragment',
  url: 'https://fragment.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const w3m = createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains: [mainnet, bsc, polygon],
  projectId,
  enableAnalytics: false
})

// Expose modal to window for easy access from legacy components
if (typeof window !== 'undefined') {
  (window as any).w3m = w3m;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
