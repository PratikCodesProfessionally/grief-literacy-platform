// BooksPage.tsx
// ============================================================================
// Goal: Searchable + filterable + persistable book grid with a "Read Summary"
// modal, "Notes for Healing", favorites, AND lazy loading (infinite scroll).
//
// Teaching focus:
// - Component state & derived data
// - LocalStorage persistence patterns
// - Accessibility-friendly actions
// - Dialog (modal) composition
// - Incremental rendering with IntersectionObserver
// - Clean, typed data with a Book interface
//
// Tech:
// - React (FC + hooks)
// - TypeScript
// - shadcn/ui (Card, Button, Dialog, etc.)
// - lucide-react (icons)
// - TailwindCSS utility classes
// ============================================================================

import * as React from 'react';
import { Link } from 'react-router-dom';

// shadcn/ui blocks
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Icons
import { ArrowLeft, Star, ExternalLink, Search, Filter, BookOpen, Heart, Loader2 } from 'lucide-react';

// -----------------------------
// 1) Types & Helpers
// -----------------------------
// We extend the Book type with an OPTIONAL "notesForHealing" field.
// Optional means you can gradually add notes without breaking the UI.
type Book = {
  title: string;
  author: string;
  description: string;
  rating: number;
  category: string;
  pages: number;
  published: string;
  isbn: string;
  summary: string;
  keyTopics: string[];
  notesForHealing?: string; // <-- new optional field
};

// LocalStorage keys centralized to avoid typos and enable refactors.
const LS_KEYS = {
  favorites: 'books:favorites',
  selectedCategory: 'books:selectedCategory',
  searchTerm: 'books:searchTerm',
} as const;

