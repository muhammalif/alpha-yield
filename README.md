# AlphaYield

An AI-powered yield aggregator decentralized application built for the U2U Network. AlphaYield automates yield farming strategies using intelligent AI controllers to optimize returns across various DeFi protocols.

## Features

- **AI-Powered Strategy Optimization**: Automated yield farming with AI-driven decision making
- **Multi-Asset Support**: Deposit tokens or native U2U currency
- **Real-Time Analytics**: View vault statistics, user positions, and AI controller status
- **Seamless Web3 Integration**: Connect with MetaMask and other Web3 wallets
- **Automated Harvesting**: AI agent handles yield harvesting and slippage management
- **Cross-Platform**: Smart contracts, frontend dApp, and AI agent components

## Project Structure

```
a-yield/
├── ai-agent/          # AI automation agent for yield harvesting
├── frontend/          # React-based dApp frontend
├── smart-contract/    # Solidity smart contracts with Hardhat
└── README.md         # This file
```

## Prerequisites

- Node.js & npm
- MetaMask or compatible Web3 wallet
- U2U Nebulas Testnet configured in your wallet

## Network Configuration

### U2U Nebulas Testnet
- **Chain ID**: 2484
- **RPC URL**: https://rpc-nebulas-testnet.u2u.xyz/
- **Explorer**: https://testnet.u2uscan.xyz
- **Currency**: U2U

## Usage

1. **Connect Wallet**: Use MetaMask to connect to U2U Nebulas Testnet
2. **Deposit Assets**: Deposit tokens or U2U into the yield vault
3. **Monitor Performance**: View real-time statistics and AI status
4. **Claim Rewards**: Harvest accumulated yields
5. **Withdraw**: Remove assets when desired

## Key Components

### Smart Contracts
- **YieldVault**: Main vault for asset deposits and withdrawals
- **StrategyRouter**: Manages yield farming strategies
- **AIController**: Intelligent controller for automated decisions
- **WrappedU2U**: Wrapped U2U token for native currency handling

### Frontend
- **Landing Page**: Project overview and feature highlights
- **App Dashboard**: Full dApp functionality with wallet integration
- **Real-time Stats**: Vault balances, user positions, and AI metrics

### AI Agent
- **Harvest Job**: Automated yield harvesting
- **Slippage Job**: Slippage management for optimal trades


## License

MIT License - see individual component licenses for details.

## Support

For issues or questions:
- Check the component-specific README files
- Review the setup guides
- Contact the development team

## Disclaimer

This dApps building on U2U Network to participate on VietBUIDL Hackathon.
