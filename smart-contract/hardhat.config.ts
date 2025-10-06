import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config"

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    solaris: {
      url: 'https://rpc-mainnet.u2u.xyz/',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : undefined,
    },
    nebulas: {
      url: 'https://rpc-nebulas-testnet.u2u.xyz/',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : undefined,
    }
  },
  etherscan: {
    apiKey: {
      solaris: "abc", // arbitrary string
      nebulas: "abc", // arbitrary string
    },
    customChains: [
      {
        network: "solaris",
        chainId: 39,
        urls: {
          apiURL: "https://u2uscan.xyz/api",
          browserURL: "https://u2uscan.xyz"
        }
      },
      {
        network: "nebulas",
        chainId: 2484,
        urls: {
          apiURL: "https://testnet.u2uscan.xyz/api",
          browserURL: "https://testnet.u2uscan.xyz"
        }
      },
    ]
  }
};

export default config;