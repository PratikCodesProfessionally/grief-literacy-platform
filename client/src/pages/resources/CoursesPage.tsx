import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Lock, CheckCircle, Clock, Users, BookOpen, Award, AlertTriangle } from 'lucide-react';

export function CoursesPage() {
  const [enrolledCourses, setEnrolledCourses] = React.useState<Set<number>>(new Set());
  const [completedLessons, setCompletedLessons] = React.useState<{[key: string]: number}>({});
  const [selectedCourse, setSelectedCourse] = React.useState<number | null>(null);
  const [currentLesson, setCurrentLesson] = React.useState<number>(0);

  const courses = [
    {
      id: 1,
      title: 'Understanding Grief Stages',
      instructor: 'Dr. Sarah Chen (AI Generated)',
      duration: '2 hours',
      lessons: 8,
      students: 1247,
      rating: 4.8,
      description: 'Learn about different models of grief and how they apply to your experience. Explore the non-linear nature of grief and discover healthy coping strategies.',
      level: 'Beginner',
      category: 'Foundation',
      objectives: [
        'Understand the 5 stages of grief model',
        'Learn about alternative grief models',
        'Recognize grief is not linear',
        'Develop personal coping strategies'
      ],
      lessons_content: [
        'Introduction to Grief Science',
        'The Kübler-Ross Model Explained',
        'Beyond the 5 Stages: Modern Understanding',
        'Anticipatory Grief',
        'Complicated vs Normal Grief',
        'Cultural Perspectives on Grief',
        'Building Your Support Network',
        'Creating Your Personal Grief Plan'
      ]
    },
    {
      id: 2,
      title: 'Grief in Different Cultures',
      instructor: 'Prof. Maria Rodriguez (AI Generated)',
      duration: '1.5 hours',
      lessons: 6,
      students: 892,
      rating: 4.9,
      description: 'Explore how different cultures around the world understand and process grief. Gain perspective on mourning rituals and healing practices.',
      level: 'Intermediate',
      category: 'Cultural',
      objectives: [
        'Explore global grief traditions',
        'Understand cultural mourning rituals',
        'Learn from indigenous wisdom',
        'Apply cross-cultural insights'
      ],
      lessons_content: [
        'Western vs Eastern Grief Concepts',
        'African Mourning Traditions',
        'Asian Philosophical Approaches',
        'Indigenous Healing Practices',
        'Modern Multicultural Perspectives',
        'Integrating Cultural Wisdom'
      ]
    },
    {
      id: 3,
      title: 'Supporting Others in Grief',
      instructor: 'Dr. Michael Thompson (AI Generated)',
      duration: '3 hours',
      lessons: 12,
      students: 2156,
      rating: 4.7,
      description: 'How to offer meaningful support to friends and family who are grieving. Learn what to say, what not to say, and how to be present.',
      level: 'Advanced',
      category: 'Support',
      objectives: [
        'Learn effective communication skills',
        'Understand what grieving people need',
        'Avoid common support mistakes',
        'Build long-term support strategies'
      ],
      lessons_content: [
        'The Art of Presence',
        'What Not to Say to Grieving People',
        'Active Listening Techniques',
        'Supporting Children in Grief',
        'Helping with Practical Needs',
        'Recognizing When to Seek Professional Help',
        'Supporting Different Types of Loss',
        'Self-Care for Supporters',
        'Creating Ongoing Support',
        'Anniversary and Holiday Support',
        'Group Support Dynamics',
        'Building Community Resources'
      ]
    },
    {
      id: 4,
      title: 'Grief in the Body: Where It Lives, How to Release It',
      instructor: 'Dr. Lisa Park (AI Generated)',
      duration: '2.5 hours',
      lessons: 10,
      students: 1673,
      rating: 4.9,
      description: 'Understand how grief manifests physically and learn somatic techniques for healing. Explore breathwork, movement, and body-based therapies.',
      level: 'Intermediate',
      category: 'Somatic',
      objectives: [
        'Recognize physical grief symptoms',
        'Learn body-based healing techniques',
        'Practice breathwork for grief',
        'Develop embodied coping skills'
      ],
      lessons_content: [
        'The Neuroscience of Grief',
        'Physical Symptoms of Grief',
        'Breathwork for Emotional Release',
        'Movement and Grief Processing',
        'Yoga for Bereavement',
        'Tension Release Techniques',
        'Sleep and Grief Recovery',
        'Nutrition for Emotional Healing',
        'Creating Body Awareness',
        'Building Your Somatic Toolkit'
      ]
    }
  ];

  const enrollInCourse = (courseId: number) => {
    setEnrolledCourses(new Set([...enrolledCourses, courseId]));
    setCompletedLessons({...completedLessons, [courseId]: 0});
  };

  const startCourse = (courseId: number) => {
    setSelectedCourse(courseId);
    setCurrentLesson(0);
  };

  const completeLesson = (courseId: number) => {
    const currentProgress = completedLessons[courseId] || 0;
    const course = courses.find(c => c.id === courseId);
    if (course && currentProgress < course.lessons) {
      setCompletedLessons({
        ...completedLessons,
        [courseId]: currentProgress + 1
      });
      if (currentLesson < course.lessons - 1) {
        setCurrentLesson(currentLesson + 1);
      }
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Foundation': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Cultural': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Support': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Somatic': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getProgress = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    const completed = completedLessons[courseId] || 0;
    return course ? (completed / course.lessons) * 100 : 0;
  };

  if (selectedCourse) {
    const course = courses.find(c => c.id === selectedCourse);
    if (!course) return null;

    const currentLessonContent = course.lessons_content[currentLesson];
    const isLastLesson = currentLesson === course.lessons - 1;
    const progress = getProgress(selectedCourse);

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedCourse(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {course.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Lesson {currentLesson + 1} of {course.lessons}
            </p>
          </div>
        </div>

        {/* AI Generated Content Disclaimer */}
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200">AI Generated Educational Content</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  This course content is generated by AI for educational purposes. While based on established grief research, 
                  please consult with qualified professionals for personalized advice and treatment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{currentLessonContent}</span>
              <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
            </CardTitle>
            <CardDescription>
              Lesson {currentLesson + 1}: {currentLessonContent}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(progress)}% Complete ({completedLessons[selectedCourse] || 0} of {course.lessons} lessons)
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-blue-600" />
                <span>Lesson Content (AI Generated)</span>
                <span className="text-sm font-normal text-gray-500">(Simulated Duration: 12:34)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-6">
                <div className="text-center text-white">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">AI Generated Lesson: {currentLessonContent}</p>
                  <p className="text-sm opacity-75">Simulated Duration: 12:34</p>
                  <p className="text-xs opacity-60 mt-2">This is a demonstration of AI-generated educational content</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Lesson Overview</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    In this AI-generated lesson, we'll explore the key concepts around {currentLessonContent.toLowerCase()}. 
                    You'll learn practical strategies and gain insights that will help you on your grief journey.
                    This content is created by AI based on established grief research and therapeutic approaches.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Key Takeaways (AI Generated)</h3>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Understanding the fundamentals of {currentLessonContent.toLowerCase()}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Practical applications in your daily life</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Tools and techniques for implementation</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Evidence-based approaches to grief healing</span>
                    </li>
                  </ul>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    onClick={() => completeLesson(selectedCourse)}
                    disabled={currentLesson >= (completedLessons[selectedCourse] || 0)}
                  >
                    {isLastLesson ? 'Complete Course' : 'Mark as Complete & Continue'}
                  </Button>
                  {currentLesson > 0 && (
                    <Button variant="outline" onClick={() => setCurrentLesson(currentLesson - 1)}>
                      Previous Lesson
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {course.lessons_content.map((lesson, index) => (
                  <div 
                    key={index}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                      index === currentLesson 
                        ? 'bg-blue-100 dark:bg-blue-900/20' 
                        : index < (completedLessons[selectedCourse] || 0)
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      if (index <= (completedLessons[selectedCourse] || 0)) {
                        setCurrentLesson(index);
                      }
                    }}
                  >
                    {index < (completedLessons[selectedCourse] || 0) ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : index === currentLesson ? (
                      <Play className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={`text-sm ${
                      index <= (completedLessons[selectedCourse] || 0) 
                        ? 'text-gray-900 dark:text-gray-100' 
                        : 'text-gray-500'
                    }`}>
                      {lesson}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            Grief Literacy Courses
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            AI-generated courses to deepen your understanding of grief and healing
          </p>
        </div>
      </div>

      {/* AI Disclaimer */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200">AI Generated Content Notice</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                All courses, instructors, and lesson content are generated by AI for demonstration purposes. 
                The information is based on established grief research but should not replace professional counseling or therapy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {enrolledCourses.size > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <span>Your Learning Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(enrolledCourses).map(courseId => {
                const course = courses.find(c => c.id === courseId);
                const progress = getProgress(courseId);
                if (!course) return null;
                
                return (
                  <Card key={courseId} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getCategoryColor(course.category)}>
                          {course.category}
                        </Badge>
                        <Badge className={getLevelColor(course.level)}>
                          {course.level}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>{completedLessons[courseId] || 0} of {course.lessons} lessons</span>
                          <span>{Math.round(progress)}% complete</span>
                        </div>
                        <Button 
                          className="w-full"
                          onClick={() => startCourse(courseId)}
                        >
                          {progress > 0 ? 'Continue Learning' : 'Start Course'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {courses.map((course) => {
          const isEnrolled = enrolledCourses.has(course.id);
          const progress = getProgress(course.id);
          
          return (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        by {course.instructor}
                      </p>
                    </div>
                    {isEnrolled && progress === 100 && (
                      <Award className="h-6 w-6 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getCategoryColor(course.category)}>
                      {course.category}
                    </Badge>
                    <Badge className={getLevelColor(course.level)}>
                      {course.level}
                    </Badge>
                  </div>
                  
                  <CardDescription>{course.description}</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span>{course.lessons} lessons</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{course.students.toLocaleString()} students</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-500">★</span>
                    <span>{course.rating}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">What you'll learn:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {course.objectives.slice(0, 3).map((objective, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isEnrolled ? (
                  <div className="space-y-3">
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(progress)}% Complete
                      </span>
                      <Button onClick={() => startCourse(course.id)}>
                        {progress > 0 ? 'Continue' : 'Start Course'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="w-full"
                    onClick={() => enrollInCourse(course.id)}
                  >
                    Enroll in Course
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
