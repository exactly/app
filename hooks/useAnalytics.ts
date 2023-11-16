import { useMemo, useCallback, useEffect } from 'react';
import ReactGA from 'react-ga4';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { isRolloverInput, type RolloverInput } from 'contexts/DebtManagerContext';
import { useWeb3 } from './useWeb3';
import { useCustomTheme } from 'contexts/ThemeContext';
import useAccountData from './useAccountData';
import { MarketsBasicOption } from 'contexts/MarketsBasicContext';
import { type Rewards } from './useRewards';
import useActionButton from './useActionButton';
import useDelayedEffect from './useDelayedEffect';
import useSnapshot from './useSnapshot';
import { formatUnits } from 'viem';
import { isBridgeInput } from 'components/BridgeContent/utils';
import { BridgeInput } from 'types/Bridge';
import { Operation } from 'types/Operation';
import { VestInput } from 'types/Vest';
import { isVestInput } from 'components/vesting/utils';
import { useRouter } from 'next/router';
import { page } from '../utils/segment';

type ItemVariant =
  | 'operation'
  | 'approve'
  | 'enterMarket'
  | 'exitMarket'
  | 'claimAll'
  | 'claim'
  | 'roll'
  | 'bridge'
  | 'vest'
  | 'getEXA';
type TrackItem = { eventName: string; variant: ItemVariant };
type OperationInput = { operation: Operation; symbol: string; qty: string };

type Row = {
  symbol: string;
  depositAPR?: number;
  depositMaturity?: bigint;
  borrowMaturity?: bigint;
  maturity?: bigint;
};

function wrap(str: string | undefined) {
  if (str === undefined) {
    return str;
  }
  return `'${str}'`;
}

export function useInitGA() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;
    if (!key) {
      return;
    }

    ReactGA.initialize(key, {
      gtagOptions: { anonymizeIp: true, debug_mode: true, send_page_view: false },
    });
  }, []);
}

function track(eventName: string, payload: object) {
  ReactGA.event(eventName, { ...payload });
}

function useAnalyticsContext(assetSymbol?: string) {
  const { i18n } = useTranslation();
  const lng = i18n.language.substring(0, 2);

  const { address } = useAccount();
  const { chain, walletAddress, impersonateActive } = useWeb3();
  const { theme, view } = useCustomTheme();

  const { marketAccount } = useAccountData(assetSymbol ?? 'USDC');

  const appContext = useMemo(
    () => ({
      network: chain.network,
      ui_language: lng,
      account: wrap(address),
      view_mode: view,
      theme,
      ...(impersonateActive ? { impersonate_account: wrap(walletAddress) } : {}),
    }),
    [address, chain.network, impersonateActive, lng, theme, view, walletAddress],
  );

  const itemContext = useCallback(
    ({ symbol, operation, qty }: OperationInput) => ({
      symbol: assetSymbol || symbol,
      quantity: qty,
      item_id: `${marketAccount?.symbol}.${operation}`,
      item_name: `${marketAccount?.symbol} ${operation}`,
      price: Number(formatUnits(marketAccount?.usdPrice ?? 0n, 18)),
    }),
    [assetSymbol, marketAccount?.symbol, marketAccount?.usdPrice],
  );

  const rolloverContext = useCallback((input: RolloverInput) => {
    const op =
      input.from?.maturity && input.to?.maturity
        ? 'rollFixed'
        : input.from?.maturity
        ? 'rollFixedToFloating'
        : 'rollFloatingToFixed';
    return {
      symbol: input.from?.symbol || input.to?.symbol,
      quantity: input.percent,
      item_id: `DebtManager.${op}`,
      item_name: `DebtManager ${op}`,
    };
  }, []);

  const bridgeContext = useCallback((input: BridgeInput) => {
    const isBridge = input.sourceChainId !== input.destinationChainId;
    const isSwap = input.sourceToken !== input.destinationToken;

    const operationLabel = isBridge ? (isSwap ? 'bridgeSwap' : 'bridge') : 'swap';

    return {
      item_id: operationLabel,
      item_name: operationLabel,
      symbol: input.destinationToken,
      quantity: input.destinationToken,
      ...input,
    };
  }, []);

  const getEXAContext = useCallback((input: BridgeInput) => {
    const operationLabel = 'getEXA';
    return {
      item_id: operationLabel,
      item_name: operationLabel,
      symbol: input.destinationToken,
      quantity: input.destinationToken,
      ...input,
    };
  }, []);

  const vestContext = useCallback((input: VestInput) => {
    const operationLabel = 'vest';

    return {
      item_id: operationLabel,
      item_name: operationLabel,
      symbol: input.destinationToken,
      quantity: input.destinationToken,
      ...input,
    };
  }, []);

  return {
    appContext: useSnapshot(appContext),
    itemContext,
    rolloverContext,
    bridgeContext,
    vestContext,
    getEXAContext,
  };
}

