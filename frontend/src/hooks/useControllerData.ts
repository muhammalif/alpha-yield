import { useReadContract } from 'wagmi';
import { CONTROLLER_ADDRESS, CONTROLLER_ABI } from '@/config/contracts';

export function useControllerData() {
  const { data: targetSlippageBps } = useReadContract({
    address: CONTROLLER_ADDRESS as `0x${string}`,
    abi: CONTROLLER_ABI,
    functionName: 'targetSlippageBps',
  });

  const { data: shouldHarvest } = useReadContract({
    address: CONTROLLER_ADDRESS as `0x${string}`,
    abi: CONTROLLER_ABI,
    functionName: 'shouldHarvest',
  });

  const { data: strategist } = useReadContract({
    address: CONTROLLER_ADDRESS as `0x${string}`,
    abi: CONTROLLER_ABI,
    functionName: 'strategist',
  });

  const { data: owner } = useReadContract({
    address: CONTROLLER_ADDRESS as `0x${string}`,
    abi: CONTROLLER_ABI,
    functionName: 'owner',
  });

  return {
    targetSlippageBps: targetSlippageBps || 0n,
    shouldHarvest: shouldHarvest || false,
    strategist: strategist as string,
    owner: owner as string,
  };
}
