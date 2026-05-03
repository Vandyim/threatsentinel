'use client'

import '@rainbow-me/rainbowkit/styles.css'
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

const genlayerStudionet = {
  id: 16601,
  name: 'GenLayer Studionet',
  nativeCurrency: { decimals: 18, name: 'GEN', symbol: 'GEN' },
  rpcUrls: {
    default: { http: ['https://studio.genlayer.com:8443/api'] },
  },
} as const

export const wagmiConfig = getDefaultConfig({
  appName: 'ThreatSentinel',
  projectId: 'caa78cac0cd9c16028ad565086e16c14',
  chains: [genlayerStudionet, mainnet], // ← mainnet added so RainbowKit initialises
  ssr: true,
})

const queryClient = new QueryClient()

const theme = darkTheme({
  accentColor: '#00d4ff',
  accentColorForeground: '#050505',
  borderRadius: 'none',
  fontStack: 'system',
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}