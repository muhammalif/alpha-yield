import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TokenAmountInput } from './TokenAmountInput';
import { VAULT_ADDRESS, VAULT_ABI } from '@/config/contracts';
import { useUserData } from '@/hooks/useUserData';
import { useVaultData } from '@/hooks/useVaultData';
import { toWei } from '@/lib/formatters';
import { u2uNebulasTestnet } from '@/config/wagmi';
import { toast } from 'sonner';
import { Loader2, ArrowUp } from 'lucide-react';

export function WithdrawForm() {
  const { address, chainId } = useAccount();
  const { token } = useVaultData();
  const { vaultBalance, tokenSymbol, refetch } = useUserData(token);
  const [amount, setAmount] = useState('');

  const { writeContractAsync: withdrawAsync, data: hash } = useWriteContract();

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success(
        <div>
          Withdrawal successful!{' '}
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
      const amountWei = toWei(amount);

      await withdrawAsync({
        address: validatedVault,
        abi: VAULT_ABI,
        functionName: 'withdraw' as const,
        args: [amountWei] as const,
        chain: u2uNebulasTestnet,
        account: address as `0x${string}`,
        gas: 3000000n, // Set gas limit to avoid estimation issues
      });
      toast.info('Withdrawal transaction submitted');
    } catch (error) {
      toast.error('Withdrawal failed');
      console.error(error);
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
        <Button
          onClick={handleWithdraw}
          disabled={isLoading || !amount || vaultBalance === 0n}
          className="w-full bg-gradient-accent hover:opacity-90"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Withdraw {tokenSymbol}
        </Button>
      </CardContent>
    </Card>
  );
}
