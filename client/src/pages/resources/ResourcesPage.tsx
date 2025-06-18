import * as React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Book, GraduationCap, Globe, Phone } from 'lucide-react';
import { CoursesPage } from './CoursesPage';
import { BooksPage } from './BooksPage';
import { ProfessionalHelpPage } from './ProfessionalHelpPage';

export function ResourcesPage() {
  const location = useLocation();
  const isMainPage = location.pathname === '/resources';

  const bookRecommendations = [
    {
      title: 'Option B',
      author: 'Sheryl Sandberg & Adam Grant',
      description: 'Building resilience in the face of adversity',
      rating: 4.8,
      category: 'Resilience',
      pages: 240,
      published: '2017',
      isbn: '978-1524732684'
    },
    {
      title: 'The Year of Magical Thinking',
      author: 'Joan Didion',
      description: 'A powerful memoir about grief and survival',
      rating: 4.6,
      category: 'Memoir',
      pages: 227,
      published: '2005',
      isbn: '978-1400078431'
    },
    {
      title: 'It\'s OK That You\'re Not OK',
      author: 'Megan Devine',
      description: 'Meeting grief and loss in a culture that doesn\'t understand',
      rating: 4.9,
      category: 'Self-Help',
      pages: 208,
      published: '2017',
      isbn: '978-1622039074'
    },
    {
      title: 'The Wild Edge of Sorrow',
      author: 'Francis Weller',
      description: 'Rituals of renewal and the sacred work of grief',
      rating: 4.7,
      category: 'Spiritual',
      pages: 256,
      published: '2015',
      isbn: '978-1583949764'
    },
    {
      title: 'When the Body Says No',
      author: 'Gabor Maté',
      description: 'The cost of hidden stress and emotional suppression',
      rating: 4.6,
      category: 'Health',
      pages: 320,
      published: '2003',
      isbn: '978-0470923351'
    },
    {
      title: 'The Body Keeps the Score',
      author: 'Bessel van der Kolk',
      description: 'Brain, mind, and body in the healing of trauma',
      rating: 4.8,
      category: 'Psychology',
      pages: 464,
      published: '2014',
      isbn: '978-0670785933'
    }
  ];

  const courses = [
    {
      title: 'Understanding Grief Stages',
      duration: '2 hours',
      lessons: 8,
      description: 'Learn about different models of grief and how they apply to your experience',
      students: 1247,
      rating: 4.8
    },
    {
      title: 'Grief in Different Cultures',
      duration: '1.5 hours',
      lessons: 6,
      description: 'Explore how different cultures around the world understand and process grief',
      students: 892,
      rating: 4.9
    },
    {
      title: 'Supporting Others in Grief',
      duration: '3 hours',
      lessons: 12,
      description: 'How to offer meaningful support to friends and family who are grieving',
      students: 2156,
      rating: 4.7
    },
  ];

  const resources = [
    {
      title: 'Self-Help Books',
      description: 'Curated recommendations for books on grief, healing, and resilience',
      icon: <Book className="h-6 w-6" />,
      path: '/resources/books',
      count: `${bookRecommendations.length} books`
    },
    {
      title: 'Educational Courses',
      description: 'Short courses on grief literacy and emotional wellness',
      icon: <GraduationCap className="h-6 w-6" />,
      path: '/resources/courses',
      count: `${courses.length} courses`
    },
    {
      title: 'Cultural Practices',
      description: 'Learn how different cultures approach grief and mourning',
      icon: <Globe className="h-6 w-6" />,
      path: '/resources/cultural',
      count: 'Global wisdom'
    },
    {
      title: 'Professional Help',
      description: 'Crisis hotlines and professional grief support resources',
      icon: <Phone className="h-6 w-6" />,
      path: '/resources/professional',
      count: 'Crisis support'
    },
  ];

  if (isMainPage) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            Learning Resources
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Educational content, books, and courses to deepen your understanding of grief and healing
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {resources.map((resource, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl group-hover:scale-110 transition-transform">{resource.icon}</div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center justify-between">
                      <span>{resource.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {resource.count}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link to={resource.path}>
                  <Button className="w-full">Explore</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Book className="h-5 w-5" />
                <span>Featured Books</span>
              </CardTitle>
              <CardDescription>
                Recommended reading for your grief journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookRecommendations.slice(0, 4).map((book, index) => (
                <Card key={index} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-sm">{book.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {book.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      by {book.author}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {book.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{book.rating}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {book.pages} pages • {book.published}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/resources/books">View All Books</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Popular Courses</span>
              </CardTitle>
              <CardDescription>
                Start learning with our most popular courses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {courses.map((course, index) => (
                <Card key={index} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-1">{course.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span>{course.lessons} lessons</span>
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {course.students.toLocaleString()} students enrolled
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button className="w-full" asChild>
                <Link to="/resources/courses">Browse All Courses</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardHeader>
            <CardTitle>Need Professional Support?</CardTitle>
            <CardDescription>
              Sometimes professional guidance can make all the difference in your healing journey
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/resources/professional">Crisis Hotlines</Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/resources/professional">Professional Resources</Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/resources/professional">Support Groups</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/books" element={<BooksPage />} />
      <Route path="/professional" element={<ProfessionalHelpPage />} />
      {/* Additional routes can be added here */}
    </Routes>
  );
}