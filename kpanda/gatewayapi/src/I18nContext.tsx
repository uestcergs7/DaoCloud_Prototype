/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';
import { zh, en, type Locale } from './i18n';

const I18nContext = createContext<Locale>(zh);

export function I18nProvider({ lang, children }: { lang: string; children: React.ReactNode }) {
  const locale = lang === 'en' ? en : zh;
  return <I18nContext.Provider value={locale}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
