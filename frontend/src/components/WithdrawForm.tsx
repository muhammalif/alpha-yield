import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TokenAmountInput } from './TokenAmountInput';
import { VAULT_ADDRESS, VAULT_ABI } from '@/config/contracts';
import { useUserData } from '@/hooks/useUserData';
import { useVaultData } from '@/hooks/useVaultData';
import { toWei, formatBalance } from '@/lib/formatters';
import { u2uSolarisMainnet } from '@/config/wagmi';
import { toast } from 'sonner';
import { Loader2, ArrowUp, AlertTriangle } from 'lucide-react';

export function WithdrawForm() {
  const { address, chainId } = useAccount();
  const { token, totalAssets } = useVaultData();
  const { vaultBalance, tokenSymbol, refetch } = useUserData(token);
  const [amount, setAmount] = useState('');

  const { writeContract: withdraw, data: hash } = useWriteContract();

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success(
        <div>
          Withdrawal successful!{' '}
          <a
            href={`https://u2uscan.xyz/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View Tx
          </a>
        </div>
      );
      setAmount('');
      refetch();
    }
  }, [isSuccess, hash, refetch]);

  const getValidatedVaultAddress = (): `0x${string}` | null => {
    const addr = VAULT_ADDRESS as string | undefined;
    if (!addr || typeof addr !== 'string') return null;
    const isHexAddress = /^0x[a-fA-F0-9]{40}$/.test(addr);
    return isHexAddress ? (addr as `0x${string}`) : null;
  };

  const handleWithdraw = async () => {
    if (!address || !amount) return;

    const amountWei = toWei(amount);
    if (amountWei > totalAssets) {
      toast.error(`Withdraw amount exceeds total invested assets (${formatBalance(totalAssets)} ${tokenSymbol}). Max withdrawable: ${formatBalance(totalAssets)} ${tokenSymbol}`);
      return;
    }

    try {
      const validatedVault = getValidatedVaultAddress();
      if (!validatedVault) {
        toast.error('Vault address is not configured. Set VITE_VAULT_ADDRESS in .env');
        return;
      }
      if (chainId && chainId !== u2uSolarisMainnet.id) {
        toast.error('Wrong network. Please switch to U2U Solaris Mainnet.');
        return;
      }

      // @ts-expect-error: wagmi type inference issue with dynamic ABI
      await withdraw({
        address: validatedVault,
        abi: VAULT_ABI,
        functionName: 'withdraw' as const,
        args: [amountWei] as const,
        gas: 500000n, // Set gas limit to avoid estimation issues
      });
      toast.info('Withdrawal transaction submitted');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Withdrawal failed: ${errorMessage}`);
      console.error('Withdrawal error:', error);
    }
  };

  return (
    <Card className="glass shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUp className="h-5 w-5 text-destructive" />
          Withdraw
        </CardTitle>
        <CardDescription>
          Withdraw your deposited assets from the vault
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <TokenAmountInput
          value={amount}
          onChange={setAmount}
          balance={vaultBalance}
          symbol={tokenSymbol}
          disabled={isLoading}
        />
        {amount && toWei(amount) > totalAssets && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              Amount exceeds total invested assets. Max withdrawable: {formatBalance(totalAssets)} {tokenSymbol}
            </span>
          </div>
        )}
        <Button
          onClick={handleWithdraw}
          disabled={isLoading || !amount || vaultBalance === 0n || toWei(amount) > totalAssets}
          className="w-full bg-gradient-accent hover:opacity-90"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Withdraw {tokenSymbol}
        </Button>
      </CardContent>
    </Card>
  );
}
