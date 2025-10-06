import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useControllerData } from '@/hooks/useControllerData';
import { formatPercentage } from '@/lib/formatters';
import { Brain, Activity } from 'lucide-react';

export function AIStatus() {
  const { targetSlippageBps, shouldHarvest } = useControllerData();

  const slippagePercent = Number(targetSlippageBps) / 100;

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
      </CardContent>
    </Card>
  );
}
