import { useMemo, useCallback, useEffect } from 'react';
import ReactGA from 'react-ga4';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { formatFixed } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';

import { useOperationContext } from 'contexts/OperationContext';
import { useWeb3 } from './useWeb3';
import { useMarketContext } from 'contexts/MarketContext';
import { useCustomTheme } from 'contexts/ThemeContext';
import useAccountData from './useAccountData';
import { useModalStatus } from 'contexts/ModalStatusContext';
import { MarketsBasicOption } from 'contexts/MarketsBasicContext';
import { type Rewards } from './useRewards';
import useActionButton from './useActionButton';
import useDelayedEffect from './useDelayedEffect';
import useSnapshot from './useSnapshot';

type ItemVariant = 'operation' | 'approve' | 'enterMarket' | 'exitMarket' | 'claimAll';
type TrackItem = { eventName: string; variant: ItemVariant };

type Row = {
  symbol: string;
  depositAPR?: number;
  depositMaturity?: number;
  borrowMaturity?: number;
  maturity?: number;
};

export function useInitGA() {
  useEffect(() => {
    ReactGA.initialize('G-VV2LM2XCSD', { gtagOptions: { anonymizeIp: true, debug_mode: true, send_page_view: false } });
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
  const { symbol, qty } = useOperationContext();
  const { operation } = useModalStatus();
  const { view } = useMarketContext();

  const { marketAccount } = useAccountData(assetSymbol || symbol);

  const { theme } = useCustomTheme();

  const appContext = useMemo(
    () => ({
      chain_id: chain.id,
      ui_language: lng,
      account: address,
      view_mode: view,
      theme,
      ...(impersonateActive ? { impersonate_account: walletAddress } : {}),
    }),
    [address, chain.id, impersonateActive, lng, theme, view, walletAddress],
  );

  const itemContext = useMemo(
    () => ({
      symbol: assetSymbol || symbol,
      quantity: qty,
      item_id: `${marketAccount?.symbol}.${operation}`,
      item_name: `${marketAccount?.symbol} ${operation}`,
      price: formatFixed(marketAccount?.usdPrice ?? Zero, 18),
    }),
    [assetSymbol, marketAccount?.symbol, marketAccount?.usdPrice, operation, qty, symbol],
  );

  return { appContext: useSnapshot(appContext), itemContext };
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

export default function useAnalytics({ symbol, rewards }: { symbol?: string; rewards?: Rewards } = {}) {
  const { appContext, itemContext } = useAnalyticsContext(symbol);
  const { isDisable } = useActionButton();

  const trackWithContext = useCallback(
    (eventName: string, payload: object) => track(eventName, { ...appContext.current, ...payload }),
    [appContext],
  );

  const viewItemListAdvance = useCallback(
    (list: Row[], rateType: 'floating' | 'fixed') => {
      const items = list
        .map(({ maturity, borrowMaturity, depositMaturity, ...rest }) => ({
          maturity: maturity || borrowMaturity || depositMaturity,
          ...rest,
        }))
        .flatMap((item) => [
          {
            item_id: `exa${item.symbol}.deposit${rateType === 'fixed' ? 'AtMaturity' : ''}`,
            item_name: `exa${item.symbol} deposit${rateType === 'fixed' ? 'AtMaturity' : ''}`,
            symbol: item.symbol,
            ...(item.maturity ? { maturity: item.maturity } : {}),
          },
          ...(rateType !== 'fixed' || !isDisable(rateType, item.depositAPR)
            ? [
                {
                  item_id: `exa${item.symbol}.borrow${rateType === 'fixed' ? 'AtMaturity' : ''}`,
                  item_name: `exa${item.symbol} borrow${rateType === 'fixed' ? 'AtMaturity' : ''}`,
                  symbol: item.symbol,
                  ...(item.maturity ? { maturity: item.maturity } : {}),
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
          maturity: maturity || borrowMaturity || depositMaturity,
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
                maturity: item.maturity,
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
        items: list.map((item, index) => {
          const [market, ctxOperation] = itemContext.item_id.split('.');
          const baseOperation = ctxOperation.replace('AtMaturity', '');
          const operation = item.maturity ? `${baseOperation}AtMaturity` : baseOperation;
          return {
            ...itemContext,
            index,
            item_id: `${market}.${operation}`,
            item_name: `${market} ${operation}`,
            maturity: item.maturity,
          };
        }),
      });
    },
    [trackWithContext, itemContext],
  );

  const selectItem = useCallback(
    (maturity: number) => {
      trackWithContext('select_item', {
        items: [
          {
            index: 0,
            ...itemContext,
            maturity,
          },
        ],
      });
    },
    [trackWithContext, itemContext],
  );

  const viewItem = useCallback(
    (maturity: number) => {
      trackWithContext('view_item', {
        items: [
          {
            index: 0,
            ...itemContext,
            ...(itemContext.item_id.includes('AtMaturity') ? { maturity } : {}),
          },
        ],
      });
    },
    [trackWithContext, itemContext],
  );

  const trackItem = useCallback(
    ({ eventName, variant = 'operation' }: TrackItem) => {
      const items =
        variant === 'claimAll' && rewards
          ? Object.entries(rewards).map(([rewardSymbol, amount], index) => {
              return {
                index,
                item_id: `RewardsController.claimAll`,
                item_name: `RewardsController claimAll`,
                quantity: formatFixed(amount, 18),
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
                      item_id: `${itemContext.item_id.split('.')[0]}.${variant}`,
                      item_name: `${itemContext.item_id.split('.')[0]} ${variant}`,
                    }),
              },
            ];

      trackWithContext(eventName, { items });
    },
    [trackWithContext, itemContext, rewards],
  );

  const addToCart = useCallback(
    (variant: ItemVariant = 'operation') => trackItem({ eventName: 'add_to_cart', variant }),
    [trackItem],
  );

  const beginCheckout = useCallback(
    (variant: ItemVariant = 'operation') => trackItem({ eventName: 'begin_checkout', variant }),
    [trackItem],
  );

  const purchase = useCallback(
    (variant: ItemVariant = 'operation') => trackItem({ eventName: 'purchase', variant }),
    [trackItem],
  );

  const removeFromCart = useCallback(
    (variant: ItemVariant = 'operation') => trackItem({ eventName: 'remove_from_cart', variant }),
    [trackItem],
  );

  return {
    transaction: { addToCart, removeFromCart, beginCheckout, purchase },
    list: { viewItem, selectItem, viewItemList, viewItemListAdvance, viewItemListDashboard },
  };
}
