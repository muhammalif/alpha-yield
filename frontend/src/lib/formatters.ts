import { formatUnits, parseUnits } from 'viem';

export function formatBalance(balance: bigint, decimals = 18, maxDecimals = 4): string {
  const formatted = formatUnits(balance, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  
  return num.toLocaleString('en-US', {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: 0,
  });
}

export function formatCurrency(balance: bigint, decimals = 18): string {
  const formatted = formatUnits(balance, decimals);
  const num = parseFloat(formatted);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function toWei(amount: string, decimals = 18): bigint {
  try {
    return parseUnits(amount, decimals);
  } catch {
    return 0n;
  }
}

export function fromWei(amount: bigint, decimals = 18): string {
  return formatUnits(amount, decimals);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}
