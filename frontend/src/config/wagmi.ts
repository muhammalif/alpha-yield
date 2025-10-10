import { http, createConfig, createStorage } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

export const u2uSolarisMainnet = defineChain({
  id: 39,
  name: 'U2U Solaris Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'U2U',
    symbol: 'U2U',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-mainnet.u2u.xyz/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'U2U Scan',
      url: 'https://u2uscan.xyz',
    },
  },
  testnet: false,
});

export const config = createConfig({
  chains: [u2uSolarisMainnet],
  connectors: [injected()],
  transports: {
    [u2uSolarisMainnet.id]: http(),
  },
  storage: createStorage({ storage: window.localStorage }),
});

