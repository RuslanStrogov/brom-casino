import { TonConnectUI, type Wallet } from '@tonconnect/ui-react';

const TON_MANIFEST_URL = import.meta.env.VITE_TON_MANIFEST_URL || '';

export interface TonConnectState {
  connected: boolean;
  wallet: Wallet | null;
  address: string | null;
  balance: string | null;
  network: 'mainnet' | 'testnet';
}

export function useTonConnect() {
  // This is a wrapper hook that provides TON Connect utilities
  // The actual connection state comes from TonConnectUIProvider context
  // Use useTonConnectUI() from @tonconnect/ui-react in components

  const getTonConnectUI = (): TonConnectUI | null => {
    try {
      const { useTonConnectUI } = require('@tonconnect/ui-react');
      const [tonConnectUI] = useTonConnectUI();
      return tonConnectUI;
    } catch {
      return null;
    }
  };

  const sendTransaction = async (transaction: {
    validUntil: number;
    messages: Array<{
      address: string;
      amount: string;
      payload?: string;
      stateInit?: string;
    }>;
  }) => {
    const tonConnectUI = getTonConnectUI();
    if (!tonConnectUI) {
      throw new Error('TON Connect not initialized');
    }

    const result = await tonConnectUI.sendTransaction(transaction);
    return result;
  };

  const disconnect = async () => {
    const tonConnectUI = getTonConnectUI();
    if (tonConnectUI) {
      await tonConnectUI.disconnect();
    }
  };

  const formatAddress = (address: string): string => {
    if (!address) return '';
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const nanoTonToTon = (nanoTon: string | number): number => {
    return Number(nanoTon) / 1e9;
  };

  const tonToNanoTon = (ton: number): string => {
    return Math.floor(ton * 1e9).toString();
  };

  return {
    manifestUrl: TON_MANIFEST_URL,
    sendTransaction,
    disconnect,
    formatAddress,
    nanoTonToTon,
    tonToNanoTon,
  };
}

// TON Connect configuration
export const tonConnectConfig = {
  manifestUrl: TON_MANIFEST_URL,
  actionsConfiguration: {
    twaReturnUrl: `https://t.me/${import.meta.env.VITE_BOT_USERNAME || 'brom_casino_bot'}/start`,
  },
};

// TON blockchain helpers
export const ton = {
  // Validate TON address
  isValidAddress: (address: string): boolean => {
    const bounceableRegex = /^[A-Za-z0-9_-]{48}$/;
    const rawRegex = /^0:[a-fA-F0-9]{64}$/;
    const userFriendlyRegex = /^[EU]Q[A-Za-z0-9_-]{46}$/;
    return bounceableRegex.test(address) || rawRegex.test(address) || userFriendlyRegex.test(address);
  },

  // Convert to user-friendly address
  toUserFriendly: (address: string, testnet: boolean = false): string => {
    try {
      // This would use ton-core in production
      // For now, return as-is if already user-friendly
      if (address.startsWith('EQ') || address.startsWith('UQ')) {
        return address;
      }
      return address;
    } catch {
      return address;
    }
  },

  // Format balance for display
  formatBalance: (balance: string | number | null, decimals: number = 4): string => {
    if (balance === null || balance === undefined) return '0.0000';
    const ton = typeof balance === 'string' ? parseFloat(balance) : balance;
    const converted = ton > 1e6 ? ton / 1e9 : ton; // Assume nanoTON if very large
    return converted.toFixed(decimals);
  },

  // Calculate gas estimate
  estimateGas: (messageCount: number = 1): number => {
    // Approximate gas per message in TON
    const baseGas = 0.01;
    const perMessageGas = 0.005;
    return baseGas + perMessageGas * messageCount;
  },
};

export default ton;
