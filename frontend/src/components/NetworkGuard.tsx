import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { u2uSolarisMainnet } from '@/config/wagmi';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    return <>{children}</>;
  }

  if (chainId !== u2uSolarisMainnet.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md glass">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="mt-2">
            <p className="mb-4">
              Please switch to U2U Solaris Mainnet to use this application.
            </p>
            <Button
              onClick={() => switchChain({ chainId: u2uSolarisMainnet.id })}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              Switch Network
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