// Small helper for safe JSON parsing (so we don't blow up on malformed storage).
function safeParseJSON<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// -----------------------------
// 2) Component
// -----------------------------
export function BooksPage() {
  // -----------------------------
  // 2.1) State (with persistence bootstrap)
  // -----------------------------
  // On initial mount, read persisted filters/favorites from localStorage.
  // We do this inside the initializer function form of useState to avoid a
  // double-read on every render.
  const [searchTerm, setSearchTerm] = React.useState<string>(() =>
    localStorage.getItem(LS_KEYS.searchTerm) ?? ''
  );

  const [selectedCategory, setSelectedCategory] = React.useState<string>(() =>
    localStorage.getItem(LS_KEYS.selectedCategory) ?? 'all'
  );

  const [favoriteBooks, setFavoriteBooks] = React.useState<Set<string>>(() => {
    const raw = localStorage.getItem(LS_KEYS.favorites);
    const arr = safeParseJSON<string[]>(raw, []);
    return new Set(arr);
  });

  // selectedBook drives the Read Summary modal (Dialog).
  const [selectedBook, setSelectedBook] = React.useState<Book | null>(null);

  // -----------------------------
  // 2.2) Data (can be fetched later)
  // -----------------------------
  // Teaching tip: You can move this to a server/API later. The rest of the page
  // logic remains the same; only replace this variable with fetched data.
  const bookRecommendations: Book[] = [
    {
      title: 'Option B',
      author: 'Sheryl Sandberg & Adam Grant',
      description: 'Building resilience in the face of adversity. A powerful guide to finding strength after hardship.',
      rating: 4.8,
      category: 'Resilience',
      pages: 240,
      published: '2017',
      isbn: '978-1524732684',
      summary: 'After the sudden death of her husband, Sheryl Sandberg felt certain that she and her children would never feel pure joy again. But through option B—the second choice when option A is not available—she learned that resilience can be built.',
      keyTopics: ['Resilience Building', 'Post-Traumatic Growth', 'Supporting Children Through Grief', 'Workplace Grief'],
      notesForHealing:
        'A gentle companion when you’re facing the “new normal.” It validates shock and fog while offering micro‑steps to rebuild capacity without spiritual bypassing.'
    },
    {
      title: 'The Year of Magical Thinking',
      author: 'Joan Didion',
      description: 'A powerful memoir about grief and survival following the sudden death of her husband.',
      rating: 4.6,
      category: 'Memoir',
      pages: 227,
      published: '2005',
      isbn: '978-1400078431',
      summary: "A stunning exploration of grief, written after the sudden death of Joan Didion's husband while their daughter lay in a coma. A masterclass in processing loss.",
      keyTopics: ['Sudden Loss', 'Widow Grief', 'Processing Shock', 'Literary Grief'],
      notesForHealing:
        'If you feel “unreasonable” or “stuck,” this book shows how grief bends time and logic. It normalizes the wish to reverse what happened.'
    },
    {
      title: "It's OK That You're Not OK",
      author: 'Megan Devine',
      description: "Meeting grief and loss in a culture that doesn't understand. Revolutionary approach to grief.",
      rating: 4.9,
      category: 'Self-Help',
      pages: 208,
      published: '2017',
      isbn: '978-1622039074',
      summary: 'Challenges conventional grief wisdom and offers a new model for grief that acknowledges pain without trying to fix it. A compassionate guide for those supporting the grieving.',
      keyTopics: ['Grief Myths', 'Supporting Others', 'Normal Grief Responses', 'Grief Culture'],
      notesForHealing:
        'Great when “just move on” advice hurts. Offers language to defend your pace and boundaries, and invites supporters to be present—not prescriptive.'
    },
    {
      title: 'The Wild Edge of Sorrow',
      author: 'Francis Weller',
      description: 'Rituals of renewal and the sacred work of grief. Indigenous wisdom meets modern psychology.',
      rating: 4.7,
      category: 'Spiritual',
      pages: 256,
      published: '2015',
      isbn: '978-1583949764',
      summary: 'Explores grief as a sacred practice and offers rituals and practices for honoring our losses. Integrates indigenous wisdom with contemporary understanding.',
      keyTopics: ['Grief Rituals', 'Spiritual Practices', 'Community Healing', 'Sacred Grief'],
      notesForHealing:
        'If words feel thin, ritual can hold what speech cannot. Use it to anchor feelings in simple, repeatable acts of honoring and release.'
    },
    {
      title: 'When the Body Says No',
      author: 'Gabor Maté',
      description: 'The cost of hidden stress and emotional suppression on physical health.',
      rating: 4.6,
      category: 'Health',
      pages: 320,
      published: '2003',
      isbn: '978-0470923351',
      summary: 'Explores the connection between emotional stress, suppressed grief, and physical illness. Reveals how unprocessed emotions manifest in the body.',
      keyTopics: ['Stress and Health', 'Emotional Suppression', 'Mind-Body Connection', 'Chronic Illness'],
      notesForHealing:
        'A reminder to pace yourself and listen to somatic signals. Grief is embodied; kindness to your body is part of healing—not a detour.'
    },
    {
      title: 'The Body Keeps the Score',
      author: 'Bessel van der Kolk',
      description: 'Brain, mind, and body in the healing of trauma. Essential read for understanding trauma and grief.',
      rating: 4.8,
      category: 'Psychology',
      pages: 464,
      published: '2014',
      isbn: '978-0670785933',
      summary: 'Groundbreaking work on how trauma affects the brain and body, with practical approaches to healing. Essential for understanding traumatic grief.',
      keyTopics: ['Trauma Recovery', 'PTSD', 'Body-Based Healing', 'Neuroplasticity'],
      notesForHealing:
        'If grief is tangled with trauma, this offers routes beyond talk-only approaches—movement, rhythm, breath, and safe body awareness.'
    },
    {
      title: 'Motherless Daughters',
      author: 'Hope Edelman',
      description: 'The legacy of loss for women who lost their mothers early. Comprehensive guide for daughter grief.',
      rating: 4.5,
      category: 'Family',
      pages: 384,
      published: '1994',
      isbn: '978-0738217734',
      summary: 'Explores the unique challenges faced by women who lose their mothers at any age, offering insights into the lasting impact and pathways to healing.',
      keyTopics: ["Mother Loss", "Women's Grief", 'Family Dynamics', 'Identity and Loss'],
      notesForHealing:
        'Validates identity shifts and the “unfinished conversations” many daughters carry. Helpful for naming patterns across life stages.'
    },
    {
      title: 'A Grief Observed',
      author: 'C.S. Lewis',
      description: 'Classic exploration of grief written after the death of his wife. Raw and honest memoir.',
      rating: 4.4,
      category: 'Memoir',
      pages: 96,
      published: '1961',
      isbn: '978-0571290680',
      summary: "Lewis's raw, honest account of his grief after losing his wife to cancer. A timeless exploration of faith, doubt, and the reality of loss.",
      keyTopics: ['Faith and Grief', 'Spousal Loss', 'Honest Grief', 'Spiritual Questions'],
      notesForHealing:
        'Offers permission to question everything—even faith—without losing dignity. Doubt can be part of devotion.'
    },
    {
      title: 'Pet Loss and Human Emotion',
      author: 'Cheri Barton Ross',
      description: 'Guide to understanding and healing from pet loss. Validates the depth of pet grief.',
      rating: 4.3,
      category: 'Pet Loss',
      pages: 192,
      published: '2013',
      isbn: '978-0415955768',
      summary: 'Validates the profound grief experienced after losing a beloved pet and provides practical guidance for healing from companion animal loss.',
      keyTopics: ['Pet Grief', 'Animal Bonds', 'Disenfranchised Grief', 'Pet Memorials'],
      notesForHealing:
        'For losses that others may minimize, this book reaffirms that bonds with animals are family-deep—and worthy of full mourning.'
    },
    {
      title: 'The Art of Procrastination',
      author: 'John Perry',
      description: 'A witty and philosophical guide to turning procrastination into productivity through structured procrastination.',
      rating: 4.2,
      category: 'Self-Help',
      pages: 112,
      published: '2012',
      isbn: '978-0761171676',
      summary:
        'Through humor and wisdom, John Perry introduces structured procrastination—using the urge to avoid big tasks as a way to get other things done, transforming avoidance into momentum.',
      keyTopics: ['Structured Procrastination', 'Time Management', 'Self-Deception', 'Productivity Hacks', 'Humor'],
      // >>> Notes for Healing (tying procrastination to grief work)
      notesForHealing:
        'Grief can drain executive function. Instead of shaming yourself for “not doing the big thing,” harness gentle momentum: do small, kind tasks that orbit the hard one. Let tiny wins rebuild capacity.'
    },
    {
  title: 'Immun gegen toxische Menschen',
  author: 'Lisa Irani & Anna Eckert',
  description: 'Psychological tools for recognizing and protecting yourself from toxic dynamics and narcissistic manipulation. (Currently available in German only.)',
  rating: 4.3,
  category: 'Self-Help',
  pages: 288,
  published: '2024',
  isbn: '978-3833892660', // print edition
  summary: 'A structured guide to identifying toxic patterns (especially narcissistic tactics), setting boundaries, and detaching from manipulative behaviors using evidence‑informed psychological tools. Clear explanations, reflective exercises, and everyday strategies help you build emotional immunity and reclaim agency.',
  keyTopics: ['Narcissism', 'Manipulation Patterns', 'Boundaries', 'Emotional Resilience', 'Detachment'],
  // Optional field if you’re using the commented version I gave you:
  // This shows up inside the “Read Summary” dialog under a green box.
  notesForHealing: 'If you can’t avoid difficult people (family, coworkers), focus on micro‑boundaries and low‑drama exits. Practice scripts and body cues; small, consistent limits compound into safety.'
},
{
  title: 'Meistere Deine Emotionen: Die neue 5-Schritte-Methode, um Ängste zu besiegen, Wut zu besänftigen und Depressionen zu überwinden',
  author: 'Dr. Detlef Beeker',
  description: 'A practical guide to understanding and transforming your emotions through a structured five-step method.',
  rating: 4.5,
  category: 'Emotional Health',
  pages: 150,
  published: '2019',
  isbn: '978-1072551386',
  summary: 'This book offers a scientifically grounded and easy-to-follow 5-step approach to mastering emotions like fear, anger, and sadness. Dr. Beeker combines psychological insights with practical exercises to help readers achieve emotional balance, break negative cycles, and regain mental clarity. It’s an empowering read for anyone seeking long-term emotional resilience and peace of mind.',
  keyTopics: ['Emotional Regulation', 'Mindfulness', 'Cognitive Techniques', 'Self-Awareness', 'Stress Management']
},
{
  title: 'New love, same ?!:',
  author: 'Yvi Blum',
  description: 'A guide to understanding relationship patterns and how to break free from repeating cycles in romantic relationships.',
  rating: 4.4,
  category: 'Self-Help',
  pages: 256,
  published: '2024',
  isbn: '978-3833892073',
  summary: 'This book explores why we often find ourselves repeating the same patterns in relationships, despite wanting different outcomes. Yvi Blum provides practical tools and exercises to help readers identify their relationship patterns, understand their origins, and develop strategies to break old cycles. Through a combination of psychological insights and actionable steps, readers learn how to approach new relationships with awareness and create healthier, more fulfilling connections.',
  keyTopics: ['Relationship Patterns', 'Self-Awareness', 'Breaking Cycles', 'Emotional Growth', 'Healthy Relationships'],
  notesForHealing: 'If you keep encountering similar challenges in relationships, this book helps you pause and examine patterns with compassion rather than judgment. The exercises guide you toward conscious choice—building new relational habits one interaction at a time.'
}

  ];

  // Available categories for the filter dropdown.
  const categories = ['all', 'Memoir', 'Self-Help', 'Spiritual', 'Psychology', 'Health', 'Family', 'Pet Loss', 'Resilience', 'Emotional Health'];

  // -----------------------------
  // 2.3) Persistence effects
  // -----------------------------
  // Keep localStorage in sync whenever user changes these states.
  React.useEffect(() => {
    localStorage.setItem(LS_KEYS.searchTerm, searchTerm);
  }, [searchTerm]);

  React.useEffect(() => {
    localStorage.setItem(LS_KEYS.selectedCategory, selectedCategory);
  }, [selectedCategory]);

  React.useEffect(() => {
    // Sets aren’t serializable directly; convert to array first.
    localStorage.setItem(LS_KEYS.favorites, JSON.stringify(Array.from(favoriteBooks)));
  }, [favoriteBooks]);

  // -----------------------------
  // 2.4) Derived Data (Filtering)
  // -----------------------------
  // Teaching: We compute filteredBooks on each render. For big lists, wrap this
  // in useMemo with [searchTerm, selectedCategory, bookRecommendations] deps.
  const filteredBooks = bookRecommendations.filter(book => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.description.toLowerCase().includes(query);
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // -----------------------------
  // 2.5) Lazy Loading / Infinite Scroll
  // -----------------------------
  // Idea: render an initial PAGE_SIZE set of cards, and reveal more when the
  // sentinel (an empty div at the bottom) is visible. Resets when filters change.
  const PAGE_SIZE = 6; // tweak to taste
  const [visibleCount, setVisibleCount] = React.useState<number>(PAGE_SIZE);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const [ioSupported, setIoSupported] = React.useState<boolean>(typeof window !== 'undefined' && 'IntersectionObserver' in window);

  // Reset visibleCount whenever the filtered result set changes (new search/category)
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, selectedCategory]);

  // Attach IntersectionObserver to sentinel to auto-increase visibleCount
  React.useEffect(() => {
    if (!ioSupported) return; // skip if browser lacks IO
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      // When sentinel is visible and we still have more items to show -> load next "page".
      if (entry.isIntersecting) {
        setVisibleCount((curr) => Math.min(curr + PAGE_SIZE, filteredBooks.length));
      }
    }, { rootMargin: '200px 0px' }); // preload a bit before hitting the bottom

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [ioSupported, filteredBooks.length]);

  // Determine the list we actually render right now (incremental slice).
  const booksToRender = filteredBooks.slice(0, visibleCount);

  // Manual fallback for browsers without IntersectionObserver.
  const canLoadMore = visibleCount < filteredBooks.length;
  const loadMore = () => setVisibleCount((curr) => Math.min(curr + PAGE_SIZE, filteredBooks.length));

  // -----------------------------
  // 2.6) Event Handlers
  // -----------------------------
  const toggleFavorite = (isbn: string) => {
    const draft = new Set(favoriteBooks);
    if (draft.has(isbn)) draft.delete(isbn);
    else draft.add(isbn);
    setFavoriteBooks(draft);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Memoir': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Self-Help': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Spiritual': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Psychology': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Health': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Family': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Pet Loss': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'Resilience': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Emotional Health': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const openSummary = (book: Book) => setSelectedBook(book);
  const closeSummary = () => setSelectedBook(null);

  const isbnSearchUrl = (isbn: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(isbn + ' buy')}`;

  // -----------------------------
  // 3) Render
  // -----------------------------
  return (
    <div className="space-y-6">
      {/* Header: Back link + title + subtitle */}
      <div className="flex items-center space-x-4">
        <Link to="/resources">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Button>
        </Link>

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Grief &amp; Healing Books
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Curated book recommendations for your healing journey
          </p>
        </div>
      </div>

      {/* Controls: Search + Category */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search input (controlled) */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search books, authors, or topics..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search books"
              />
            </div>

            {/* Category select */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48" aria-label="Filter by category">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid of cards (incrementally rendered) */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {booksToRender.map((book) => (
          <Card key={book.isbn} className="hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader className="flex-grow">
              {/* Top row: category + favorites + rating */}
              <div className="flex items-start justify-between mb-3">
                <Badge className={getCategoryColor(book.category)}>
                  {book.category}
                </Badge>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleFavorite(book.isbn)}
                    aria-label={favoriteBooks.has(book.isbn) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`h-4 w-4 ${favoriteBooks.has(book.isbn) ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>

                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                    <span className="text-sm font-medium">{book.rating}</span>
                  </div>
                </div>
              </div>

              {/* Title, author, description, meta */}
              <CardTitle className="text-lg leading-tight">{book.title}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">by {book.author}</p>
              <CardDescription className="line-clamp-3">{book.description}</CardDescription>

              <div className="text-xs text-gray-500 space-y-1">
                <p>{book.pages} pages • Published {book.published}</p>
                <p>ISBN: {book.isbn}</p>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
              {/* Key topics summary badges (top 3) */}
              <div>
                <h4 className="text-sm font-medium mb-2">Key Topics:</h4>
                <div className="flex flex-wrap gap-1">
                  {book.keyTopics.slice(0, 3).map((topic, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions: Read Summary (modal) + Buy (external) */}
              <div className="flex space-x-2">
                <Button size="sm" className="flex-1" onClick={() => openSummary(book)}>
                  <BookOpen className="h-3 w-3 mr-1" />
                  Read Summary
                </Button>

                <a
                  href={isbnSearchUrl(book.isbn)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                  aria-label={`Buy ${book.title}`}
                >
                  <Button size="sm" variant="outline" className="w-full">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Buy
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state if no results */}
      {filteredBooks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">No books found</h3>
            <p className="text-gray-600 dark:text-gray-300">Try adjusting your search terms or category filter</p>
          </CardContent>
        </Card>
      )}

      {/* Lazy-loading sentinel / Load more fallback */}
      {filteredBooks.length > 0 && canLoadMore && (
        <div className="flex flex-col items-center justify-center py-4">
          {/* Sentinel used by IntersectionObserver (invisible but occupies layout) */}
          <div ref={sentinelRef} className="h-1 w-full" />

          {/* Fallback button if IO not supported (or just to give users control) */}
          {!ioSupported && (
            <Button onClick={loadMore} variant="outline">
              <Loader2 className="h-4 w-4 mr-2 animate-spin-slow" />
              Load more
            </Button>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="text-amber-600 text-xl" aria-hidden="true">📚</div>
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Book Recommendations Disclaimer</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                These book recommendations are curated for educational purposes. We are not affiliated with publishers or authors.
                Please purchase books through your preferred retailer. Reading suggestions should complement, not replace,
                professional grief counseling when needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* -----------------------------
          Read Summary Modal (Dialog)
         ----------------------------- */}
      <Dialog open={!!selectedBook} onOpenChange={(open) => !open && closeSummary()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="leading-snug">{selectedBook?.title}</DialogTitle>
            <DialogDescription className="text-sm">
              by {selectedBook?.author} • {selectedBook?.pages} pages • Published {selectedBook?.published}
            </DialogDescription>
          </DialogHeader>

          {/* Body: Full summary + ALL key topics + Notes for Healing */}
          <div className="space-y-4">
            {/* Summary paragraph */}
            <p className="text-sm text-gray-700 dark:text-gray-200">{selectedBook?.summary}</p>

            {/* Key topics list */}
            {selectedBook?.keyTopics?.length ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Key Topics</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedBook.keyTopics.map((topic, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Notes for Healing (conditionally render if present) */}
            {selectedBook?.notesForHealing ? (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 p-3">
                <h5 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-1">Notes for Healing</h5>
                <p className="text-sm text-emerald-800 dark:text-emerald-100">{selectedBook.notesForHealing}</p>
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedBook?.isbn && (
              <a
                href={isbnSearchUrl(selectedBook.isbn)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Buy ${selectedBook.title}`}
              >
                <Button variant="outline">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Buy
                </Button>
              </a>
            )}
            <Button onClick={closeSummary}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
