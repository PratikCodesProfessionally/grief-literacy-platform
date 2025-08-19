import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Star, ExternalLink, Search, Filter, BookOpen, Heart } from 'lucide-react';

export function BooksPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [favoriteBooks, setFavoriteBooks] = React.useState<Set<string>>(new Set());

  const bookRecommendations = [
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
      keyTopics: ['Resilience Building', 'Post-Traumatic Growth', 'Supporting Children Through Grief', 'Workplace Grief']
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
      summary: 'A stunning exploration of grief, written after the sudden death of Joan Didion\'s husband while their daughter lay in a coma. A masterclass in processing loss.',
      keyTopics: ['Sudden Loss', 'Widow Grief', 'Processing Shock', 'Literary Grief']
    },
    {
      title: 'It\'s OK That You\'re Not OK',
      author: 'Megan Devine',
      description: 'Meeting grief and loss in a culture that doesn\'t understand. Revolutionary approach to grief.',
      rating: 4.9,
      category: 'Self-Help',
      pages: 208,
      published: '2017',
      isbn: '978-1622039074',
      summary: 'Challenges conventional grief wisdom and offers a new model for grief that acknowledges pain without trying to fix it. A compassionate guide for those supporting the grieving.',
      keyTopics: ['Grief Myths', 'Supporting Others', 'Normal Grief Responses', 'Grief Culture']
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
      keyTopics: ['Grief Rituals', 'Spiritual Practices', 'Community Healing', 'Sacred Grief']
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
      keyTopics: ['Stress and Health', 'Emotional Suppression', 'Mind-Body Connection', 'Chronic Illness']
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
      keyTopics: ['Trauma Recovery', 'PTSD', 'Body-Based Healing', 'Neuroplasticity']
    },
    {
      title: 'Motherless Daughters',
      author: 'Hope Edelman',
      description: 'The legacy of loss for women who lost their mothers early. Comprehensive guide for daughter grief.',
      rating: 4.5,
      category: 'Family',
      pages: 384,
      published: '1994',
      isbn: '978-0385311908',
      summary: 'Explores the unique challenges faced by women who lose their mothers at any age, offering insights into the lasting impact and pathways to healing.',
      keyTopics: ['Mother Loss', 'Women\'s Grief', 'Family Dynamics', 'Identity and Loss']
    },
    {
      title: 'A Grief Observed',
      author: 'C.S. Lewis',
      description: 'Classic exploration of grief written after the death of his wife. Raw and honest memoir.',
      rating: 4.4,
      category: 'Memoir',
      pages: 96,
      published: '1961',
      isbn: '978-0060652883',
      summary: 'Lewis\'s raw, honest account of his grief after losing his wife to cancer. A timeless exploration of faith, doubt, and the reality of loss.',
      keyTopics: ['Faith and Grief', 'Spousal Loss', 'Honest Grief', 'Spiritual Questions']
    },
    {
      title: 'Pet Loss and Human Emotion',
      author: 'Cheri Barton Ross',
      description: 'Guide to understanding and healing from pet loss. Validates the depth of pet grief.',
      rating: 4.3,
      category: 'Pet Loss',
      pages: 192,
      published: '2013',
      isbn: '978-0415656948',
      summary: 'Validates the profound grief experienced after losing a beloved pet and provides practical guidance for healing from companion animal loss.',
      keyTopics: ['Pet Grief', 'Animal Bonds', 'Disenfranchised Grief', 'Pet Memorials']
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
  summary: 'Through humor and wisdom, John Perry introduces the concept of structured procrastination—using the urge to avoid big tasks as a way to get other things done. Rather than fighting procrastination, Perry shows how to embrace it productively.',
  keyTopics: ['Structured Procrastination', 'Time Management', 'Self-Deception', 'Productivity Hacks', 'Humor']
}
  ];

  const categories = ['all', 'Memoir', 'Self-Help', 'Spiritual', 'Psychology', 'Health', 'Family', 'Pet Loss', 'Resilience'];

  const filteredBooks = bookRecommendations.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (isbn: string) => {
    const newFavorites = new Set(favoriteBooks);
    if (newFavorites.has(isbn)) {
      newFavorites.delete(isbn);
    } else {
      newFavorites.add(isbn);
    }
    setFavoriteBooks(newFavorites);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Memoir': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Self-Help': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Spiritual': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Psychology': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Health': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Family': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Pet Loss': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'Resilience': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/resources">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Grief & Healing Books
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Curated book recommendations for your healing journey
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search books, authors, or topics..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
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

      {/* Books Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book) => (
          <Card key={book.isbn} className="hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader className="flex-grow">
              <div className="flex items-start justify-between mb-3">
                <Badge className={getCategoryColor(book.category)}>
                  {book.category}
                </Badge>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleFavorite(book.isbn)}
                  >
                    <Heart className={`h-4 w-4 ${favoriteBooks.has(book.isbn) ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{book.rating}</span>
                  </div>
                </div>
              </div>
              
              <CardTitle className="text-lg leading-tight">{book.title}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                by {book.author}
              </p>
              <CardDescription className="line-clamp-3">
                {book.description}
              </CardDescription>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>{book.pages} pages • Published {book.published}</p>
                <p>ISBN: {book.isbn}</p>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-4">
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
              
              <div className="flex space-x-2">
                <Button size="sm" className="flex-1">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Read Summary
                </Button>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Buy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              No books found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Try adjusting your search terms or category filter
            </p>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="text-amber-600 text-xl">📚</div>
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                Book Recommendations Disclaimer
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                These book recommendations are curated for educational purposes. We are not affiliated with publishers or authors. 
                Please purchase books through your preferred retailer. Reading suggestions should complement, not replace, 
                professional grief counseling when needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
