import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import DICT, { patterns } from 'web/utils/dictionary';

const STORAGE = 'kangeyam.locale';
const DEFAULT = 'en';

function detect() {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const saved = window.localStorage.getItem(STORAGE);
    if (saved === 'ta' || saved === 'en') return saved;
    const nav = window.navigator.language || '';
    if (/^ta\b/i.test(nav)) return 'ta';
  } catch {
    /* private mode */
  }
  return DEFAULT;
}

function interpolate(text, params = {}) {
  if (!params || typeof text !== 'string') return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    params[key] === undefined || params[key] === null ? match : String(params[key]),
  );
}

/**
 * Two locales, one dictionary. Strings are keyed by their English text so the
 * templates stay readable and a missing translation degrades to English instead
 * of showing a key. Run `npm run i18n:check` (scripts/i18n-check.js) to see gaps.
 */
export default class I18nService extends Service {
  @tracked locale = detect();

  dict = DICT;

  constructor() {
    super(...arguments);
    // keep <html lang> honest from the first paint (screen readers, hyphenation)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', this.locale);
    }
  }

  get isTamil() {
    return this.locale === 'ta';
  }

  /** Label for the switch button: always the language you would switch *to*. */
  get switchLabel() {
    return this.isTamil ? 'English' : 'தமிழ்';
  }

  get switchShort() {
    return this.isTamil ? 'EN' : 'த';
  }

  setLocale(locale) {
    const next = locale === 'ta' ? 'ta' : 'en';
    this.locale = next;
    try {
      window.localStorage.setItem(STORAGE, next);
      document.documentElement.setAttribute('lang', next);
    } catch {
      /* private mode */
    }
    return next;
  }

  toggle() {
    return this.setLocale(this.isTamil ? 'en' : 'ta');
  }

  /** Translate an English source string, with {{placeholder}} interpolation. */
  translate(text, params) {
    if (typeof text !== 'string') return text;
    if (!this.isTamil) return interpolate(text, params);
    const hit = this.dict.ta[text];
    if (hit !== undefined) return interpolate(hit, params);
    // server-composed sentences (age labels, relationship names, verdicts)
    for (const rule of patterns) {
      const m = rule.re.exec(text);
      if (m) return rule.build(m);
    }
    return interpolate(text, params);
  }

  /** Pick the right half of a server label pair: { ta: '…', en: '…' }. */
  label(pair) {
    if (!pair) return '';
    if (typeof pair === 'string') return this.translate(pair);
    return (this.isTamil ? pair.ta : pair.en) || pair.en || pair.ta || '';
  }

  /** Primary name of an animal/owner record for the active locale. */
  name(record) {
    if (!record) return '';
    return this.isTamil
      ? record.name_ta || record.name_en || ''
      : record.name_en || record.name_ta || '';
  }

  /** The other-language name, or '' when it would repeat the primary one. */
  altName(record) {
    if (!record) return '';
    const primary = this.name(record);
    const other = this.isTamil
      ? record.name_en || ''
      : record.name_ta || '';
    return other && other !== primary ? other : '';
  }

  /** 'ta' | 'en' — handy for templates that need the raw code. */
  get code() {
    return this.locale;
  }
}
