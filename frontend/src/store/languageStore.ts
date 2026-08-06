import { create } from 'zustand';
import es from '../locales/es.json';
import en from '../locales/en.json';
import pt from '../locales/pt.json';

export type SupportedLanguage = 'es' | 'en' | 'pt';

const dictionaries: Record<SupportedLanguage, any> = { es, en, pt };

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, fallback?: string) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: (typeof window !== 'undefined' && (localStorage.getItem('perfilcrm_lang') as SupportedLanguage)) || 'es',

  setLanguage: (lang: SupportedLanguage) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('perfilcrm_lang', lang);
    }
    set({ language: lang });
  },

  t: (path: string, fallback?: string): string => {
    const lang = get().language || 'es';
    const dict = dictionaries[lang] || dictionaries.es;

    const keys = path.split('.');
    let current: any = dict;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to Spanish dictionary if key is missing in active language
        let esCurrent: any = dictionaries.es;
        for (const esKey of keys) {
          if (esCurrent && typeof esCurrent === 'object' && esKey in esCurrent) {
            esCurrent = esCurrent[esKey];
          } else {
            return fallback || path;
          }
        }
        return typeof esCurrent === 'string' ? esCurrent : fallback || path;
      }
    }

    return typeof current === 'string' ? current : fallback || path;
  },
}));
