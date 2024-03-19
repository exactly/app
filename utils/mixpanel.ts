import mixpanel from 'mixpanel-browser';

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
    icon?: 'Close' | 'Edit' | 'Settings' | 'Copy' | 'Menu' | 'Replay' | 'ArrowBack';
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
  'Input Unfocused': {
    name: string;
    location: string;
    value: Stringifiable;
  };
  'Wallet Connected': {
    connectorName?: string;
    connectorId?: string;
  };
  'TX Signed': {
    contractName: string;
    method: string;
    hash: Hash;
    amount?: string;
    usdAmount?: string;
  };
  'TX Completed': {
    contractName?: string;
    method?: string;
    status: TransactionReceipt['status'];
    hash: Hash;
    amount?: string;
    usdAmount?: string;
  };
};

type Global = {
  impersonateActive: boolean;
  symbol: string;
  maturity: number;
  operation: string;
};
type Component = {
  text: string;
  value: Stringifiable;
  prevValue: Stringifiable;
  bestOption: Stringifiable;
  isBestOption: boolean;
  isNew: boolean;
};
type TX = {
  status: TransactionReceipt['status'] | Transaction['status'];
  to: Address;
  chainId: number;
  spender: Address;
  amount: string;
  usdAmount: string;
};

if (process.env.NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN) {
  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN, {
    debug: true,
    track_pageview: true,
    persistence: 'localStorage',
    api_host: '/api/a-api',
    ignore_dnt: true,
  });
}

export function track<Name extends keyof TrackEvent>(
  name: Name,
  properties: TrackEvent[Name] & Partial<Global & Component & TX>,
): void {
  if (process.env.NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN) mixpanel.track(name, properties);
}

export function page() {
  if (process.env.NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN) mixpanel.track_pageview();
}

export function identify(address: Address) {
  if (process.env.NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN) mixpanel.identify(address);
}
