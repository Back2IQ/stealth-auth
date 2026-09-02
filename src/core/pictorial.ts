/**
 * Back2IQ StealthAuth - Pictorial Visual Object Dictionary (DE, EN, TR, FR, ES)
 * (c) Back2IQ - Ahead by Design (Deniz Kiran)
 * 
 * Provides universally recognizable visual objects for instant Cognitive Image MFA.
 * The user sees an icon/image (e.g. "Hut") and subconscious object recognition
 * allows immediate extraction of First char ('H') and Last char ('t') in the user's native language.
 */

import { SupportedLocale, VisualObjectHint } from '../types.js';

export const PICTORIAL_OBJECT_DICTIONARY: VisualObjectHint[] = [
  {
    objectId: 'hat',
    iconSvg: '<svg viewBox="0 0 24 24"><path d="M2 18h20v2H2zm3-4l2-8h10l2 8H5z"/></svg>',
    localizedNames: {
      de: 'Hut',
      en: 'Hat',
      tr: 'Sapka',
      fr: 'Chapeau',
      es: 'Sombrero',
    },
  },
  {
    objectId: 'car',
    iconSvg: '<svg viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>',
    localizedNames: {
      de: 'Auto',
      en: 'Car',
      tr: 'Araba',
      fr: 'Voiture',
      es: 'Coche',
    },
  },
  {
    objectId: 'cat',
    iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>',
    localizedNames: {
      de: 'Katze',
      en: 'Cat',
      tr: 'Kedi',
      fr: 'Chat',
      es: 'Gato',
    },
  },
  {
    objectId: 'sun',
    iconSvg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    localizedNames: {
      de: 'Sonne',
      en: 'Sun',
      tr: 'Gunes',
      fr: 'Soleil',
      es: 'Sol',
    },
  },
  {
    objectId: 'tree',
    iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 2L4 14h5v8h6v-8h5L12 2z"/></svg>',
    localizedNames: {
      de: 'Baum',
      en: 'Tree',
      tr: 'Agac',
      fr: 'Arbre',
      es: 'Arbol',
    },
  },
  {
    objectId: 'house',
    iconSvg: '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
    localizedNames: {
      de: 'Haus',
      en: 'House',
      tr: 'Ev',
      fr: 'Maison',
      es: 'Casa',
    },
  },
  {
    objectId: 'star',
    iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
    localizedNames: {
      de: 'Stern',
      en: 'Star',
      tr: 'Yildiz',
      fr: 'Etoile',
      es: 'Estrella',
    },
  },
  {
    objectId: 'moon',
    iconSvg: '<svg viewBox="0 0 24 24"><path d="M12.3 2a10 10 0 0 0-.19 20 10 10 0 0 0 8.36-4.54 1 1 0 0 0-.78-1.56 8 8 0 1 1-8.95-12.32 1 1 0 0 0-.44-1.58z"/></svg>',
    localizedNames: {
      de: 'Mond',
      en: 'Moon',
      tr: 'Ay',
      fr: 'Lune',
      es: 'Luna',
    },
  },
  {
    objectId: 'fish',
    iconSvg: '<svg viewBox="0 0 24 24"><path d="M22 12c-3-2-6-3-10-3-4 0-7 2-10 3 3 1 6 3 10 3 4 0 7-1 10-3zm-6-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>',
    localizedNames: {
      de: 'Fisch',
      en: 'Fish',
      tr: 'Balik',
      fr: 'Poisson',
      es: 'Pez',
    },
  },
  {
    objectId: 'book',
    iconSvg: '<svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>',
    localizedNames: {
      de: 'Buch',
      en: 'Book',
      tr: 'Kitap',
      fr: 'Livre',
      es: 'Libro',
    },
  },
  {
    objectId: 'apple',
    iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 2c.5 0 1 .5 1 1v2c3.3 0 6 2.7 6 6 0 4-3 9-7 9s-7-5-7-9c0-3.3 2.7-6 6-6V3c0-.5.5-1 1-1z"/></svg>',
    localizedNames: {
      de: 'Apfel',
      en: 'Apple',
      tr: 'Elma',
      fr: 'Pomme',
      es: 'Manzana',
    },
  },
  {
    objectId: 'bird',
    iconSvg: '<svg viewBox="0 0 24 24"><path d="M21 4c-3 1-5 3-6 6-2-1-4-1-6 0-3 1-5 4-5 8 4-1 7-3 9-6 1 2 3 3 5 3 2 0 4-1 5-3-1-3-1-6-2-8z"/></svg>',
    localizedNames: {
      de: 'Vogel',
      en: 'Bird',
      tr: 'Kus',
      fr: 'Oiseau',
      es: 'Pajaro',
    },
  },
  {
    objectId: 'key',
    iconSvg: '<svg viewBox="0 0 24 24"><path d="M7 14A5 5 0 0 1 12 9V5h2v2h2V5h2v4l-4 4a5 5 0 1 1-7 1zm5-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>',
    localizedNames: {
      de: 'Schluessel',
      en: 'Key',
      tr: 'Anahtar',
      fr: 'Cle',
      es: 'Llave',
    },
  },
];

/**
 * Returns a visual object hint for a given index and cycle
 */
export function getVisualObjectForState(index: number, cycle = 0): VisualObjectHint {
  const dictionaryLength = PICTORIAL_OBJECT_DICTIONARY.length;
  // Map index (1..26) and cycle into dictionary
  const offset = ((index - 1) + cycle * 7) % dictionaryLength;
  return PICTORIAL_OBJECT_DICTIONARY[offset];
}

/**
 * Resolves the localized object word for a given visual object and locale
 */
export function getVisualObjectWord(
  object: VisualObjectHint,
  locale: SupportedLocale = 'de'
): string {
  return object.localizedNames[locale] || object.localizedNames.en || object.objectId;
}
