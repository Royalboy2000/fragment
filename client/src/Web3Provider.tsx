import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { WagmiConfig } from 'wagmi'
import { mainnet, bsc, polygon } from 'viem/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const projectId = '71aee37d416435724b88c898b71df97a'

const metadata = {
  name: 'Multi-Chain Wallet Manager',
  description: 'Manage EVM balances across chains',
  url: 'https://smskenya.net',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet, bsc, polygon]
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

createWeb3Modal({ wagmiConfig, projectId, chains })

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiConfig>
  )
}
