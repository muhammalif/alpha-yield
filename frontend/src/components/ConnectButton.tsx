import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { u2uSolarisMainnet } from '@/config/wagmi';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { shortenAddress } from '@/lib/formatters';

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (isConnected && chainId !== u2uSolarisMainnet.id) {
      try {
        switchChain({ chainId: u2uSolarisMainnet.id });
      } catch {
        // If switch fails, the network might not be added
        alert('Please add the U2U Solaris Mainnet to MetaMask manually.');
      }
    }
  }, [isConnected, chainId, switchChain]);

  if (isConnected && address) {
    return (
      <Button
        onClick={() => disconnect()}
        variant="outline"
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        {shortenAddress(address)}
        <LogOut className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      onClick={() => connect({ connector: injected() })}
      className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
