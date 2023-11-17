import { AnalyticsBrowser } from '@segment/analytics-next';
import { Address } from 'abitype';
import { Hash, TransactionReceipt } from 'viem';
import { Transaction } from '../types/Transaction';

type Stringifiable = string | number | null | boolean;

type TrackEvent = {
  'Page Viewed': {
    name: string;
  };
  'Button Clicked': {
    name: string;
    location: string;
    icon?: 'Close' | 'Edit' | 'Settings' | 'Copy' | 'Menu';
    href?: string;
  };
  'Option Selected': {
    name: string;
    location: string;
    value: Stringifiable;
    prevValue: Stringifiable | undefined;
  };
  'Modal Closed': {
    name: string;
    location?: string;
  };
  'Wallet Connected': {
    connectorName?: string;
    connectorId?: string;
  };
  'TX Signed': {
    contractName: string;
    method: string;
    hash: Hash;
  };
  'TX Completed': {
    status: TransactionReceipt['status'];
    hash: Hash;
  };
};

type ExtraContext = {
  symbol: string;
  maturity: number;
  text: string;
  value: Stringifiable;
  prevValue: Stringifiable;
  operation: string;
  bestOption: Stringifiable;
  isBestOption: boolean;
  status: TransactionReceipt['status'] | Transaction['status'];
  to: Address;
  chainId: number;
  impersonateActive: boolean;
  spender: Address;
  qty: string | number;
};

const analyticsApiKey = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY || '';

export function getAnalytics() {
  const analytics = AnalyticsBrowser.load({ writeKey: analyticsApiKey });
  return analytics;
}

export function track<Name extends keyof TrackEvent>(
  name: Name,
  properties: TrackEvent[Name] & Partial<ExtraContext>,
): void {
  try {
    const analytics = getAnalytics();
    if (typeof analytics.track !== 'function') {
      return;
    }
    analytics.track(name, properties);
  } catch {
    // probably, analytics not enabled, or other issue sending the report
  }
}

export function page() {
  try {
    const analytics = getAnalytics();
    if (typeof analytics.page !== 'function') {
      return;
    }
    analytics.page();
  } catch {
    //
  }
}

export function identify(address: Address) {
  try {
    const analytics = getAnalytics();
    if (typeof analytics.identify !== 'function') {
      return;
    }
    analytics.identify(address);
  } catch {
    //
  }
}
