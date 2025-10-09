import { useReadContract } from 'wagmi';
import { VAULT_ADDRESS, VAULT_ABI, STRATEGY_ADDRESS, STRATEGY_ABI } from '@/config/contracts';

export function useVaultData(): { totalAssets: bigint; totalRewards: bigint; strategyBalance: bigint; token: string; refetch: () => void } {
  const { data: totalAssets, refetch: refetchTotalAssets } = useReadContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'totalAssets',
  });

  const { data: totalRewards, refetch: refetchTotalRewards } = useReadContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'totalRewards',
  });

  const { data: strategyBalance, refetch: refetchStrategyBalance } = useReadContract({
    address: STRATEGY_ADDRESS as `0x${string}`,
    abi: STRATEGY_ABI,
    functionName: 'getStrategyBalance',
  });

  const { data: token } = useReadContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'token',
  });

  const refetchAll = () => {
    refetchTotalAssets();
    refetchTotalRewards();
    refetchStrategyBalance();
  };

  return {
    totalAssets: totalAssets || 0n,
    totalRewards: totalRewards || 0n,
    strategyBalance: strategyBalance || 0n,
    token: token as string,
    refetch: refetchAll,
  };
}
