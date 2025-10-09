import { useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VAULT_ADDRESS, VAULT_ABI } from '@/config/contracts';
import { useUserData } from '@/hooks/useUserData';
import { useVaultData } from '@/hooks/useVaultData';
import { formatBalance } from '@/lib/formatters';
import { u2uNebulasTestnet } from '@/config/wagmi';
import { toast } from 'sonner';
import { Loader2, Gift } from 'lucide-react';

export function ClaimRewards() {
  const { address, chainId } = useAccount();
  const { token, totalRewards } = useVaultData();
  const { vaultBalance, claimedRewards, tokenSymbol, refetch } = useUserData(token);

  const { writeContractAsync: claimAsync, data: hash } = useWriteContract();

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success(
        <div>
          Rewards claimed successfully!{' '}
          <a
            href={`https://testnet.u2uscan.xyz/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View Tx
          </a>
        </div>
      );
      refetch();
    }
  }, [isSuccess, hash, refetch]);

  const getValidatedVaultAddress = (): `0x${string}` | null => {
    const addr = VAULT_ADDRESS as string | undefined;
    if (!addr || typeof addr !== 'string') return null;
    const isHexAddress = /^0x[a-fA-F0-9]{40}$/.test(addr);
    return isHexAddress ? (addr as `0x${string}`) : null;
  };

  const handleClaim = async () => {
    if (!address) return;

    try {
      const validatedVault = getValidatedVaultAddress();
      if (!validatedVault) {
        toast.error('Vault address is not configured. Set VITE_VAULT_ADDRESS in .env');
        return;
      }
      if (chainId && chainId !== u2uNebulasTestnet.id) {
        toast.error('Wrong network. Please switch to U2U Nebulas Testnet.');
        return;
      }

      await claimAsync({
        address: VAULT_ADDRESS as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'claimRewards',
        chain: u2uNebulasTestnet,
        account: address as `0x${string}`,
        gas: 3000000n, // Set gas limit to avoid estimation issues
      });
      toast.info('Claim transaction submitted');
    } catch (error) {
      toast.error('Claim failed');
      console.error(error);
    }
  };

  // Calculate pending rewards (simplified calculation)
  const pendingRewards = totalRewards > 0n && vaultBalance > 0n 
    ? totalRewards - claimedRewards 
    : 0n;

  return (
    <Card className="glass shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-accent" />
          Claim Rewards
        </CardTitle>
        <CardDescription>
          Claim your accumulated yield rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Pending Rewards</span>
            <span className="text-lg font-bold gradient-text">
              {formatBalance(pendingRewards)} {tokenSymbol}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Claimed</span>
            <span className="text-sm">
              {formatBalance(claimedRewards)} {tokenSymbol}
            </span>
          </div>
        </div>
        <Button
          onClick={handleClaim}
          disabled={isLoading || pendingRewards === 0n}
          className="w-full bg-gradient-hero hover:opacity-90"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Claim Rewards
        </Button>
      </CardContent>
    </Card>
  );
}
