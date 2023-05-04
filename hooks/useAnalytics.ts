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

type ItemVariant = 'operation' | 'approve' | 'enterMarket' | 'exitMarket';

function useAnalyticsContext(assetSymbol?: string) {
  const { i18n } = useTranslation();
  const lng = i18n.language.substring(0, 2);

  const { address } = useAccount();
  const { chain, walletAddress, impersonateActive } = useWeb3();
  const { symbol, qty } = useOperationContext();
  const { operation } = useModalStatus();
  const { date, view } = useMarketContext();

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
      ...(date && operation.includes('AtMaturity') ? { maturity: date } : {}),
    }),
    [assetSymbol, chain.id, date, marketAccount?.symbol, marketAccount?.usdPrice, operation, qty, symbol],
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

export function useInitGA() {
  useEffect(() => {
    ReactGA.initialize('G-VV2LM2XCSD', { gtagOptions: { anonymizeIp: true, debug_mode: true, send_page_view: false } });
  }, []);
}

export default (symbol?: string) => {
  const { appContext, itemContext } = useAnalyticsContext(symbol);

  const track = useCallback(
    (eventName: string, payload: object) => {
      ReactGA.event(eventName, { ...appContext, ...payload });
    },
    [appContext],
  );

  // const viewItemList = useCallback(() => {}, []);
  // const selectItem = useCallback(() => {}, []);

  const trackItem = useCallback(
    ({ eventName, variant = 'operation' }: { eventName: string; variant: ItemVariant }) => {
      track(eventName, {
        items: [
          {
            ...itemContext,
            ...(variant === 'operation'
              ? {}
              : {
                  item_id: `${itemContext.item_id.split('.')[0]}.${variant}`,
                  item_name: `${itemContext.item_id.split('.')[0]} ${variant}`,
                }),
          },
        ],
      });
    },
    [track, itemContext],
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
  };
};
