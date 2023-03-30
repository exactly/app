import React, { createContext } from 'react';

export type ContextValues = {
  assets: string[];
};

export const StaticContext = createContext<ContextValues | null>(null);

export function StaticContextProvider({ assets, children }: React.PropsWithChildren<ContextValues>) {
  return <StaticContext.Provider value={{ assets }}>{children}</StaticContext.Provider>;
}

export function useStaticContext() {
  const ctx = React.useContext(StaticContext);

  if (!ctx) {
    throw new Error('Using StaticContextProvider outside of provider');
  }

  return ctx;
}
