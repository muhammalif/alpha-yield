import { http, createConfig, createStorage } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

export const u2uNebulasTestnet = defineChain({
  id: 2484,
  name: 'U2U Nebulas Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'U2U',
    symbol: 'U2U',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-nebulas-testnet.u2u.xyz/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'U2U Scan',
      url: 'https://testnet.u2uscan.xyz',
    },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [u2uNebulasTestnet],
  connectors: [injected()],
  transports: {
    [u2uNebulasTestnet.id]: http(),
  },
  storage: createStorage({ storage: window.localStorage }),
});

