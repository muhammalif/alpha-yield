import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useControllerData } from '@/hooks/useControllerData';
import { STRATEGY_ADDRESS, STRATEGY_ABI } from '@/config/contracts';
import { formatPercentage } from '@/lib/formatters';
import { u2uNebulasTestnet } from '@/config/wagmi';
import { toast } from 'sonner';
import { Brain, Activity, Loader2 } from 'lucide-react';

export function AIStatus() {
  const { address } = useAccount();
  const { targetSlippageBps, shouldHarvest, strategist, owner } = useControllerData();
  const [isHarvesting, setIsHarvesting] = useState(false);

  const slippagePercent = Number(targetSlippageBps) / 100;

  const { writeContractAsync: harvestAsync } = useWriteContract();

  const handleHarvest = async () => {
    if (!address) return;
    setIsHarvesting(true);
    try {
      await harvestAsync({
        address: STRATEGY_ADDRESS as `0x${string}`,
        abi: STRATEGY_ABI,
        functionName: 'harvest',
        chain: u2uNebulasTestnet,
        gas: 3000000n, // Set gas limit
      });
      toast.success('Harvest initiated successfully!');
    } catch (error) {
      toast.error('Harvest failed');
      console.error(error);
    } finally {
      setIsHarvesting(false);
    }
  };

  return (
    <Card className="glass shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Controller Status
        </CardTitle>
        <CardDescription>
          Real-time AI strategy parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Target Slippage</span>
          </div>
          <span className="text-sm font-bold gradient-text">
            {formatPercentage(slippagePercent)}
          </span>
        </div>
        
        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Harvest Status</span>
          </div>
          <Badge variant={shouldHarvest ? "default" : "secondary"}>
            {shouldHarvest ? 'Active' : 'Standby'}
          </Badge>
        </div>

        {address?.toLowerCase() === strategist?.toLowerCase() && (
          <Button
            onClick={handleHarvest}
            disabled={isHarvesting}
            className="w-full bg-gradient-primary hover:opacity-90 mb-2"
          >
            {isHarvesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Manual Harvest
          </Button>
        )}

        {address?.toLowerCase() === owner?.toLowerCase() && address?.toLowerCase() !== strategist?.toLowerCase() && (
          <Button
            onClick={() => {/* TODO: set strategist */}}
            className="w-full bg-gradient-secondary hover:opacity-90"
          >
            Set as Strategist
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
