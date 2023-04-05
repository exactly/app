import '../styles/globals.css';
import '../styles/variables.css';

import React, { type PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import { AddressZero } from '@ethersproject/constants';

import AppLayout, { ChainMarkets } from 'components/AppLayout';
import previewer from 'utils/previewer';
import { encodeMarkets } from 'utils/markets';
import { alchemy } from 'utils/provider';
import { supportedChains } from 'utils/chain';

export const metadata: Metadata = {
  title: 'Exactly - Decentralizing the credit market, today',
  description:
    'Exactly is a decentralized, non-custodial and open-source protocol that provides an autonomous fixed and variable interest rate market enabling users to exchange the time value of their assets and completing the DeFi credit market.',

  icons: 'https://app.exact.ly/icon.ico',

  openGraph: {
    url: 'https://app.exact.ly',
    type: 'website',
    title: 'Exactly - Decentralizing the credit market, today',
    description:
      'Exactly is a decentralized, non-custodial and open-source protocol that provides an autonomous fixed and variable interest rate market enabling users to exchange the time value of their assets and completing the DeFi credit market.',
    images: [
      {
        url: 'https://app.exact.ly/img/social/ogp.png',
        secureUrl: 'https://app.exact.ly/img/social/ogp.png',
        type: 'image/png',
        width: 2200,
        height: 1100,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@exactlyprotocol',
    title: 'Exactly - Decentralizing the credit market, today',
    description:
      'Exactly is a decentralized, non-custodial and open-source protocol that provides an autonomous fixed and variable interest rate market enabling users to exchange the time value of their assets and completing the DeFi credit market.',
    images: [
      {
        url: 'https://app.exact.ly/img/social/ogp.png',
        secureUrl: 'https://app.exact.ly/img/social/ogp.png',
        type: 'image/png',
        width: 2200,
        height: 1100,
      },
    ],
  },
};

const inter = Inter({
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  display: 'swap',
  subsets: ['latin'],
  variable: '--inter-font',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  display: 'swap',
  subsets: ['latin'],
  variable: '--ibm-plex-mono-font',
});

export const revalidate = 180;

export default async function RootLayout({ children }: PropsWithChildren) {
  const chainMarkets: ChainMarkets = {};

  for (const chain of supportedChains) {
    const provider = alchemy(chain);
    const contract = previewer(chain, provider);
    if (!contract) {
      continue;
    }
    const exactly = await contract.exactly(AddressZero);
    chainMarkets[chain.id] = encodeMarkets(exactly);
  }

  return (
    <html lang="en-US" className={`${inter.variable} ${ibmPlexMono.variable}`} data-now={Date.now()}>
      <body data-theme="light">
        <AppLayout chainMarkets={JSON.stringify(chainMarkets)}>{children}</AppLayout>
      </body>
    </html>
  );
}
