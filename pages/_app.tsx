import "../styles/globals.css";
import "../styles/variables.css";

import { ThemeProvider } from "@mui/material";

import type { AppProps } from "next/app";
import { darkTheme } from "../styles/theme";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={darkTheme}>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
