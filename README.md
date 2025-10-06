# AlphaYield

An AI-powered yield aggregator decentralized application (dApp) built for the U2U Nebulas Testnet. AlphaYield automates yield farming strategies using intelligent AI controllers to optimize returns across various DeFi protocols.

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

## Installation & Setup

### 1. Smart Contracts

```bash
cd smart-contract
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network nebulasTestnet
```

For detailed smart contract setup, see [smart-contract/README.md](smart-contract/README.md).

### 2. Frontend dApp

```bash
cd frontend
npm install
npm run dev
```

Configure contract addresses in `frontend/src/config/contracts.ts` after deployment.

For detailed frontend setup, see [frontend/README.md](frontend/README.md) and [frontend/SETUP.md](frontend/SETUP.md).

### 3. AI Agent

```bash
cd ai-agent
npm install
npm run dev
```

Configure environment variables for contract addresses and private keys.

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

## Development

### Testing
```bash
# Smart contracts
cd smart-contract && npx hardhat test

# Frontend
cd frontend && npm run lint
```

### Building
```bash
# Frontend production build
cd frontend && npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see individual component licenses for details.

## Support

For issues or questions:
- Check the component-specific README files
- Review the setup guides
- Contact the development team

## Disclaimer

This is experimental software for the U2U Nebulas Testnet. Use at your own risk. Always test thoroughly before mainnet deployment.