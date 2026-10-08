import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink } from 'lucide-react';

/**
 * The printed "Healing Mandalas" coloring book (Amazon KDP paperback).
 * While `asin` is null the card shows "Coming Soon" and links nowhere; once the
 * book is live, set `asin` and the button opens the reader's local Amazon store.
 */
export const MANDALA_BOOK = {
  title: 'Healing Mandalas',
  subtitle: 'A Gentle Coloring Book for Children with Big Feelings',
  cover: '/Images/HealingMandalasBookCover.jpg',
  asin: null as string | null,
};

/** Amazon store for the visitor's browser language; amazon.com otherwise. */
function amazonDomain(): string {
  const lang = (typeof navigator !== 'undefined' ? navigator.language : 'en-US').toLowerCase();
  const byRegion: Record<string, string> = { gb: 'co.uk', ca: 'ca', au: 'com.au', jp: 'co.jp', ie: 'ie', be: 'com.be' };
  const byLanguage: Record<string, string> = { de: 'de', fr: 'fr', es: 'es', it: 'it', nl: 'nl', pl: 'pl', sv: 'se', ja: 'co.jp' };
  const [language, region] = lang.split('-');
  return (region && byRegion[region]) || byLanguage[language] || 'com';
}

export function MandalaBookCard() {
  const comingSoon = !MANDALA_BOOK.asin;
  const shopUrl = comingSoon ? undefined : `https://www.amazon.${amazonDomain()}/dp/${MANDALA_BOOK.asin}`;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 dark:from-purple-900/30 dark:via-pink-900/20 dark:to-cyan-900/20 border-2 border-purple-200 dark:border-purple-700">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 md:gap-7">
          <div className="relative shrink-0">
            <img
              src={MANDALA_BOOK.cover}
              alt={`Cover of ${MANDALA_BOOK.title}: ${MANDALA_BOOK.subtitle}`}
              loading="lazy"
              width={640}
              height={828}
              className="w-36 md:w-44 h-auto rounded-md shadow-xl ring-1 ring-black/5 sm:-rotate-2"
            />
            {comingSoon && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] md:text-xs font-semibold tracking-wide uppercase text-amber-900 bg-amber-200/90 px-2.5 py-0.5 rounded-full shadow-sm dark:text-amber-100 dark:bg-amber-800/80">
                Coming Soon
              </span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                The printed coloring book
              </p>
              <h3 className="mt-1 text-xl md:text-2xl font-semibold text-purple-900 dark:text-purple-100">{MANDALA_BOOK.title}</h3>
              <p className="text-sm md:text-base text-purple-700 dark:text-purple-300">{MANDALA_BOOK.subtitle}</p>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Take your mandala practice off the screen: 38 calming designs from simple to detailed, with a gentle
              idea to think about on every page. For children missing someone, a person or a pet, and for busy minds
              that need a quiet moment.
            </p>

            <ul className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs font-medium">
              {['38 designs', 'Simple to detailed', 'Printed paperback', 'Ages 4+'].map((tag) => (
                <li key={tag} className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-gray-800/70 text-purple-800 dark:text-purple-200 ring-1 ring-purple-200 dark:ring-purple-700">
                  {tag}
                </li>
              ))}
            </ul>

            {comingSoon ? (
              <Button
                disabled
                aria-disabled
                className="w-full sm:w-auto cursor-not-allowed"
                variant="outline"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Coming soon on Amazon
              </Button>
            ) : (
              <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <a href={shopUrl} target="_blank" rel="noopener noreferrer">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Get the book on Amazon
                  <ExternalLink className="w-3.5 h-3.5 ml-2" aria-hidden="true" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
