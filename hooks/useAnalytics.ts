import { useMemo, useCallback, useRef, useEffect } from 'react';
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
import { TableRow } from 'components/markets/MarketsTables/poolTable';
import useActionButton from './useActionButton';

type ItemVariant = 'operation' | 'approve' | 'enterMarket' | 'exitMarket' | 'claimAll';
type TrackItem = { eventName: string; variant: ItemVariant };

export function useInitGA() {
  useEffect(() => {
    ReactGA.initialize('G-VV2LM2XCSD', { gtagOptions: { anonymizeIp: true, debug_mode: true, send_page_view: false } });
  }, []);
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
      chain_id: chain.id,
      symbol: assetSymbol || symbol,
      quantity: qty,
      item_id: `${marketAccount?.symbol}.${operation}`,
      item_name: `${marketAccount?.symbol} ${operation}`,
      price: formatFixed(marketAccount?.usdPrice ?? Zero, 18),
    }),
    [assetSymbol, chain.id, marketAccount?.symbol, marketAccount?.usdPrice, operation, qty, symbol],
  );

  return { appContext, itemContext };
}

export function usePageView(pathname: string, title: string) {
  const { appContext } = useAnalyticsContext();
  const onView = useRef(true);
  useEffect(() => {
    if (!onView.current) return;

    onView.current = false;

    void ReactGA.send({
      hitType: 'pageview',
      page: pathname,
      title,
      location: pathname,
      ...appContext,
    });
  }, [pathname, title, appContext]);
}

export default ({ symbol, rewards }: { symbol?: string; rewards?: Rewards } = {}) => {
  const { appContext, itemContext } = useAnalyticsContext(symbol);
  const { isDisable } = useActionButton();

  const track = useCallback(
    (eventName: string, payload: object) => {
      ReactGA.event(eventName, { ...appContext, ...payload });
    },
    [appContext],
  );

  const viewItemListAdvance = useCallback(
    (list: TableRow[], rateType: 'floating' | 'fixed') => {
      let items: (Omit<typeof itemContext, 'price' | 'quantity'> & { index: number; maturity?: number })[] = [];
      const { price, quantity, ...ctx } = itemContext;

      for (const item of list) {
        if (rateType === 'fixed') {
          items = [
            ...items,
            {
              index: items.length,
              ...ctx,
              item_id: `exa${item.symbol}.borrowAtMaturity`,
              item_name: `exa${item.symbol} borrowAtMaturity`,
              symbol: item.symbol,
              maturity: item.borrowMaturity,
            },
          ];

          if (!isDisable(rateType, item.depositAPR)) {
            items = [
              ...items,
              {
                index: items.length,
                ...ctx,
                item_id: `exa${item.symbol}.depositAtMaturity`,
                item_name: `exa${item.symbol} depositAtMaturity`,
                symbol: item.symbol,
                maturity: item.depositMaturity,
              },
            ];
          }

          continue;
        }

        items = [
          ...items,
          {
            index: items.length,
            ...ctx,
            item_id: `exa${item.symbol}.deposit`,
            item_name: `exa${item.symbol} deposit`,
            symbol: item.symbol,
          },
          {
            index: items.length + 1,
            ...ctx,
            item_id: `exa${item.symbol}.borrow`,
            item_name: `exa${item.symbol} borrow`,
            symbol: item.symbol,
          },
        ];
      }

      track('view_item_list', { items });
    },
    [itemContext, isDisable, track],
  );

  const viewItemList = useCallback(
    (list: MarketsBasicOption[]) => {
      track('view_item_list', {
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
    [track, itemContext],
  );

  const selectItem = useCallback(
    (maturity: number) => {
      track('select_item', {
        items: [
          {
            index: 0,
            ...itemContext,
            maturity,
          },
        ],
      });
    },
    [track, itemContext],
  );

  const trackItem = useCallback(
    ({ eventName, variant = 'operation' }: TrackItem) => {
      const items =
        variant === 'claimAll' && rewards
          ? Object.entries(rewards).map(([rewardSymbol, amount], index) => {
              const { price, ...ctx } = itemContext;
              return {
                index,
                ...ctx,
                item_id: `${rewardSymbol}.claimAll`,
                item_name: `${rewardSymbol} claimAll`,
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

      track(eventName, { items });
    },
    [track, itemContext, rewards],
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

  return useMemo(
    () => ({
      transaction: { addToCart, removeFromCart, beginCheckout, purchase },
      list: { selectItem, viewItemList, viewItemListAdvance },
    }),
    [addToCart, beginCheckout, purchase, removeFromCart, selectItem, viewItemList, viewItemListAdvance],
  );
};
