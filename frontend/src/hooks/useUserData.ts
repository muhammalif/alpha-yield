import { useAccount, useReadContract, useBalance } from 'wagmi';
import { VAULT_ADDRESS, VAULT_ABI, ERC20_ABI } from '@/config/contracts';

export function useUserData(tokenAddress?: string): { vaultBalance: bigint; claimedRewards: bigint; nativeBalance: bigint; tokenBalance: bigint; tokenSymbol: string; allowance: bigint; refetch: () => void } {
  const { address } = useAccount();

  const { data: vaultBalance, refetch: refetchVaultBalance } = useReadContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'balances',
    args: address ? [address] : undefined,
  });

  const { data: claimedRewards, refetch: refetchClaimedRewards } = useReadContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'claimedRewards',
    args: address ? [address] : undefined,
  });

  const { data: nativeBalance } = useBalance({
    address,
  });

  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol',
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, VAULT_ADDRESS as `0x${string}`] : undefined,
  });

  const refetchAll = () => {
    refetchVaultBalance();
    refetchClaimedRewards();
    refetchTokenBalance();
    refetchAllowance();
  };

  return {
    vaultBalance: vaultBalance || 0n,
    claimedRewards: claimedRewards || 0n,
    nativeBalance: nativeBalance?.value || 0n,
    tokenBalance: tokenBalance || 0n,
    tokenSymbol: (tokenSymbol as string) || 'TOKEN',
    allowance: allowance || 0n,
    refetch: refetchAll,
  };
}
