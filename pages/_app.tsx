import "../styles/globals.css";
import "../styles/variables.css";

import { ThemeProvider } from "@mui/material";

import type { AppProps } from "next/app";
import { darkTheme } from "../styles/theme";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Exa App</title>
        <meta
          name="description"
          content="Deposit and borrow on-chain. The first self-custodial debit and credit card."
        />
        <link rel="icon" href="/icon.ico" />
      </Head>
      <ThemeProvider theme={darkTheme}>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}
