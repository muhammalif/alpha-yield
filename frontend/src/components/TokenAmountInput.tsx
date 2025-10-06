import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatBalance } from '@/lib/formatters';

interface TokenAmountInputProps {
  value: string;
  onChange: (value: string) => void;
  balance: bigint;
  symbol: string;
  disabled?: boolean;
}

export function TokenAmountInput({
  value,
  onChange,
  balance,
  symbol,
  disabled,
}: TokenAmountInputProps) {
  const handleMax = () => {
    const formatted = formatBalance(balance, 18, 18);
    onChange(formatted);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Amount</label>
        <span className="text-sm text-muted-foreground">
          Balance: {formatBalance(balance)} {symbol}
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.0"
          disabled={disabled}
          step="any"
          min="0"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleMax}
          disabled={disabled}
        >
          MAX
        </Button>
      </div>
    </div>
  );
}
