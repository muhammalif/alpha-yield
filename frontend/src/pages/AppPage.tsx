import { useAccount } from 'wagmi';
import { u2uNebulasTestnet } from '@/config/wagmi';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@/components/ConnectButton';
import { NetworkGuard } from '@/components/NetworkGuard';
import { StatsCard } from '@/components/StatsCard';
import { DepositForm } from '@/components/DepositForm';
import { WithdrawForm } from '@/components/WithdrawForm';
import { ClaimRewards } from '@/components/ClaimRewards';
import { AIStatus } from '@/components/AIStatus';
import { useVaultData } from '@/hooks/useVaultData';
import { useUserData } from '@/hooks/useUserData';
import { formatBalance, shortenAddress } from '@/lib/formatters';
import { Vault, TrendingUp, Coins, Wallet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AppPage = () => {
  const { address, isConnected } = useAccount();
  const { totalAssets, strategyBalance, token } = useVaultData();
  const { vaultBalance, tokenBalance, tokenSymbol } = useUserData(token);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/alphayield-logo.png" alt="AlphaYield Logo" className="h-16 w-16" />
            <h1 className="text-2xl font-bold gradient-text">AlphaYield</h1>
          </Link>
          <div className="flex items-center gap-4">
            {isConnected && address && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                <Wallet className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">{u2uNebulasTestnet.name}</span>
              </div>
            )}
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center space-y-6 max-w-md">
              <img src="/alphayield-logo.png" alt="AlphaYield Logo" className="h-20 w-20 mx-auto" />
              <h2 className="text-3xl font-bold gradient-text">
                Connect Your Wallet
              </h2>
              <p className="text-muted-foreground">
                Connect your wallet to start earning AI-optimized yields on U2U Network.
              </p>
              <ConnectButton />
            </div>
          </div>
        ) : (
          <NetworkGuard>
             <div className="space-y-8">
               {/* Vault Statistics */}
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Vault className="h-6 w-6 text-primary" />
                  Vault Overview
                </h2>
                 <div className="grid md:grid-cols-2 gap-4">
                   <StatsCard
                     title="Total Assets"
                     value={`${formatBalance(totalAssets)} ${tokenSymbol}`}
                     icon={Coins}
                     description="Total value locked in vault"
                   />
                   <StatsCard
                     title="Strategy Balance"
                     value={`${formatBalance(strategyBalance)} ${tokenSymbol}`}
                     icon={TrendingUp}
                     description="Assets deployed in strategies"
                   />
                 </div>
              </div>

              {/* User Position */}
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Wallet className="h-6 w-6 text-accent" />
                  Your Position
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <StatsCard
                    title="Wallet Balance"
                    value={`${formatBalance(tokenBalance)} ${tokenSymbol}`}
                    icon={Wallet}
                    description="Available to deposit"
                  />
                  <StatsCard
                    title="Vault Balance"
                    value={`${formatBalance(vaultBalance)} ${tokenSymbol}`}
                    icon={Vault}
                    description="Your deposited amount"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DepositForm />
                <WithdrawForm />
                <ClaimRewards />
              </div>

              {/* AI Controller */}
              <AIStatus />
            </div>
          </NetworkGuard>
        )}
      </main>
    </div>
  );
};

export default AppPage;
