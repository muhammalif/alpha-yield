import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TokenAmountInput } from './TokenAmountInput';
import { VAULT_ADDRESS, VAULT_ABI, ERC20_ABI } from '@/config/contracts';
import { useUserData } from '@/hooks/useUserData';
import { useVaultData } from '@/hooks/useVaultData';
import { toWei } from '@/lib/formatters';
import { u2uNebulasTestnet } from '@/config/wagmi';
import { toast } from 'sonner';
import { Loader2, ArrowDown } from 'lucide-react';

export function DepositForm() {
  const { address } = useAccount();
  const { token } = useVaultData();
  const { tokenBalance, nativeBalance, tokenSymbol, allowance, refetch } = useUserData(token);
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState('token');

  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: deposit, data: depositHash } = useWriteContract();
  const { writeContract: depositNative, data: depositNativeHash } = useWriteContract();

  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isDepositing, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  const { isLoading: isDepositingNative, isSuccess: isDepositNativeSuccess } = useWaitForTransactionReceipt({
    hash: depositNativeHash,
  });

  useEffect(() => {
    if (isDepositSuccess || isDepositNativeSuccess) {
      toast.success('Deposit successful!');
      setAmount('');
      refetch();
    }
  }, [isDepositSuccess, isDepositNativeSuccess, refetch]);

  const needsApproval = () => {
    if (!amount || activeTab !== 'token') return false;
    const amountWei = toWei(amount);
    return allowance < amountWei;
  };

  const getValidatedVaultAddress = (): `0x${string}` | null => {
    const addr = VAULT_ADDRESS as string | undefined;
    if (!addr || typeof addr !== 'string') return null;
    const isHexAddress = /^0x[a-fA-F0-9]{40}$/.test(addr);
    return isHexAddress ? (addr as `0x${string}`) : null;
  };

  const handleApprove = async () => {
    try {
      const validatedVault = getValidatedVaultAddress();
      if (!validatedVault) {
        toast.error('Vault address is not configured. Set VITE_VAULT_ADDRESS in .env');
        return;
      }
      const amountWei = toWei(amount);
      await approve({
        address: token as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [validatedVault, amountWei],
        chainId: u2uNebulasTestnet.id,
      } as any);
      toast.info('Approval transaction submitted');
    } catch (error) {
      toast.error('Approval failed');
      console.error(error);
    }
  };

  const handleDeposit = async () => {
    if (!address || !amount) return;

    try {
      const validatedVault = getValidatedVaultAddress();
      if (!validatedVault) {
        toast.error('Vault address is not configured. Set VITE_VAULT_ADDRESS in .env');
        return;
      }
      const amountWei = toWei(amount);
      
      if (activeTab === 'native') {
        await depositNative({
          address: validatedVault,
          abi: VAULT_ABI,
          functionName: 'depositNative',
          value: amountWei,
          chainId: u2uNebulasTestnet.id,
        } as any);
      } else {
        await deposit({
          address: validatedVault,
          abi: VAULT_ABI,
          functionName: 'deposit',
          args: [amountWei],
          chainId: u2uNebulasTestnet.id,
        } as any);
      }
      toast.info('Deposit transaction submitted');
    } catch (error) {
      toast.error('Deposit failed');
      console.error(error);
    }
  };

  const isLoading = isApproving || isDepositing || isDepositingNative;

  return (
    <Card className="glass shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDown className="h-5 w-5 text-success" />
          Deposit
        </CardTitle>
        <CardDescription>
          Deposit assets to start earning AI-optimized yields
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="token">Token</TabsTrigger>
            <TabsTrigger value="native">Native U2U</TabsTrigger>
          </TabsList>
          
          <TabsContent value="token" className="space-y-4">
            <TokenAmountInput
              value={amount}
              onChange={setAmount}
              balance={tokenBalance}
              symbol={tokenSymbol}
              disabled={isLoading}
            />
            {needsApproval() ? (
              <Button
                onClick={handleApprove}
                disabled={isLoading || !amount}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Approve {tokenSymbol}
              </Button>
            ) : (
              <Button
                onClick={handleDeposit}
                disabled={isLoading || !amount}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {isDepositing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Deposit {tokenSymbol}
              </Button>
            )}
          </TabsContent>
          
          <TabsContent value="native" className="space-y-4">
            <TokenAmountInput
              value={amount}
              onChange={setAmount}
              balance={nativeBalance}
              symbol="U2U"
              disabled={isLoading}
            />
            <Button
              onClick={handleDeposit}
              disabled={isLoading || !amount}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {isDepositingNative && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deposit U2U
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