export function usePageView(pathname: string, title: string) {
  const { appContext } = useAnalyticsContext();
  const pageView = useCallback(() => {
    void ReactGA.send({
      hitType: 'pageview',
      page: pathname,
      title,
      location: pathname,
      ...appContext.current,
    });
  }, [appContext, pathname, title]);

  useDelayedEffect({ effect: pageView });
}

export default function useAnalytics({
  symbol,
  rewards,
  operationInput,
}: { symbol?: string; rewards?: Rewards; operationInput?: OperationInput } = {}) {
  const { appContext, itemContext, rolloverContext, bridgeContext, vestContext, getEXAContext } =
    useAnalyticsContext(symbol);
  const { isDisable } = useActionButton();

  const trackWithContext = useCallback(
    (eventName: string, payload: object) => track(eventName, { ...appContext.current, ...payload }),
    [appContext],
  );

  const viewItemListAdvance = useCallback(
    (list: Row[], rateType: 'floating' | 'fixed') => {
      const items = list
        .map(({ maturity, borrowMaturity, depositMaturity, ...rest }) => ({
          maturity: Number(maturity || borrowMaturity || depositMaturity),
          ...rest,
        }))
        .flatMap((item) => [
          {
            item_id: `exa${item.symbol}.deposit${rateType === 'fixed' ? 'AtMaturity' : ''}`,
            item_name: `exa${item.symbol} deposit${rateType === 'fixed' ? 'AtMaturity' : ''}`,
            symbol: item.symbol,
            ...(item.maturity ? { maturity: Number(item.maturity) } : {}),
          },
          ...(rateType !== 'fixed' || !isDisable(rateType, item.depositAPR)
            ? [
                {
                  item_id: `exa${item.symbol}.borrow${rateType === 'fixed' ? 'AtMaturity' : ''}`,
                  item_name: `exa${item.symbol} borrow${rateType === 'fixed' ? 'AtMaturity' : ''}`,
                  symbol: item.symbol,
                  ...(item.maturity ? { maturity: Number(item.maturity) } : {}),
                },
              ]
            : []),
        ])
        .map((item, index) => ({ ...item, index }));

      trackWithContext('view_item_list', { items });
    },
    [isDisable, trackWithContext],
  );

  const viewItemListDashboard = useCallback(
    (list: Row[], rateType: 'floating' | 'fixed', tab: 'deposit' | 'borrow') => {
      const items = list
        .map(({ maturity, borrowMaturity, depositMaturity, ...rest }) => ({
          maturity: Number(maturity || borrowMaturity || depositMaturity),
          ...rest,
        }))
        .flatMap((item) => {
          if (rateType === 'floating') {
            const op1 = tab === 'deposit' ? 'deposit' : 'borrow';
            const op2 = tab === 'deposit' ? 'withdraw' : 'repay';
            return [
              {
                item_id: `exa${item.symbol}.${op1}`,
                item_name: `exa${item.symbol} ${op1}`,
                symbol: item.symbol,
              },
              {
                item_id: `exa${item.symbol}.${op2}`,
                item_name: `exa${item.symbol} ${op2}`,
                symbol: item.symbol,
              },
            ];
          } else {
            const op = tab === 'deposit' ? 'withdrawAtMaturity' : 'repayAtMaturity';
            return [
              {
                item_id: `exa${item.symbol}.${op}`,
                item_name: `exa${item.symbol} ${op}`,
                symbol: item.symbol,
                maturity: Number(item.maturity),
              },
            ];
          }
        });

      trackWithContext('view_item_list', { items });
    },
    [trackWithContext],
  );

  const viewItemList = useCallback(
    (list: MarketsBasicOption[]) => {
      trackWithContext('view_item_list', {
        items: list.flatMap((item, index) => {
          if (!operationInput) return [];
          const [market, ctxOperation] = itemContext(operationInput).item_id.split('.');
          const baseOperation = ctxOperation.replace('AtMaturity', '');
          const operation = item.maturity ? `${baseOperation}AtMaturity` : baseOperation;
          return [
            {
              ...itemContext,
              index,
              item_id: `${market}.${operation}`,
              item_name: `${market} ${operation}`,
              maturity: Number(item.maturity),
            },
          ];
        }),
      });
    },
    [trackWithContext, itemContext, operationInput],
  );

  const selectItem = useCallback(
    (maturity: bigint) => {
      trackWithContext('select_item', {
        items: [
          {
            index: 0,
            ...itemContext,
            maturity: Number(maturity),
          },
        ],
      });
    },
    [trackWithContext, itemContext],
  );

  const viewItem = useCallback(
    (maturity: bigint) => {
      trackWithContext('view_item', {
        items: [
          {
            index: 0,
            ...itemContext,
            ...(operationInput && itemContext(operationInput).item_id.includes('AtMaturity')
              ? { maturity: Number(maturity) }
              : {}),
          },
        ],
      });
    },
    [trackWithContext, itemContext, operationInput],
  );

  const trackItem = useCallback(
    ({ eventName, variant = 'operation' }: TrackItem) => {
      const items =
        variant === 'claimAll' && rewards
          ? Object.entries(rewards).map(([rewardSymbol, { amount }], index) => {
              return {
                index,
                item_id: `RewardsController.claimAll`,
                item_name: `RewardsController claimAll`,
                quantity: formatUnits(amount, 18),
                symbol: rewardSymbol,
              };
            })
          : [
              {
                index: 0,
                ...itemContext,
                ...(variant === 'operation'
                  ? {}
                  : {
                      item_id: `${symbol}.${variant}`,
                      item_name: `${symbol} ${variant}`,
                    }),
              },
            ];

      trackWithContext(eventName, { items });
    },
    [rewards, itemContext, symbol, trackWithContext],
  );

  const trackRollover = useCallback(
    (eventName: string, input: RolloverInput) => trackWithContext(eventName, { items: [rolloverContext(input)] }),
    [trackWithContext, rolloverContext],
  );

  const trackBridge = useCallback(
    (eventName: string, input: BridgeInput) => trackWithContext(eventName, { items: [bridgeContext(input)] }),
    [bridgeContext, trackWithContext],
  );
  const trackVest = useCallback(
    (eventName: string, input: VestInput) => trackWithContext(eventName, { items: [vestContext(input)] }),
    [trackWithContext, vestContext],
  );
  const trackGetEXA = useCallback(
    (eventName: string, input: BridgeInput) => trackWithContext(eventName, { items: [getEXAContext(input)] }),
    [trackWithContext, getEXAContext],
  );

  const buildTransactionTrack = useCallback(
    (variant: ItemVariant = 'operation', eventName: string, input?: object) => {
      switch (variant) {
        case 'roll': {
          if (isRolloverInput(input)) {
            trackRollover(eventName, input);
          }
          break;
        }
        case 'bridge': {
          if (isBridgeInput(input)) {
            trackBridge(eventName, input);
          }
          break;
        }
        case 'vest': {
          if (isVestInput(input)) {
            trackVest(eventName, input);
          }
          break;
        }
        case 'getEXA': {
          if (isBridgeInput(input)) {
            trackGetEXA(eventName, input);
          }
          break;
        }
        default: {
          trackItem({ eventName, variant });
        }
      }
    },
    [trackBridge, trackGetEXA, trackItem, trackRollover, trackVest],
  );

  const addToCart = useCallback(
    (variant: ItemVariant = 'operation', input?: object) => buildTransactionTrack(variant, 'add_to_cart', input),
    [buildTransactionTrack],
  );

  const beginCheckout = useCallback(
    (variant: ItemVariant = 'operation', input?: object) => buildTransactionTrack(variant, 'begin_checkout', input),
    [buildTransactionTrack],
  );

  const purchase = useCallback(
    (variant: ItemVariant = 'operation', input?: object) => buildTransactionTrack(variant, 'purchase', input),
    [buildTransactionTrack],
  );

  const removeFromCart = useCallback(
    (variant: ItemVariant = 'operation', input?: object) => buildTransactionTrack(variant, 'remove_from_cart', input),
    [buildTransactionTrack],
  );

  return {
    transaction: { addToCart, removeFromCart, beginCheckout, purchase },
    list: { viewItem, selectItem, viewItemList, viewItemListAdvance, viewItemListDashboard },
  };
}

export function usePageTracking() {
  const router = useRouter();
  useEffect(() => {
    router.events.on('routeChangeComplete', page);
    return () => router.events.off('routeChangeComplete', page);
  }, [router.events]);
}
