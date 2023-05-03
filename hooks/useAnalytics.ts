import { useMemo, useCallback, useRef, useEffect } from 'react';
import ReactGA from 'react-ga4';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { formatFixed } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';

import { useOperationContext } from 'contexts/OperationContext';
import { useWeb3 } from './useWeb3';
import { useMarketContext } from 'contexts/MarketContext';
import { useMarketsBasic } from 'contexts/MarketsBasicContext';
import { useCustomTheme } from 'contexts/ThemeContext';
import useAccountData from './useAccountData';
import { useModalStatus } from 'contexts/ModalStatusContext';

function useAnalyticsContext() {
  const { i18n } = useTranslation();
  const lng = i18n.language.substring(0, 2);

  const { address } = useAccount();
  const { chain, walletAddress, impersonateActive } = useWeb3();
  const { symbol, qty } = useOperationContext();
  const { operation } = useModalStatus();
  const { date, view } = useMarketContext();

  const { marketAccount } = useAccountData(symbol);

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
      symbol,
      quantity: qty,
      item_id: `${marketAccount?.symbol}.${operation}`,
      item_name: `${marketAccount?.symbol} ${operation}`,
      price: formatFixed(marketAccount?.usdPrice ?? Zero, 18),
      ...(date && operation.includes('AtMaturity') ? { maturity: date } : {}),
    }),
    [chain.id, date, marketAccount?.symbol, marketAccount?.usdPrice, operation, qty, symbol],
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

export default () => {
  const { appContext, itemContext } = useAnalyticsContext();

  const track = useCallback(
    (eventName: string, payload: object) => {
      ReactGA.event(eventName, { ...appContext, ...payload });
    },
    [appContext],
  );

  // const viewItemList = useCallback(() => {}, []);
  // const selectItem = useCallback(() => {}, []);

  const addToCart = useCallback(() => {
    track('add_to_cart', { ...appContext, items: [{ ...itemContext }] });
  }, [track, itemContext, appContext]);

  const beginCheckout = useCallback(() => {
    track('begin_checkout', { ...appContext, items: [{ ...itemContext }] });
  }, [track, itemContext, appContext]);

  const purchase = useCallback(() => {
    track('purchase', { ...appContext, items: [{ ...itemContext }] });
  }, [track, itemContext, appContext]);

  const removeFromCart = useCallback(() => {
    track('remove_from_cart', { ...appContext, items: [{ ...itemContext }] });
  }, [track, itemContext, appContext]);

  return {
    transaction: { addToCart, removeFromCart, beginCheckout, purchase },
  };
};
