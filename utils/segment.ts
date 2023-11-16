import { AnalyticsBrowser } from '@segment/analytics-next';
import { Address } from 'abitype';
import { Hash } from 'viem';

type TrackEvent =
  | {
      name: 'Button Clicked';
      properties: {
        name: string;
        location: string;
      };
    }
  | {
      name: 'Icon Clicked';
      properties: {
        icon: 'Close' | 'Edit' | 'Settings' | 'Copy' | 'Menu';
        name: string;
        location: string;
      };
    }
  | {
      name: 'Link Clicked';
      properties: {
        name: string;
        location: string;
        href: string;
      };
    }
  | {
      name: 'Page Viewed';
      properties: {
        name: string;
      };
    }
  | {
      name: 'Toggle Clicked';
      properties: {
        name: string;
        location: string;
        value: unknown;
      };
    }
  | {
      name: 'Option Selected';
      properties: {
        name: string;
        location: string;
        value: string;
        prevValue?: string;
      };
    }
  | {
      name: 'Wallet Connected';
      properties: {
        connectorName?: string;
        connectorId?: string;
      };
    }
  | {
      name: 'Wallet Signed TX';
      properties: {
        contractName: string;
        method: string;
      };
    }
  | {
      name: 'TX Completed';
      properties: {
        symbol: string;
        qty: string;
        status: 'success' | 'reverted';
        hash: Hash;
      };
    };

const analyticsApiKey = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY || '';

export function getAnalytics() {
  const analytics = AnalyticsBrowser.load({ writeKey: analyticsApiKey });
  return analytics;
}

export function track<Name extends TrackEvent['name']>(
  name: Name,
  properties: Extract<TrackEvent, { name: Name }>['properties'] &
    Record<string, string | number | undefined | null | boolean>,
): void {
  try {
    const analytics = getAnalytics();
    if (typeof analytics.track !== 'function') {
      return;
    }
    analytics.track(name, properties);
  } catch (error) {
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
