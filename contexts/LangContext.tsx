import { createContext } from 'react';

const LangContext = createContext('en');

export const LangProvider = LangContext.Provider;

export default LangContext;
