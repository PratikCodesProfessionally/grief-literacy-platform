import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Lock, CheckCircle, Clock, BookOpen, Award, AlertTriangle } from 'lucide-react';

/**
 * CoursesPage
 * -----------
 * Architektur-Überblick:
 * - Die Seite zeigt eine Liste von Kursen, die der Nutzer belegen kann.
 * - Jeder Kurs hat Metadaten (Titel, Dauer, Level, Kategorie, Lernziele, Lektionen).
 * - "Coming Soon"-Kurse sind deaktiviert und zeigen einen Hinweis.
 * - State-Management erfolgt mit React useState für:
 *   - eingeschriebene Kurse
 *   - Fortschritt pro Kurs
 *   - aktuell ausgewählten Kurs und Lektion
 * - Die UI ist modular aufgebaut mit Card-Komponenten für Übersicht und Details.
 * - Fortschritt wird als Prozentwert und Balken angezeigt.
 * - Die Seite ist so gestaltet, dass sie einfach erweiterbar ist (z.B. für echte Kursdaten, API-Anbindung).
 */

export function CoursesPage() {
  // State: Welche Kurse sind eingeschrieben?
  const [enrolledCourses, setEnrolledCourses] = React.useState<Set<number>>(new Set());
  // State: Wie viele Lektionen sind pro Kurs abgeschlossen?
  const [completedLessons, setCompletedLessons] = React.useState<{[key: string]: number}>({});
  // State: Welcher Kurs ist gerade ausgewählt?
  const [selectedCourse, setSelectedCourse] = React.useState<number | null>(null);
  // State: Welche Lektion ist im ausgewählten Kurs aktiv?
  const [currentLesson, setCurrentLesson] = React.useState<number>(0);

  /**
   * Kursdatenmodell:
   * - Jeder Kurs hat ein "comingSoon"-Feld für zukünftige Kurse.
   * - Die Felder "students" und "rating" sind entfernt.
   * - "lessons_content" enthält die Titel der einzelnen Lektionen.
   */
  const courses = [
    {
      id: 1,
      title: 'Understanding Grief Stages',
      duration: '2 hours',
      lessons: 8,
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
      ],
      comingSoon: false
    },
    {
      id: 2,
      title: 'Grief in Different Cultures',
      duration: '1.5 hours',
      lessons: 6,
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
      ],
      comingSoon: false
    },
    {
      id: 3,
      title: 'Supporting Others in Grief',
      duration: '3 hours',
      lessons: 12,
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
      ],
      comingSoon: false
    },
    {
      id: 4,
      title: 'Grief in the Body: Where It Lives, How to Release It',
      duration: '2.5 hours',
      lessons: 10,
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
      ],
      comingSoon: false
    },
    {
      id: 5,
      title: 'Grief and Creativity',
      duration: '1 hour',
      lessons: 5,
      description: 'Discover how creative expression can support grief healing.',
      level: 'Beginner',
      category: 'Creativity',
      objectives: [],
      lessons_content: [],
      comingSoon: true // Dieser Kurs ist noch nicht verfügbar
    }
  ];

  // Funktion: Nutzer in Kurs einschreiben
  const enrollInCourse = (courseId: number) => {
    setEnrolledCourses(new Set([...enrolledCourses, courseId]));
    setCompletedLessons({...completedLessons, [courseId]: 0});
  };

  // Funktion: Kurs starten (Details und Lektionen anzeigen)
  const startCourse = (courseId: number) => {
    setSelectedCourse(courseId);
    setCurrentLesson(0);
  };

  // Funktion: Lektion als abgeschlossen markieren und ggf. zur nächsten springen
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

  // Utility: Farbgebung für Level-Badge
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Utility: Farbgebung für Kategorie-Badge
  const getCategoryColor = (category: string) => {
    const colors = {
      'Foundation': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Cultural': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Support': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Somatic': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'Creativity': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Utility: Fortschritt als Prozentwert berechnen
  const getProgress = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    const completed = completedLessons[courseId] || 0;
    return course ? (completed / course.lessons) * 100 : 0;
  };

  /**
   * Detailansicht für einen Kurs:
   * - Zeigt Lektionen, Fortschritt und einen Disclaimer.
   * - "Coming Soon"-Kurse zeigen nur einen Hinweis.
   */
  if (selectedCourse) {
    const course = courses.find(c => c.id === selectedCourse);
    if (!course) return null;

    // Wenn Kurs noch nicht verfügbar ist
    if (course.comingSoon) {
      return (
        <div className="space-y-6">
          <Button variant="outline" size="sm" onClick={() => setSelectedCourse(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <Card className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 border-pink-300 dark:border-pink-700">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100" style={{ WebkitFontSmoothing: 'antialiased', fontWeight: 600 }}>{course.title}</CardTitle>
              <CardDescription>
                <span className="text-pink-700 dark:text-pink-300 font-bold" style={{ WebkitFontSmoothing: 'antialiased' }}>Coming Soon</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 dark:text-gray-100 mb-4 font-medium" style={{ WebkitFontSmoothing: 'antialiased', lineHeight: '1.7' }}>
                This course will help you discover how creative expression can support grief healing.
              </p>
              <div className="flex items-center space-x-2">
                <Badge className={getCategoryColor(course.category)}>
                  {course.category}
                </Badge>
                <Badge className={getLevelColor(course.level)}>
                  {course.level}
                </Badge>
              </div>
              <div className="mt-6 text-sm text-gray-700 dark:text-gray-300 font-medium">
                Please check back soon for updates!
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Kurs ist verfügbar: Detailansicht mit Lektionen
    const currentLessonContent = course.lessons_content[currentLesson];
    const isLastLesson = currentLesson === course.lessons - 1;
    const progress = getProgress(selectedCourse);

    return (
      <div className="space-y-6">
        {/* Navigation zurück */}
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

        {/* Hinweis: AI-generierter Inhalt */}
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

        {/* Lektion und Fortschritt */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-blue-300 dark:border-blue-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-gray-900 dark:text-gray-100" style={{ WebkitFontSmoothing: 'antialiased', fontWeight: 600 }}>
              <span>{currentLessonContent}</span>
              <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
            </CardTitle>
            <CardDescription className="text-gray-800 dark:text-gray-200 font-medium" style={{ WebkitFontSmoothing: 'antialiased' }}>
              Lesson {currentLesson + 1}: {currentLessonContent}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
              {Math.round(progress)}% Complete ({completedLessons[selectedCourse] || 0} of {course.lessons} lessons)
            </div>
          </CardContent>
        </Card>

        {/* Lektionen-Navigation und Übersicht */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Hauptinhalt der Lektion */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-blue-600" />
                <span>Lesson Content (AI Generated)</span>
                {/* Removed simulated duration text */}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-6">
                {(() => {
                  console.log('Current Lesson Content:', currentLessonContent);
                  if (currentLessonContent === 'Introduction to Grief Science') {
                    return (
                      <div className="w-full">
                        <video
                          key={currentLessonContent}
                          className="w-full h-full rounded-lg mb-4"
                          controls
                          poster="/assets/lesson1-poster.png"
                        >
                          <source src="/videos/IntroductionToGriefScience.mp4" type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    );
                  } else if (currentLessonContent === 'The Kübler-Ross Model Explained') {
                    return (
                      <div className="w-full">
                        <video
                          key={currentLessonContent}
                          className="w-full h-full rounded-lg mb-4"
                          controls
                          poster="/assets/lesson2-poster.png"
                        >
                          <source src="/videos/TheKueblerRossModelExplained.mp4" type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    );
                  } else if (currentLessonContent === 'Beyond the 5 Stages: Modern Understanding') {
                    return (
                      <div className="w-full">
                        <video
                          key={currentLessonContent}
                          className="w-full h-full rounded-lg mb-4"
                          controls
                          poster="/assets/lesson3-poster.png"
                        >
                          <source src="/videos/BeyondThe5Stages.mp4" type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    );
                  } else if (currentLessonContent === 'Anticipatory Grief') {
                    return (
                      <div className="w-full">
                        <video
                          key={currentLessonContent}
                          className="w-full h-full rounded-lg mb-4"
                          controls
                          poster="/assets/lesson4-poster.png"
                        >
                          <source src="/videos/Lesson4 AnticipatoryGrief.mp4" type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    );
                  } else if (currentLessonContent === 'Complicated vs Normal Grief') {
                    return (
                      <div className="w-full">
                        <video
                          key={currentLessonContent}
                          className="w-full h-full rounded-lg mb-4"
                          controls
                          poster="/assets/lesson5-poster.png"
                        >
                          <source src="/videos/NormalvscomplicatedGrief.mp4" type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    );
                  } else if (currentLessonContent === 'Cultural Perspectives on Grief') {
                    return (
                      <div className="w-full">
                        <video
                          key={currentLessonContent}
                          className="w-full h-full rounded-lg mb-4"
                          controls
                          poster="/assets/lesson6-poster.png"
                        >
                          <source src="/videos/CulturalPerspectivesOnGrief.mp4" type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    );
                  } else if (currentLessonContent === 'Building Your Support Network') {
                    return (
                      <div className="w-full">
                        <video
                          key={currentLessonContent}
                          className="w-full h-full rounded-lg mb-4"
                          controls
                          poster="/assets/lesson7-poster.png"
                        >
                          <source src="/videos/BuildingYourSupportNetwork.mp4" type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-center text-white">
                        <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">AI Generated Lesson: {currentLessonContent}</p>
                        <p className="text-xs opacity-60 mt-2">This is a demonstration of AI-generated educational content</p>
                      </div>
                    );
                  }
                })()}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Lesson Overview</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    In this AI-generated lesson, we'll explore the key concepts around {currentLessonContent.toLowerCase()}.
                    You'll learn practical strategies and gain insights that will help you on your grief journey.
                    This content is created by AI based on established grief research and therapeutic approaches.
                  </p>
                  {currentLessonContent === 'Introduction to Grief Science' && (
                    <img
                      src="/Images/IntroductionToGriefScienceInfographic.png"
                      alt="Infographic: Introduction to Grief Science"
                      className="w-full max-w-full sm:max-w-2xl mx-auto rounded-lg shadow-md border my-6"
                    />
                  )}
                  {currentLessonContent === 'The Kübler-Ross Model Explained' && (
                    <img
                      src="/Images/TheKueblerRossModelExplainedInfographic.png"
                      alt="Infographic: The Kübler-Ross Model Explained"
                      className="w-full max-w-full sm:max-w-2xl mx-auto rounded-lg shadow-md border my-6"
                    />
                  )}
                  {currentLessonContent === 'Beyond the 5 Stages: Modern Understanding' && (
                    <img
                      src="/Images/BeyondThe5Stages.png"
                      alt="Infographic: Beyond the 5 Stages: Modern Understanding"
                      className="w-full max-w-full sm:max-w-2xl mx-auto rounded-lg shadow-md border my-6"
                    />
                  )}
                  {currentLessonContent === 'Anticipatory Grief' && (
                    <img
                      src="/Images/AnticipatoryGrief.png"
                      alt="Infographic: Anticipatory Grief"
                      className="w-full max-w-full sm:max-w-2xl mx-auto rounded-lg shadow-md border my-6"
                    />
                  )}
                  {currentLessonContent === 'Complicated vs Normal Grief' && (
                    <>
                      <img
                        src="/Images/NormalvsComplicatedGrief.png"
                        alt="Infographic: Normal vs Complicated Grief - Part 1"
                        className="w-full max-w-full sm:max-w-2xl mx-auto rounded-lg shadow-md border my-6"
                      />
                      <img
                        src="/Images/NormalvsComplicatedGrief2.png"
                        alt="Infographic: Normal vs Complicated Grief - Part 2"
                        className="w-full max-w-full sm:max-w-2xl mx-auto rounded-lg shadow-md border my-6"
                      />
                    </>
                  )}
                  {currentLessonContent === 'Cultural Perspectives on Grief' && (
                    <img
                      src="/Images/CulturalPerspectivesOnGrief.png"
                      alt="Infographic: Cultural Perspectives on Grief"
                      className="w-full max-w-full sm:max-w-2xl mx-auto rounded-lg shadow-md border my-6"
                    />
                  )}
                  {currentLessonContent === 'Building Your Support Network' && (
                    <img
                      src="/Images/BuildingYourSupportNetwork.png"
                      alt="Infographic: Building Your Support Network"
                      className="w-full max-w-full sm:max-w-2xl mx-auto rounded-lg shadow-md border my-6"
                    />
                  )}
                  {currentLessonContent === 'Introduction to Grief Science' && (
                    <p className="text-gray-700 dark:text-gray-300 mt-4">
                      Modern research suggests that grieving is a complex, biopsychosocial process that involves a dynamic interplay between the mind, brain, and body. Scientists have identified Prolonged Grief Disorder (PGD) as a specific condition where the brain’s reward and attachment systems, particularly the nucleus accumbens and amygdala, remain intensely activated by a "craving" for the deceased. To adapt healthily, individuals often move through a Dual Process Model, which involves oscillating between confronting the emotional pain of the loss and attending to the practical demands of restoring their daily lives. While neurobiological studies highlight how inflammation and neural pathways change after a death, community-sourced advice emphasizes practical coping through mindfulness, social support, and creative outlets. Ultimately, these sources illustrate that resilience is common, but recovery requires a balance of emotional processing and periods of respite from the intensity of grief.
                    </p>
                  )}
                  {currentLessonContent === 'The Kübler-Ross Model Explained' && (
                    <>
                      <p className="text-gray-700 dark:text-gray-300 mt-4">
                        These sources examine the evolution of death and grieving in modern society, tracing the shift from traditional home-based care to institutionalized medical environments. Influential figures like Elisabeth Kübler-Ross have shown how the rise of advanced medical technology contributed to a denial of mortality among physicians, who often perceived death as a professional failure. In response, the hospice movement emerged, aiming to restore dignity through palliative care and holistic support for the terminally ill. Contemporary psychological frameworks now challenge the notion of a linear "five stages of grief," proposing instead that mourning is a complex, oscillating process involving both confronting loss and restoring daily life. Additionally, researchers highlight the importance of cultural rituals and digital memorials in providing essential structures for emotional regulation and communal healing. Practical guidance for educational script writing further emphasizes the need for clear, conversational communication when addressing these sensitive topics.
                      </p>
                      <div className="text-gray-700 dark:text-gray-300 mt-4 space-y-2 break-words">
                        <p>
                          The five stages of grief, originally developed by psychiatrist Elisabeth Kübler-Ross in her 1969 book <em>On Death and Dying</em>, are Denial, Anger, Bargaining, Depression, and Acceptance. Although these stages—often abbreviated as DABDA—are now widely used to describe the experiences of the bereaved, they were originally formulated to describe the emotional journey of terminally ill patients coming to terms with their own impending death.
                        </p>
                        <p>The five stages, as experienced by patients facing mortality, are:</p>
                        <ul className="list-disc pl-6">
                          <li><strong>Denial:</strong> This serves as an initial defense mechanism to help the individual survive the shock of a terminal diagnosis. Patients may believe there has been a mistake or that the news simply isn't true.</li>
                          <li><strong>Anger:</strong> As the reality of the situation sinks in, the patient may manifest feelings of fear or rage, often asking "Why me?" and directing this anger toward doctors, family, or their own faith.</li>
                          <li><strong>Bargaining:</strong> In this stage, patients often try to negotiate or find a path of least objection to salvage the situation. This might involve internal promises or pleas to a higher power in an attempt to delay the inevitable or "bargain" for more time.</li>
                          <li><strong>Depression:</strong> When the patient can no longer ignore the reality of their condition, they may experience extreme sadness, apathy, and demotivation. This stage reflects the loss of hope as they face the end of their life as they knew it.</li>
                          <li><strong>Acceptance:</strong> The final stage is reached when the individual comes to terms with the change and their inhibitions are lowered. For a dying patient, this is the stage of finding clarity and peace with their mortality.</li>
                        </ul>
                        <p>
                          While these stages have become a cultural icon, the sources emphasize that they were never intended to be a strict linear sequence. Patients may skip stages, revisit them, or experience multiple emotions simultaneously. Furthermore, modern grief experts like David Kessler have since proposed a sixth stage: <strong>Finding Meaning</strong>, which focuses on how individuals heal by finding purpose in loss.
                        </p>
                      </div>
                    </>
                  )}
                  {currentLessonContent === 'Beyond the 5 Stages: Modern Understanding' && (
                    <div className="text-gray-700 dark:text-gray-300 mt-4 space-y-2 break-words">
                      <p>
                        Contemporary psychology has moved away from linear stage-based models, such as the Kübler-Ross five-stage model, which are now criticized for being empirically unsupported and potentially harmful if they lead mourners to believe they are "grieving wrong". Modern frameworks instead emphasize dynamic, non-linear processes and the reconstruction of meaning.
                      </p>
                      <p>The following modern grief models are supported by the sources:</p>
                      <ol className="list-decimal pl-6 space-y-2">
                        <li>
                          <strong>The Dual Process Model (DPM)</strong><br/>
                          <em>Scientific Source: Margaret Stroebe and Henk Schut (1999).</em><br/>
                          <span>This model describes a healthy grieving process as a dynamic oscillation between two types of activities:</span>
                          <ul className="list-disc pl-6">
                            <li><strong>Loss-Oriented:</strong> Focusing on the grief itself, such as crying, looking at photos, and processing the pain of the bond.</li>
                            <li><strong>Restoration-Oriented:</strong> Attending to life changes, such as mastering new tasks the deceased used to handle, developing a new identity, and finding distractions from the pain.</li>
                            <li>Mourners do not just "complete" grief but move back and forth between these modes to adjust to their new reality.</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Continuing Bonds Theory</strong><br/>
                          <em>Scientific Source: Klass, Silverman, and Nickman (1996).</em><br/>
                          <span>Contrary to earlier beliefs that mourners must "let go" or seek "closure," this theory suggests that it is healthy and normal to maintain a continued psychological relationship with the deceased. This may involve talking to the deceased, preserving digital legacies on social media, or incorporating their memory into daily life.</span>
                        </li>
                        <li>
                          <strong>The Tasks of Mourning</strong><br/>
                          <em>Scientific Source: J. William Worden (1991/2009).</em><br/>
                          <span>Worden frames grief as an active process involving four essential tasks that a person must "undertake" rather than passively endure:</span>
                          <ol className="list-decimal pl-6">
                            <li>Accepting the reality of the loss.</li>
                            <li>Processing the pain of grief.</li>
                            <li>Adjusting to a world without the deceased (internal, external, and spiritual adjustments).</li>
                            <li>Finding an enduring connection with the deceased while embarking on a new life.</li>
                          </ol>
                        </li>
                        <li>
                          <strong>Meaning Reconstruction Model</strong><br/>
                          <em>Scientific Source: Robert Neimeyer (2001).</em><br/>
                          <span>This model views grief as a process of rebuilding a shattered sense of identity and worldview. Because a major loss can make the world feel like it no longer makes sense, the bereaved must gradually reconstruct their understanding of themselves and their purpose to live meaningfully in a changed world.</span>
                        </li>
                        <li>
                          <strong>Resilience Trajectory Model</strong><br/>
                          <em>Scientific Source: George Bonanno (2004).</em><br/>
                          <span>Bonanno’s research highlights that resilience is the most common outcome following a loss. Unlike the "recovery" model (where functioning drops and slowly returns), the resilience trajectory shows a stable equilibrium where individuals continue to experience positive emotions and maintain functioning despite transient waves of grief.</span>
                        </li>
                        <li>
                          <strong>Tonkin’s Model (Growing Around Grief)</strong><br/>
                          <em>Scientific Source: Lois Tonkin (1996).</em><br/>
                          <span>Often described through the visual of a circle, this model suggests that grief does not shrink over time. Instead, the grief remains the same size, but the person’s life grows larger around it as they gain new experiences, relationships, and roles.</span>
                        </li>
                        <li>
                          <strong>Two-Track Model of Bereavement</strong><br/>
                          <em>Scientific Source: Simon Shimshon Rubin (1981).</em><br/>
                          <span>This model assesses grief along two separate but related axes:</span>
                          <ul className="list-disc pl-6">
                            <li><strong>Track I:</strong> Biopsychosocial functioning, focusing on symptoms like anxiety, depression, and disruptions in work or social life.</li>
                            <li><strong>Track II:</strong> The nature of the ongoing relational bond with the deceased, including preoccupation, imagery, and the transformation of the attachment.</li>
                          </ul>
                        </li>
                      </ol>
                      <p>
                        Modern grief is less like a staircase where you finish one step to reach the next, and more like learning to walk in a new landscape; you may stumble back into old patterns of sadness (oscillation), but over time, the paths you build for yourself (restoration) become more familiar even as the original landmark of your loss remains.
                      </p>
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-4">Summary Table of Differences</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-600">
                            <thead>
                              <tr className="bg-gray-100 dark:bg-gray-700">
                                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold">Feature</th>
                                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold">Dual Process Model (DPM)</th>
                                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold">Meaning Reconstruction</th>
                                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold">Continuing Bonds</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="bg-white dark:bg-gray-800">
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium">Primary Mechanism</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Oscillation between loss and restoration.</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Rebuilding a shattered worldview.</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Maintaining an ongoing connection.</td>
                              </tr>
                              <tr className="bg-gray-50 dark:bg-gray-700">
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium">Key Question</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">How do I balance my pain with my new responsibilities?</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">How do I make sense of my life now that this has happened?</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">How can I keep this person with me as I move forward?</td>
                              </tr>
                              <tr className="bg-white dark:bg-gray-800">
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium">View of "Closure"</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Unnecessary; focuses on "dosage" and adjustment.</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Viewed as a process of narrative integration.</td>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">Rejects the idea of "letting go" or "closure".</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                  {currentLessonContent === 'Anticipatory Grief' && (
                    <div className="text-gray-700 dark:text-gray-300 mt-4 space-y-2 sm:space-y-4 break-words">
                      <p>
                        Anticipatory grief is an emotional and physical response that occurs before a loss actually happens, typically following a terminal diagnosis or the onset of a progressive, life-limiting condition. It is often described as an "action state" of engagement in grief work, where individuals begin mourning, coping, and planning their lives in response to an impending loss while the person is still physically present. While most commonly associated with caregivers and family members, it is also experienced by the dying individuals themselves, a process sometimes specified as preparatory grief.
                      </p>
                      <p>
                        Anticipatory grief differs from conventional (post-loss) grief in several fundamental ways:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Temporal Orientation:</strong> Conventional grief is reactive, occurring as a direct consequence of a death that has already taken place. In contrast, anticipatory grief is often proactive and future-oriented, focused on feared or anticipated losses, such as a future without the loved one's physical presence.</li>
                        <li><strong>The "Rollercoaster" of Hope:</strong> Unlike the more linear adjustment sometimes seen after a loss, anticipatory grief is often described as a "rollercoaster". Grievers may oscillate between intense distress and periods of normalcy, often because they are simultaneously clinging to hope for a cure or a "miracle" while trying to accept the reality of the diagnosis.</li>
                        <li><strong>Present vs. Future Losses:</strong> Anticipatory grief often overlaps with illness-related grief, which is present-oriented. Grievers may mourn the "person that was" due to changes in personality or function (common in dementia), even though the individual is still alive.</li>
                        <li><strong>Nature of Emotions:</strong> Compared to conventional grief, anticipatory grief is frequently characterized by higher intensities of anger, loss of emotional control, and atypical grief responses. Grievers may feel "stuck in limbo," unsure how to process their emotions or prepare for an event that has not yet occurred.</li>
                        <li><strong>Impact on Post-Death Bereavement:</strong> A common fallacy is that grieving early "uses up" a fixed volume of grief, thereby reducing the intensity of mourning after the death. Research suggests that while anticipatory grief can help some individuals prepare and develop coping skills to "cushion" the bereavement reaction, it does not necessarily lessen the ultimate pain of the loss. In some cases, caregivers may become so close to the loved one during the illness that their post-loss grief is actually intensified.</li>
                      </ul>
                      <p>
                        Understanding these differences is vital for clinical support, as symptoms of anticipatory grief are frequently disguised as depression or anxiety. Facilitating this process through professional counseling or legacy projects can help individuals find a sense of closure and meaning before the final separation occurs.
                      </p>
                      <p className="italic">
                        Analogy: If conventional grief is the wreckage left behind after a storm has passed, anticipatory grief is the tension and preparation felt while watching the clouds gather on the horizon—you are already dealing with the wind and rain of the person's decline, all while bracing for the impact of the storm that you know is coming but has not yet arrived.
                      </p>
                      <p>
                        Caregivers and family members play a multifaceted role in the process of anticipatory grief, transitioning into a proactive "action state" of engagement in grief work while the loved one is still physically present. Their involvement is often characterized by a dual responsibility: they must manage complex caregiving duties—such as medical monitoring, personal care, and observing the patient—while simultaneously confronting the emotional reality of an impending loss. Family members, particularly spouses and children, often act as communication bridges between medical staff and the rest of the social network, which can lead to a sense of overwhelming responsibility. This period also involves a "rehearsal of death," where family members begin planning funeral arrangements, resolving unfinished business, and visualizing a future without the deceased. Additionally, they may participate in legacy projects, such as memory books or audio recordings, which help preserve the patient's essence and provide a therapeutic outlet for the family.
                      </p>
                      <p>
                        However, this role frequently has a profound impact on their mental and physical health:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Emotional and Psychological Distress:</strong> Caregivers often experience a "rollercoaster" of emotions, shifting between intense distress, anger, irritability, and periods of normalcy. Common reactions include separation anxiety, guilt, and a sense of helplessness regarding the patient's suffering.</li>
                        <li><strong>Cognitive Impact:</strong> The chronic stress of anticipation can lead to preoccupation with the dying person, forgetfulness, and difficulty concentrating or making critical medical and legal decisions.</li>
                        <li><strong>Physical Manifestations:</strong> Somatic responses often mirror those of post-death grief, including sleep disturbances, appetite changes, headaches, nausea, and chronic fatigue. Research indicates these individuals may exhibit low diurnal cortisol levels, a biological marker of chronic stress linked to immune issues.</li>
                        <li><strong>Role Entrapment:</strong> Caregivers often feel "trapped" in their caregiver identity, repressing their own personal needs and feelings ("How can I complain when he is the one dying?") to remain strong for the patient and other family members.</li>
                        <li><strong>Gender Vulnerability:</strong> Women are often more susceptible to the negative mental health outcomes of anticipatory grief, reporting higher intensities of depression and anxiety.</li>
                        <li><strong>Predictive Value for Bereavement:</strong> The extent of distress experienced before the death is a robust predictor of long-term functioning; high levels of pre-death grief increase the risk of developing prolonged grief disorder or clinical depression after the loss occurs. Interestingly, some studies suggest that post-bereavement reactions exist on a continuum with pre-loss mental health, meaning that pre-existing depression often independently affects how a caregiver reacts after the death.</li>
                      </ul>
                      <p>
                        Early screening and psychotherapeutic interventions, such as cognitive-behavioral therapy or narrative approaches, can help caregivers build emotional resilience and preparedness, which are the strongest protective factors against long-term somatization and chronic pain.
                      </p>
                      <p className="italic">
                        Analogy: For a caregiver, anticipatory grief is like running a marathon on shifting sand. While you are straining to carry the physical and medical weight of the patient, the "ground" of your emotional world is constantly moving—forcing you to adjust your footing between hope and reality, all while you are becoming physically exhausted by a race that has no clear finish line.
                      </p>
                    </div>
                  )}
                  {currentLessonContent === 'Complicated vs Normal Grief' && (
                    <div className="text-gray-700 dark:text-gray-300 mt-4 space-y-4 break-words">
                      <h4 className="text-lg font-semibold">What is Normal Grief?</h4>
                      <p>
                        Normal grief (often referred to as uncomplicated or adaptive grief) is defined as a natural, universal response and adaptive process following the loss of a loved one. It is characterized as a fluid and evolving process rather than a static emotional state, typically involving an initial period of acute grief that gradually transitions into integrated or abiding grief as the individual adapts to the new reality. This process is not orderly or predictable; it often involves emotional oscillation where a person moves back and forth between focusing on their loss and re-engaging with daily life. While the experience is intensely painful, it is usually tolerable and self-limited, with most symptoms beginning to subside within six months to two years post-loss.
                      </p>
                      
                      <h5 className="font-semibold mt-4">Typical Manifestations of Normal Grief:</h5>
                      
                      <div className="ml-4 space-y-3">
                        <div>
                          <p className="font-medium">Emotional Manifestations</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Initial Shock and Numbness:</strong> Disbelief and emotional numbness are common immediately following an unexpected death.</li>
                            <li><strong>Primary Feelings:</strong> Profound sadness, sorrow, yearning, and longing for the deceased are hallmark reactions.</li>
                            <li><strong>Dysphoric States:</strong> Individuals may experience anger, guilt, fear, anxiety, shame, and helplessness.</li>
                            <li><strong>Positive Emotions:</strong> Adaptive grief also includes periods of relief, joy, or peace, which may co-occur with sadness.</li>
                            <li><strong>Grief Bursts:</strong> Short periods (20-30 minutes) of intense distress or pangs triggered by reminders or anniversaries.</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="font-medium">Cognitive Manifestations</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Preoccupation:</strong> Frequent, intrusive thoughts or preoccupying memories and images of the person who died.</li>
                            <li><strong>Confusion and Disorientation:</strong> A sense of confusion, brain fog, and difficulty making decisions or concentrating on tasks.</li>
                            <li><strong>Sensory Experiences:</strong> Feeling the presence of the deceased, having dreams of them, or experiencing fleeting illusions and hallucinations.</li>
                            <li><strong>Identity Issues:</strong> A state of depersonalization or uncertainty regarding one's identity and social role after the loss.</li>
                            <li><strong>Spiritual Inquiry:</strong> Questioning life goals or established spiritual and religious beliefs.</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="font-medium">Physical (Somatic) Manifestations</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Stress Response:</strong> Activation of the sympathetic nervous system ("fight or flight"), leading to hypervigilance.</li>
                            <li><strong>Sleep and Energy:</strong> Insomnia, sleep disturbances, a persistent lack of energy, or overwhelming fatigue.</li>
                            <li><strong>Gastrointestinal Distress:</strong> Feelings of hollowness or pain in the stomach, nausea, and digestive issues.</li>
                            <li><strong>Respiratory and Cardiac Symptoms:</strong> Tightness in the chest or throat, breathlessness, and heart palpitations.</li>
                            <li><strong>Musculoskeletal Pain:</strong> Headaches, migraines, back and neck pain, muscle weakness, or spasms.</li>
                            <li><strong>Appetite Changes:</strong> Significant weight loss or gain resulting from a reduction or increase in appetite.</li>
                          </ul>
                        </div>
                        
                        <div>
                          <p className="font-medium">Behavioral Manifestations</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Expressions of Distress:</strong> Frequent crying or sobbing.</li>
                            <li><strong>Social and Functional Withdrawal:</strong> Withdrawing from social interactions and a temporary drop in work or school productivity.</li>
                            <li><strong>Searching and Reminiscing:</strong> "Searching" behaviors, such as looking for the deceased in crowds or visiting places shared with them.</li>
                            <li><strong>Relationship to Reminders:</strong> Either avoiding reminders of the loss or conversely, compulsively seeking proximity through the deceased's photographs or belongings.</li>
                            <li><strong>Irritability:</strong> Becoming more aggressive, restless, or irritable than usual.</li>
                          </ul>
                        </div>
                      </div>
                      
                      <p className="italic bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        <strong>Analogy:</strong> Normal grief is like a physical wound. While it is initially raw, painful, and requires the body to redirect its energy toward healing, the wound eventually closes and leaves a scar. The scar remains a permanent part of the person, but it no longer prevents them from moving or functioning in their daily life.
                      </p>

                      <h4 className="text-lg font-semibold mt-6">What is Prolonged Grief Disorder (PGD)?</h4>
                      <p>
                        Prolonged Grief Disorder (PGD), formerly known as complicated grief, is defined as a severe and persistent bereavement response that disrupts adaptive functioning and is characterized by intense, long-lasting yearning for a deceased loved one. While normal grief is an adaptive process leading to integration of the loss, PGD represents a "derailment" of this transition, where the bereaved person remains stuck in a state of acute mourning.
                      </p>
                      
                      <h5 className="font-semibold mt-4">Diagnostic Comparison: DSM-5-TR vs ICD-11</h5>
                      <div className="overflow-x-auto mt-2">
                        <table className="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-600 text-sm">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">Criterion</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">DSM-5-TR (2022)</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">ICD-11 (2018)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Duration (Adults)</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">At least 12 months post-loss</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">At least 6 months post-loss</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Duration (Pediatrics)</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">At least 6 months post-loss</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Not specifically distinguished</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Core Symptoms</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Intense yearning/longing or preoccupation nearly every day</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Persistent and pervasive longing or cognitive preoccupation</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Associated Symptoms</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">At least 3 of 8 symptoms</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">At least 1 of 10 symptoms</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Cultural Caveat</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Must clearly exceed cultural norms</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Must markedly exceed cultural norms</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <h5 className="font-semibold mt-4">Key Distinctions from Normal Grief:</h5>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Persistence and Timing:</strong> Normal grief typically begins to lessen within six months to two years post-loss. In contrast, PGD is defined by symptoms that remain severe beyond the 6-month (ICD) or 12-month (DSM) mark.</li>
                        <li><strong>Intensity and Frequency:</strong> Feelings in normal grief often come and go in "waves" or "bursts" triggered by reminders. In PGD, the distress is pervasive and nearly constant, occurring "most days" or "nearly every day".</li>
                        <li><strong>Functional Disruption:</strong> While normal grief causes temporary social withdrawal, the bereaved eventually find a "new normal" and re-engage with life. PGD causes profound impairment that prevents the individual from recovering their own life.</li>
                        <li><strong>Nature of the Distress:</strong> PGD is uniquely characterized by "separation distress"—an addictive-like craving and intense yearning for the deceased—whereas normal grief focuses more on general sadness and mourning.</li>
                        <li><strong>Integration vs. Derailment:</strong> Normal grief is an adaptive, fluid process leading to integrated grief. PGD is viewed as an "inflamed" state where the healing process is halted or stuck.</li>
                      </ul>

                      <p className="italic bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg">
                        <strong>Analogy:</strong> If normal grief is like a physical wound that slowly closes and leaves a permanent but manageable scar, Prolonged Grief Disorder is like that same wound becoming inflamed or infected. While the body attempts to heal naturally, the infection prevents the wound from closing, requiring specialized intervention to restart the healing process.
                      </p>

                      <h4 className="text-lg font-semibold mt-6">Neurobiological Differences</h4>
                      <p>
                        Research has identified significant neurobiological differences between normal grief and complicated grief. PGD can be conceptualized as a reward dysfunction disorder where the lost attachment figure is processed by the brain similarly to an addictive substance.
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>The Nucleus Accumbens:</strong> This key structure in the brain's reward pathway shows hyperactivity in individuals with PGD when exposed to reminders of the deceased, reinforcing the biological "need" for the lost person.</li>
                        <li><strong>Persistent Craving:</strong> The core symptom of PGD—intense yearning—is viewed as a biological "craving" for the lost attachment figure.</li>
                        <li><strong>The Orbitofrontal Cortex:</strong> Enhanced activation has been found in this region, which is involved in processing rewards and social attachment.</li>
                        <li><strong>HPA Axis Dysfunction:</strong> PGD involves prolonged dysfunction of the hypothalamic-pituitary-adrenal axis, potentially leading to long-term physical health risks.</li>
                      </ul>

                      <p className="italic bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                        <strong>Analogy:</strong> Craving in complicated grief is like a GPS system stuck in a "recalculating" loop. The brain's reward center (the nucleus accumbens) keeps sending "drive" signals toward the old bridge (the deceased) because it still registers that person as the most rewarding destination, even though the path is permanently blocked.
                      </p>

                      <h4 className="text-lg font-semibold mt-6">Risk Factors for Complicated Grief</h4>
                      <div className="ml-4 space-y-3">
                        <div>
                          <p className="font-medium">Relationship Type and Attachment Style</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>Loss of a spouse, life partner, or child carries the highest risk</li>
                            <li>Relationships characterized by excessive dependency or ambivalence</li>
                            <li>Individuals with anxious attachment styles</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium">Circumstances of Death</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>Unnatural and violent deaths (homicide, suicide, accidents)</li>
                            <li>Sudden deaths without opportunity to say goodbye</li>
                            <li>Witnessing a difficult dying process</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium">Pre-existing Factors</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>History of mood or anxiety disorders</li>
                            <li>Previous trauma or multiple losses</li>
                            <li>Low perceived social support</li>
                          </ul>
                        </div>
                      </div>

                      <h4 className="text-lg font-semibold mt-6">Evidence-Based Treatment</h4>
                      <p>
                        The primary evidence-based intervention is <strong>Complicated Grief Treatment (CGT)</strong>, developed by Dr. M. Katherine Shear. This 16-session manualized protocol integrates techniques from CBT and Interpersonal Therapy.
                      </p>
                      <div className="ml-4 mt-2">
                        <p className="font-medium">Three Phases of CGT:</p>
                        <ol className="list-decimal pl-6 space-y-1">
                          <li><strong>Introductory (Sessions 1-3):</strong> Psychoeducation, establishing a "secure base" with the therapist</li>
                          <li><strong>Intermediate (Sessions 4-10):</strong> Imaginal Revisiting (narrating the death) and Situational Revisiting (gradual exposure to avoided reminders)</li>
                          <li><strong>Final (Sessions 11-16):</strong> Future planning, redefining the bond with the deceased</li>
                        </ol>
                      </div>

                      <p className="italic bg-green-50 dark:bg-green-900/30 p-4 rounded-lg mt-4">
                        <strong>Analogy:</strong> Standard grief counseling is like a supportive cast that helps a patient walk while a bone heals naturally. Treating Prolonged Grief Disorder with CGT is like a surgeon having to reset a bone that has healed incorrectly; the therapist must actively address the "stuck" parts of the memory to allow for proper functional recovery.
                      </p>

                      <h4 className="text-lg font-semibold mt-6">Self-Assessment: When to Seek Help</h4>
                      <p>Consider professional evaluation if, after 12 months, you experience:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Intense, daily longing that makes it hard to care about anything else</li>
                        <li>A precipitous drop in work productivity or inability to maintain daily routines</li>
                        <li>Feeling as though "a part of yourself died" with the loved one</li>
                        <li>Persistent inability to accept the finality of the loss</li>
                        <li>Using alcohol or drugs to numb the pain</li>
                        <li>Thoughts of wanting to die to be with the deceased</li>
                      </ul>

                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-4">
                        <p className="font-semibold">Important Message:</p>
                        <p className="mt-2">
                          It is vital not to pathologize normal grief because it is a universal human experience. However, recognizing when professional help is needed is equally critical because a significant minority experience a "derailment" of the natural healing process. Seeking evaluation is strength, not weakness.
                        </p>
                      </div>
                    </div>
                  )}
                  {currentLessonContent === 'Cultural Perspectives on Grief' && (
                    <div className="text-gray-700 dark:text-gray-300 mt-4 space-y-4 break-words">
                      <p>
                        While grief is a biological universal, the cognitive and emotional architecture through which loss is processed is deeply contingent upon cultural, religious, and philosophical socialization. Grief is defined broadly as a person's total response to loss, encompassing physical, emotional, cognitive, behavioral, and spiritual dimensions. <strong>Mourning</strong> represents the culturally accepted process through which these personal feelings are expressed.
                      </p>

                      <h4 className="text-lg font-semibold mt-6">Western vs. Non-Western Approaches</h4>
                      
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                          <h5 className="font-semibold mb-2">Western Conceptualizations</h5>
                          <ul className="list-disc pl-4 space-y-1 text-sm">
                            <li><strong>Linear Progression:</strong> Time viewed as "Newtonian"—grief is a "road to recovery" toward "closure"</li>
                            <li><strong>Stage-Based Models:</strong> Kübler-Ross model (denial, anger, bargaining, depression, acceptance)</li>
                            <li><strong>Private Expression:</strong> Individual reflection, personal eulogies, re-establishing a "new normal"</li>
                          </ul>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg">
                          <h5 className="font-semibold mb-2">Non-Western Approaches</h5>
                          <ul className="list-disc pl-4 space-y-1 text-sm">
                            <li><strong>The "Living Dead":</strong> Death as transition to ancestor status, not a final end</li>
                            <li><strong>Communal Participation:</strong> Aboriginal "Sorry Business," West African "nine-night" celebrations</li>
                            <li><strong>Cyclical View:</strong> Death integrated into recurring rhythms of life</li>
                          </ul>
                        </div>
                      </div>

                      <h5 className="font-semibold mt-4">Key Differences at a Glance</h5>
                      <div className="overflow-x-auto mt-2">
                        <table className="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-600 text-sm">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">Feature</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">Western Approach</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">Non-Western Approach</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Social Context</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Individualistic; private mourning</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Collectivist; communal transition</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Temporal View</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Linear; moving away from the loss</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Cyclical; integrated into recurring rhythms</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Goal of Grief</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Detachment and closure</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Continuing bonds and ancestral reverence</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Emotional Tone</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Solemn and introspective</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Can be vibrant and celebratory</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <p className="italic bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                        <strong>Analogy:</strong> The Western view of grief is like a one-way path that one must travel to leave the forest of sorrow behind; in contrast, many non-Western cultures view grief like a changing season—an inevitable part of a recurring cycle that connects the earth, the community, and the spirit world in a continuous, revolving loop.
                      </p>

                      <h4 className="text-lg font-semibold mt-6">Core Definitions</h4>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Bereavement:</strong> The objective state or period of suffering that follows the death of a loved one.</li>
                        <li><strong>Grief:</strong> The personal, internal emotional reactions—such as sadness, anger, and guilt—that follow a loss.</li>
                        <li><strong>Mourning:</strong> The external, culturally sanctioned process through which grief is expressed through rituals, dress codes, and behaviors.</li>
                      </ul>

                      <h4 className="text-lg font-semibold mt-6">Mourning Rituals Across Cultures</h4>
                      
                      <div className="space-y-3 ml-4">
                        <div>
                          <p className="font-medium">African Cultures</p>
                          <p className="text-sm">In Ghana, funerals are vibrant celebrations with dancing, drinking, and "fantasy coffins" representing the deceased's achievements. The Bukusu of Kenya practice animal slaughtering, head shaving, and river cleansing for widows.</p>
                        </div>
                        <div>
                          <p className="font-medium">East Asian Cultures</p>
                          <p className="text-sm">Influenced by Confucianism, mourning expresses filial piety (xiao) through soul tablets, merit-making, and sutra chanting during the 49-day bardo period.</p>
                        </div>
                        <div>
                          <p className="font-medium">Latin American Cultures</p>
                          <p className="text-sm">Día de los Muertos transforms mourning into joyful celebration. Families build ofrendas (altars) with favorite foods and marigolds to guide spirits home.</p>
                        </div>
                        <div>
                          <p className="font-medium">Indigenous Cultures</p>
                          <p className="text-sm">Aboriginal "Sorry Business" involves mandatory community participation lasting weeks or months. Many groups maintain taboos against speaking the name of the deceased.</p>
                        </div>
                      </div>

                      <h4 className="text-lg font-semibold mt-6">Religious Funeral Practices</h4>
                      <div className="overflow-x-auto mt-2">
                        <table className="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-600 text-sm">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">Religion</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">Primary Practices</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">Beliefs</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Christianity</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Burial; church services with prayers</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Linear life; resurrection</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Islam</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Immediate burial (24 hrs); body faces Mecca</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Acceptance of God's will (Qadar)</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Judaism</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Shiva (7-day mourning); community support</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Honoring the dead (kibud hamet)</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Hinduism</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Cremation; ashes in flowing water</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Reincarnation cycle</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Buddhism</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Sutra chanting; merit-making; cremation</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Impermanence (anicca); 49-day bardo</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <h4 className="text-lg font-semibold mt-6">Idioms of Distress</h4>
                      <p>
                        <strong>Idioms of distress</strong> are culturally specific ways individuals express psychological suffering. While Western cultures prioritize emotional symptoms (sadness, guilt), many collectivist societies express grief through somatic (physical) symptoms like heart pain or respiratory issues.
                      </p>
                      <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>Western Emotionalism:</strong> Grief as private psychological journey; verbalizing feelings to find "closure"</li>
                        <li><strong>Non-Western Somatization:</strong> Deep grief reported as physical ailments; head shaving, wailing, or river cleansing as physical outlets</li>
                        <li><strong>Malignant Grief:</strong> Suppressed grief that becomes "toxic," leading to chronic disease or loss of social function</li>
                      </ul>

                      <h4 className="text-lg font-semibold mt-6">Disenfranchised Grief</h4>
                      <p>
                        <strong>Disenfranchised grief</strong> occurs when a loss is not socially recognized or validated—leading to intense loneliness and shame. This happens through:
                      </p>
                      <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>Stigmatized deaths:</strong> Suicide, drug overdose, HIV/AIDS</li>
                        <li><strong>Unrecognized relationships:</strong> Same-sex partners, ex-spouses, extramarital relationships</li>
                        <li><strong>"Unimportant" losses:</strong> Miscarriage, pet loss</li>
                        <li><strong>Cultural bereavement:</strong> Loss of homeland, language, and ancestral rituals experienced by migrants</li>
                      </ul>

                      <p className="italic bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg mt-4">
                        <strong>Analogy:</strong> Imagine the community as a library with official shelves for "Approved Sorrows." When you suffer a disenfranchised loss, you are left holding a book the library refuses to recognize—your story remains hidden in your pocket, unread and unvalidated by the world.
                      </p>

                      <h4 className="text-lg font-semibold mt-6">Continuing Bonds vs. "Letting Go"</h4>
                      <p>
                        Cultural perspectives differ on whether mourners should "let go" or maintain ongoing connections with the deceased:
                      </p>
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                          <h5 className="font-semibold mb-2">Western: Movement Toward Closure</h5>
                          <ul className="list-disc pl-4 space-y-1 text-sm">
                            <li>Linear progression toward "moving forward"</li>
                            <li>Kübler-Ross aimed for "acceptance" as final stage</li>
                            <li>Modern "Continuing Bonds" theory now gaining traction</li>
                          </ul>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg">
                          <h5 className="font-semibold mb-2">Non-Western: The "Living Dead"</h5>
                          <ul className="list-disc pl-4 space-y-1 text-sm">
                            <li>Death as transition to ancestor status</li>
                            <li>Connection is mandatory through rituals</li>
                            <li>Soul tablets, Día de los Muertos ofrendas, naming children after deceased</li>
                          </ul>
                        </div>
                      </div>

                      <h4 className="text-lg font-semibold mt-6">The Cultural Caveat in Clinical Assessment</h4>
                      <p>
                        Both DSM-5-TR and ICD-11 include a <strong>"cultural caveat"</strong> requiring that grief symptoms must "clearly exceed" what is normal in the individual's specific cultural context before diagnosing Prolonged Grief Disorder.
                      </p>
                      <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Vietnam: Traditional mourning lasts 2 years</li>
                        <li>Bali: Rituals can continue for up to 10 years</li>
                        <li>Aboriginal Sorry Business: Weeks to months of mandatory participation</li>
                        <li>Navajo: Condensed 4-day mourning, then deceased not mentioned again</li>
                      </ul>

                      <p className="italic bg-green-50 dark:bg-green-900/30 p-4 rounded-lg mt-4">
                        <strong>Analogy:</strong> Assessing grief across cultures is like tuning a radio. If clinicians only listen for "Western signals," they may mistake communal wailing or multi-year rituals for pathological noise. To correctly diagnose, clinicians must first identify the cultural station the patient is tuned into.
                      </p>

                      <h4 className="text-lg font-semibold mt-6">Migration and Bicultural Grief</h4>
                      <p>
                        Globalization creates <strong>"cultural bereavement"</strong> where migrants navigate the loss of familiar structures while assimilating into host cultures that don't recognize their needs.
                      </p>
                      <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li><strong>Fragmentation of self:</strong> Feeling too "Westernized" for heritage, too "ethnic" for host society</li>
                        <li><strong>Invisible death:</strong> Older generations dying in homeland while descendants are abroad</li>
                        <li><strong>Thanatechnology:</strong> WhatsApp groups, digital memorials, and "cybercems" bridging geographic distance</li>
                        <li><strong>Hybrid rituals:</strong> Combining traditional elements with Western-style "celebrations of life"</li>
                      </ul>

                      <p className="italic bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg mt-4">
                        <strong>Analogy:</strong> Migrant grief is like a radio tuned between two stations—the individual hears a confusing mix of static from the host culture's "silent" frequency and the loud, ritualized broadcast of their heritage, struggling to find a clear signal that honors both worlds.
                      </p>

                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-6">
                        <p className="font-semibold">Key Takeaway:</p>
                        <p className="mt-2">
                          Grief expressions are like different languages for the same emotion. Just as there are countless languages to say "I love you," there are countless cultural frameworks for expressing "I am grieving." None is more correct than another—they are simply different dialects of the universal human experience of loss.
                        </p>
                      </div>
                    </div>
                  )}

                  {currentLessonContent === 'Building Your Support Network' && (
                    <div className="text-gray-700 dark:text-gray-300 mt-4 space-y-4 break-words">
                      <h4 className="text-lg font-semibold mt-6">What are the different types of support networks available to grieving individuals, and how do they differ in their effectiveness?</h4>
                      <p>
                        Support networks for individuals navigating grief and loss are multi-dimensional systems categorized by their structure (network size and frequency) and function (the type of help provided). These functions generally fall into four categories: emotional (empathy and love), instrumental (tangible aid like financial help or chores), informational (advice), and appraisal (feedback and evaluation).
                      </p>
                      <div className="overflow-x-auto mt-2">
                        <table className="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-600 text-sm">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">Support Type</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">Primary Characteristics and Unique Roles</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">Effectiveness and Insights</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Professional Therapy</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Provides evidence-based treatment for primary conditions like depression, PTSD, and anxiety.</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Effective for interrupting negative thought cycles and identifying problematic behaviors to manage emotions in healthier ways.</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Peer Support Groups</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Connects individuals with others facing similar struggles (e.g., parents grieving children, LGBTQ+ grief groups).</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Offers shared lived experience and professional moderation in a safe, often anonymous environment.</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Family Support</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">An informal network providing the core of emotional safety and immediate practical help.</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Often the strongest predictor of lower anxiety; however, effectiveness can be hindered by "affiliate stigma" (family members feeling the shame of the condition).</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Online Communities</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Digital platforms offering 24/7 accessibility and access to specialized niche communities across geographic barriers.</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Active usage (e.g., status updates) significantly predicts higher resilience; browsing passively can sometimes increase harmful social comparison.</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Religious/Spiritual Communities</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Groups built on shared beliefs and values.</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Spiritual practices are vital coping mechanisms for reestablishing purpose, acceptance, and inner peace.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <h5 className="font-semibold mt-4">Key Differences in Effectiveness</h5>
                      <p>Research indicates that the effectiveness of these networks depends less on the number of people involved and more on the quality of the relationships and the specific type of support provided.</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>The Primacy of "Belonging Support":</strong> Longitudinal studies of individuals facing chronic adversity found that "belonging support"—the perceived availability of people to do things with—was the only dimension that consistently predicted significant decreases in depressive symptoms. This suggests that reintegrating into normal social activities (like book clubs or sports circles) is often more therapeutic for recovery than isolated trauma discussions.</li>
                        <li><strong>The Interaction of Support Types:</strong> Support is most effective when emotional and instrumental dimensions interact. Providers' well-being is primarily driven by their own emotional engagement, but recipients experience the greatest boost in well-being when practical aid is delivered with genuine empathy. If aid is provided without empathy, it can be perceived as burdensome or dismissive.</li>
                        <li><strong>Strong vs. Weak Ties:</strong> Your "support clique" (inner circle of ~5) provides high-intensity emotional sustenance. However, "weak ties" (casual acquaintances) are more likely to deliver novel information and diverse perspectives because they connect you to social circles outside your immediate "provincial" news and views.</li>
                        <li><strong>Psychological Barriers:</strong> Stigma (public, self, and professional) remains a major barrier to activating these networks. Furthermore, 71% of young adults avoid talking about stress because they fear being a burden to others, which can lead to a cycle of isolation that fuels distress.</li>
                      </ul>
                      <p className="italic bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        A healthy support system acts like a diversified investment portfolio: while your strong ties provide the emotional safety of a savings account, your weak ties and community connections provide the growth and new opportunities necessary for long-term resilience and recovery.
                      </p>

                      <h4 className="text-lg font-semibold mt-6">What are the most common barriers that prevent people from seeking support during grief?</h4>
                      <p>
                        The most common barriers preventing individuals from seeking support during grief are a combination of psychological hurdles, such as the fear of being a burden, and external obstacles, including social stigma and systemic inequalities. These barriers often create a "cycle of isolation" where the individual withdraws to avoid inconveniencing others, which in turn reinforces the distress that fueled the need for support in the first place.
                      </p>
                      <h5 className="font-semibold mt-4">The Role of Stigma</h5>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Public Stigma:</strong> Fear of social rejection, discrimination, or negative professional consequences leads many to downplay or hide their symptoms. In high-pressure environments like healthcare or emergency services, seeking help is often equated with a failure of professional stamina.</li>
                        <li><strong>Self-Stigma:</strong> This occurs when an individual internalizes negative stereotypes, leading to diminished self-worth. They may agree with the idea that needing help is a personal failure, which reduces the likelihood of seeking help regardless of the severity of their grief.</li>
                        <li><strong>The Burden Complex:</strong> Approximately 71 percent of adults aged 18–35 avoid discussing their stress because they worry about being a burden to others. This "burden complex" makes it difficult for people to be their authentic selves or ask for specific needs to be met.</li>
                      </ul>
                      <h5 className="font-semibold mt-4">Cultural Norms and Expectations</h5>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Self-Sufficiency vs. Vulnerability:</strong> Many cultures idealize independence and shame those who show vulnerability, pressuring individuals to "tough it out".</li>
                        <li><strong>Cultural Values:</strong> Concepts like the Chinese culture of "face" (Mianzi) or Islamic beliefs that may misinterpret mental distress as spiritual possession can prevent families from accessing secular support.</li>
                        <li><strong>Taboos:</strong> In communities where mental health or grief is seen as a taboo topic, there is often a lack of understanding that can lead to social ostracization of the grieving person.</li>
                      </ul>
                      <h5 className="font-semibold mt-4">Gender Expectations</h5>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Masculinity and Stoicism:</strong> Men often equate help-seeking with a loss of control or a sense of failure. Because traditional roles emphasize being self-sufficient, men may fear that expressing emotional vulnerability makes them appear "unmasculine". This can result in atypical symptoms like anger or attempts to self-manage through substance use.</li>
                        <li><strong>Female Disclosure:</strong> While women are statistically more likely to seek psychological help and disclose distress, they also face a higher risk of depression due to unequal power dynamics and the societal expectation that they should be the primary caregivers for others.</li>
                      </ul>
                      <h5 className="font-semibold mt-4">Socioeconomic Status (SES)</h5>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Affordability and Coverage:</strong> The high cost of therapy, combined with limited insurance coverage or high copays, forces many to forego professional care altogether.</li>
                        <li><strong>Geographical Access:</strong> Rural or underserved communities frequently face a shortage of mental health professionals, requiring grieving individuals to travel long distances or wait months for an appointment.</li>
                        <li><strong>The "Strong Tie" Trap:</strong> Low-income individuals often rely heavily on "strong ties" (close kin) for survival. While these provide immediate aid, they can fragment the community into encapsulated networks that lack "weak ties"—casual acquaintances who typically serve as bridges to novel information and specialized resources.</li>
                      </ul>
                      <p className="italic bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg mt-4">
                        <strong>Analogy:</strong> Seeking support during grief is like trying to reach a lighthouse during a storm. The lighthouse (support) is visible, but the path is blocked by a high wall (stigma). Cultural and gender expectations are like the heavy weights the person is told they must carry alone, while socioeconomic status determines if they even have a boat to make the journey. Many choose to stay in the dark, not because they don't see the light, but because the effort to scale the wall and carry the weight feels more exhausting than the storm itself.
                      </p>

                      <h4 className="text-lg font-semibold mt-6">How do online grief support communities differ from in-person support groups?</h4>
                      <p>
                        Online grief support communities and in-person support groups differ significantly in their structural delivery, though both aim to enhance psychological resilience and mitigate emotional distress. Digital support has evolved into a common instrument for obtaining aid and counsel, particularly for individuals navigating specific niches of loss.
                      </p>
                      <div className="overflow-x-auto mt-2">
                        <table className="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-600 text-sm">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700">
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">Benefit/Risk</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">Online Communities</th>
                              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">In-Person Groups</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Accessibility</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">24/7, geographic independence</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Scheduled, local</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Anonymity</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">High; reduces stigma</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Low; face-to-face</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Emotional Intimacy</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Depends on active vs. passive use</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Higher potential for deep connection</td>
                            </tr>
                             <tr className="bg-gray-50 dark:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Unique Benefit</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Access to specialized niche groups</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Physical presence and non-verbal cues</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">Unique Risk</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Panic contagion, privacy concerns</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">Social anxiety, public stigma</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                       <p className="italic bg-green-50 dark:bg-green-900/30 p-4 rounded-lg mt-4">
                        <strong>Analogy:</strong> Digital grief support is like a worldwide library you can enter in your pajamas at 3:00 AM; it has a specialized book for every unique type of pain, but the connections are through a screen. In-person support is like a local community garden; it requires effort to leave the house, but the act of working the soil alongside others provides a tactile, grounding sense of presence a digital library cannot replicate.
                      </p>

                      <h4 className="text-lg font-semibold mt-6">How can grieving individuals identify "toxic support"?</h4>
                      <p>
                        Grieving individuals can identify unhelpful support by looking for patterns of emotional drain, a lack of empathy, and skewed power dynamics. While many people are well-meaning, their support becomes harmful when it dismisses the grieving person's reality or prioritizes the supporter's needs over the recipient's healing.
                      </p>
                      <h5 className="font-semibold mt-4">Key Red Flags in a Support Network</h5>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Self-Absorption and Lack of Empathy:</strong> A supporter consistently focuses on themselves or shows little concern for your emotional well-being.</li>
                        <li><strong>One-Sided Power Dynamics:</strong> You feel belittled, manipulated, or criticized, and find yourself "walking on eggshells."</li>
                        <li><strong>"Data Collection":</strong> A person encourages you to share feelings only to use that information against you later.</li>
                        <li><strong>Lack of Reciprocity:</strong> You are always giving and they are always taking.</li>
                      </ul>
                      <h5 className="font-semibold mt-4">Identifying Unhelpful Advice</h5>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Dismissive Language:</strong> Advice that is disrespectful or dismissive of your unique strengths.</li>
                        <li><strong>Victim-Blaming:</strong> Statements that imply your grief is your own fault.</li>
                        <li><strong>Stoicism Demands:</strong> Advice that shames you for expressing emotions, pressuring you to "tough it out."</li>
                        <li><strong>Instrumental Aid Without Empathy:</strong> Practical help delivered without genuine emotional engagement.</li>
                      </ul>
                      <p className="italic bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg mt-4">
                        <strong>Analogy:</strong> Unhelpful support is like a leaky life jacket: it looks like it should keep you afloat, but as you lean on it, it slowly fills with water, making you heavier and more likely to sink. True support is a solid vessel that actively keeps the water out so you can navigate the waves at your own pace.
                      </p>

                       <h4 className="text-lg font-semibold mt-6">What is "complicated grief," and when should someone transition to professional treatment?</h4>
                      <p>
                        Grief becomes pathological or a "crisis" when an individual's usual coping skills are overwhelmed, leading to persistent emotional dysregulation and impaired functioning.
                      </p>
                      <h5 className="font-semibold mt-4">Clinical Indicators of Pathological Grief</h5>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Impaired Daily Functioning:</strong> Significant and persistent difficulties at work or school.</li>
                        <li><strong>Abrupt Physiological Changes:</strong> Dramatic disruptions in sleep, appetite, or personal hygiene.</li>
                        <li><strong>Severe Emotional Distortion:</strong> Agitated mood swings, confused thinking, interpreting neutral interactions as negative.</li>
                        <li><strong>Physical Manifestations:</strong> Somatic symptoms like tremors, chronic headaches, or nausea.</li>
                        <li><strong>The "Burden Complex":</strong> An internalized belief that one is a burden, leading to total social withdrawal.</li>
                      </ul>
                      <h5 className="font-semibold mt-4">When to Transition to Professional Treatment</h5>
                      <p>Transition when peer support is no longer sufficient. Key moments include:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Presence of Secondary Conditions:</strong> Grief is accompanied by PTSD, severe depression, or anxiety.</li>
                        <li><strong>High-Risk Coping Mechanisms:</strong> Using substance abuse to self-manage or exhibiting reckless behaviors.</li>
                        <li><strong>Emergency Threshold:</strong> The individual exhibits suicidal ideation, expresses hopelessness, or talks frequently about death.</li>
                      </ul>
                      <p className="italic bg-red-50 dark:bg-red-900/30 p-4 rounded-lg mt-4">
                        <strong>Analogy:</strong> Navigating grief is like walking through a heavy fog. Peer support is a friend with a small flashlight. If the path crumbles into a deep pit (pathological grief), you need a professional search-and-rescue team (therapy) with specialized ropes and gear to pull you out.
                      </p>
                    </div>
                  )}
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

                {/* Buttons für Lektionen-Navigation */}
                <div className="flex space-x-4">
                  <Button 
                    onClick={() => completeLesson(selectedCourse)}
                    disabled={isLastLesson && (completedLessons[selectedCourse] || 0) >= course.lessons}
                  >
                    {isLastLesson ? 'Complete Course' : 'Mark as Complete & Continue'}
                  </Button>
                  {currentLesson > 0 && (
                    <Button variant="outline" onClick={() => setCurrentLesson(currentLesson - 1)}>
                      Previous Lesson
                    </Button>
                  )}
                </div>
                {/* Professional Sources Section for Lesson 1 */}
                {currentLessonContent === 'Introduction to Grief Science' && (
                  <div className="mt-10">
                    <h3 className="text-lg font-semibold mb-3">Sources & Further Reading</h3>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                      <li><strong>Wikipedia.</strong> "Disenfranchised grief." Defines grief not acknowledged by society, with examples such as the death of a pet or an ex-spouse.</li>
                      <li><strong>O’Connor, Mary-Frances.</strong> "Grief: A Brief History of Research on How Body, Mind, and Brain Adapt." <em>Psychosomatic Medicine</em> (2019). Integrates psychology, neuroscience, and immunology to examine adaptation after loss.</li>
                      <li><strong>Stroebe, Margaret, and Henk Schut.</strong> "The Dual Process Model of Coping with Bereavement: Rationale and Description." <em>Death Studies</em> (1999). Introduces the Dual Process Model, focusing on oscillation between loss- and restoration-oriented stressors.</li>
                      <li><strong>Bookey.</strong> "The Grieving Brain Summary." Summarizes Mary-Frances O'Connor's book, <em>The Grieving Brain: The Surprising Science of How We Learn from Love and Loss</em>, explaining neurobiological challenges in grief.</li>
                      <li><strong>Kakarala, S. E., et al.</strong> "The Neurobiological Reward System in Prolonged Grief Disorder (PGD): A Systematic Review." <em>Psychiatry Research: Neuroimaging</em> (2020). Examines the connection between PGD and the brain's reward pathways, including the nucleus accumbens.</li>
                      <li><strong>Eisenberger, Naomi I.</strong> "The neural bases of social pain: Evidence for shared representations with physical pain." <em>Psychosomatic Medicine</em> (2012). Shows that social rejection and loss activate the same neural regions as physical pain (dACC, anterior insula).</li>
                      <li><strong>Reddit.</strong> "Tips for surviving sadness?" Thread from r/TheGirlSurvivalGuide community, sharing personal coping strategies for grief (mindfulness, art, volunteering).</li>
                      <li><strong>Three Oaks Hospice.</strong> "Worden’s Four Tasks of Mourning." Outlines J. William Worden's framework for healing, including accepting the reality of loss and adjusting to a world without the deceased.</li>
                    </ul>
                  </div>
                )}
                {currentLessonContent === 'The Kübler-Ross Model Explained' && (
                  <div className="mt-10">
                    <h3 className="text-lg font-semibold mb-3">Sources & Further Reading</h3>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                      <li><strong>Riaz, F., & Mustafa, A.</strong> (2025). "Digital Mourning and the Evolution of Grief: A Review of Social Media's Role in Shaping Contemporary Bereavement Practices." <em>Scholars Journal of Arts, Humanities and Social Sciences</em>. Theoretical foundation for digital dramaturgy, continuing bonds, and public performance of grief on social media.</li>
                      <li><strong>Boudville, D.</strong> (2023). "The Effect of Belief in Grief-Stages, Self-Blame, & Social Conformity on the Grieving Process." Master’s Thesis, Utrecht University. Explores Terror Management Theory (TMT) and the interaction of social conformity and self-blame with traditional grief stages.</li>
                      <li><strong>Corr, C. A.</strong> (2019). "What nursing can learn from a proper appreciation of the five stages." <em>Revista da Escola de Enfermagem da USP</em>. Critical history of the DABDA model, its original purpose, and lack of empirical validation for general bereavement.</li>
                      <li><strong>Malik, P.</strong> (2025). "The Kübler Ross Change Curve in the Workplace." Whatfix Blog. Details the adaptation of grief stages into organizational change management.</li>
                      <li><strong>Kübler-Ross, E.</strong> (1969). <em>On Death and Dying</em>. Seminal book based on interviews with over 200 terminally ill patients, leading to the five stages model.</li>
                      <li><strong>Kessler, D.</strong> (2019). <em>Finding Meaning: The Sixth Stage of Grief</em>. Introduces the sixth stage of "Finding Meaning" as an extension for healing beyond acceptance.</li>
                      <li><strong>Walker-Journey, J.</strong> (2022). "The 5 Stages of Divorce Grief." DivorceNet. Applies the Kübler-Ross model to "social death" and divorce.</li>
                      <li><strong>Reddit (r/askscience).</strong> (2022). "How accurate are the '5 stages of grief' to model behavior during the loss of an important person?" Synthesis of modern critiques and personal narratives, including media like Radiolab's "The Queen of Dying".</li>
                    </ul>
                  </div>
                )}
                {currentLessonContent === 'Cultural Perspectives on Grief' && (
                  <div className="mt-10">
                    <h3 className="text-lg font-semibold mb-3">Sources & Further Reading</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 italic">
                      These sources provide a multi-disciplinary analysis of global thanatology, merging clinical psychological frameworks with ethnographic studies of traditional mourning rituals. They categorize grief not as a singular emotional state, but as a socially mediated performance dictated by regional, religious, and philosophical norms.
                    </p>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">African and Caribbean Heritage</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li>Rituals of the <strong>Bukusu community</strong> in Kenya, including wailing and "Khuswala kumuse" (traditional preaching)</li>
                      <li>Studies on terminal illness alienation in <strong>Ghana</strong> and the concept of "hysteresis" (cultural lag) in bicultural families</li>
                      <li>Research on the <strong>"living dead"</strong> concept where deceased remain active family members</li>
                    </ul>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">Indigenous Worldviews</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li>Research on Australian Aboriginal <strong>"Sorry Business"</strong> and <strong>"Malignant Grief"</strong> (intergenerational trauma from loss of land and language)</li>
                      <li><strong>Haudenosaunee and Anishinabe</strong> perspectives on the "Sky World" and the role of fire in spiritual communication</li>
                    </ul>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">Western Psychological Frameworks</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li><strong>Kübler-Ross, E.</strong> (1969). <em>On Death and Dying</em>. Five-stage model (denial, anger, bargaining, depression, acceptance)</li>
                      <li><strong>Worden, J. W.</strong> Tasks of Mourning framework for healing</li>
                      <li><strong>Stroebe & Schut.</strong> Dual Process Model of coping with bereavement</li>
                      <li>Contrast between Western individualistic "closure" and global communal practices</li>
                    </ul>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">East and South Asian Perspectives</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li>Confucian <strong>"filial piety" (xiao)</strong> and ritual propriety (li) as regulatory tools for emotional display</li>
                      <li>Buddhist <strong>merit-making</strong> and the <strong>49-day bardo period</strong></li>
                      <li>South Asian/Punjabi healing practices: <strong>"Seva"</strong> (selfless service) and <strong>"Kirtan"</strong> (devotional singing)</li>
                    </ul>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">Latin American Traditions</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li><strong>Día de los Muertos</strong> research: symbolism of ofrendas, marigolds, and pan de muerto</li>
                      <li>Analysis of how these rituals function as political communication for social justice</li>
                    </ul>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">Migration and Identity Loss</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li>Studies on <strong>"cultural bereavement"</strong> and <strong>"immigration grief"</strong></li>
                      <li>Research on the "fragmentation of the self" felt by adult children of immigrants who lose touch with ancestral languages and rituals</li>
                    </ul>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">Stigmatized Loss and Suicide</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li>Examination of unique challenges faced by <strong>suicide loss survivors</strong>, including social avoidance and gossip</li>
                      <li>Therapeutic benefits of <strong>"proactive engagement"</strong> and <strong>"personalized rituals"</strong></li>
                    </ul>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">Socio-Temporal Dimensions</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li>Research on how <strong>linear versus cyclical</strong> conceptions of time influence perceived duration of grief</li>
                      <li>Use of spatiotemporal metaphors like "moving forward" in Western grief discourse</li>
                    </ul>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-4 italic bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <strong>Analogy:</strong> Western clinical texts act as a magnifying glass focusing on the internal mechanisms of an individual's mind; in contrast, the ethnographic sources act as a wide-angle lens, capturing the village, the ancestors, and the historical landscape that collectively shape the mourning experience.
                    </p>
                  </div>
                )}
                {currentLessonContent === 'Building Your Support Network' && (
                  <div className="mt-10">
                    <h3 className="text-lg font-semibold mb-3">Sources & Further Reading</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 italic">
                      The answers provided are generated from a multi-disciplinary collection of academic journals, clinical research reports, sociological theories, and practical mental health guides. These materials are synthesized to provide a comprehensive look at how individuals and organizations navigate adversity, grief, and social connection.
                    </p>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">Sociological Theories of Connection</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li><strong>Granovetter, M.</strong> "Strength of Weak Ties" theory — explains how acquaintances provide novel information and "bridges" between closed social circles</li>
                      <li><strong>Dunbar, R.</strong> 5-15-50-150 hierarchical model — the mathematical limits and functional layers of human relationships, from the "support clique" to the "active network"</li>
                    </ul>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">Clinical and Longitudinal Research</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li>Longitudinal investigation of functional social support and depressive symptoms — identified "belonging support" as the only consistent predictor of recovery</li>
                      <li>Studies on the neurobiology of resilience: roles of <strong>oxytocin</strong> and the <strong>HPA axis</strong> in buffering stress through social connection</li>
                    </ul>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">Mental Health Barriers and Stigma</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li><strong>Singapore Medical Journal</strong> — definitions of public, self, and affiliate stigma</li>
                      <li><strong>My Black Dog & The Psychologist</strong> — analysis of stigma as barriers to seeking help</li>
                      <li><strong>Newport Institute & Manhattan Mental Health Counseling</strong> — the "burden complex" and strategies for reframing vulnerability into gratitude</li>
                    </ul>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">Practical Behavioral Strategies</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li><strong>Healthline, Recovery.com, PositivePsychology.com</strong> — techniques for relationship management</li>
                      <li>The <strong>"Gray Rock" method</strong> for toxic interactions</li>
                      <li>Three-step protocol for setting healthy boundaries</li>
                    </ul>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">Specialized and Professional Support</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li><strong>VITAS Healthcare</strong> — specialized grief support groups for LGBTQ+, Men, and parents</li>
                      <li><strong>Columbia University study</strong> — importance of alumni networks for career resilience and horizontal collaboration</li>
                    </ul>
                    
                    <h4 className="font-semibold text-sm mt-4 mb-2">Crisis and Organizational Protocols</h4>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                      <li><strong>CDC Crisis and Emergency Risk Communication (CERC)</strong> — systematic communication strategies for personal and organizational crises</li>
                      <li><strong>Park University</strong> — leadership strategies for crisis management</li>
                    </ul>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-4 italic bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <strong>Analogy:</strong> Think of these sources as a comprehensive construction manual for a suspension bridge. The sociological theories represent the architectural blueprints for the cables and towers; the clinical research provides the stress-testing data for the materials; the practical guides are the safety protocols for the workers; and the specialized crisis plans are the emergency bypass procedures for when the structure is under extreme pressure. Together, they explain how to build a bridge that is strong enough to carry heavy emotional weight across the chasms of life.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Übersicht aller Lektionen */}
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
                        : index === (completedLessons[selectedCourse] || 0)
                        ? 'hover:bg-blue-50 dark:hover:bg-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      // Allow navigation to all completed lessons, the current, and the next available lesson
                      const maxUnlocked = (completedLessons[selectedCourse] || 0);
                      if (index <= maxUnlocked + 1) {
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

  /**
   * Hauptansicht: Kursübersicht
   * - Zeigt alle Kurse als Cards.
   * - "Coming Soon"-Kurse sind deaktiviert.
   * - Fortschritt für eingeschriebene Kurse wird angezeigt.
   */
  return (
    <div className="space-y-6">
      {/* Navigation und Seitenkopf */}
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

      {/* Hinweis: AI-generierter Inhalt */}
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

      {/* Fortschritt für eingeschriebene Kurse */}
      {enrolledCourses.size > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 border-green-300 dark:border-green-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100" style={{ WebkitFontSmoothing: 'antialiased', fontWeight: 600 }}>
              <BookOpen className="h-5 w-5 text-green-700 dark:text-green-300" />
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
                        <div className="flex justify-between text-sm text-gray-900 dark:text-gray-100 font-medium">
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

      {/* Kursübersicht als Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {courses.map((course) => {
          const isEnrolled = enrolledCourses.has(course.id);
          const progress = getProgress(course.id);

          return (
            <Card key={course.id} className="hover:shadow-lg transition-shadow opacity-100">
              <CardHeader>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      {course.comingSoon && (
                        <span className="text-xs text-pink-600 font-semibold">Coming Soon</span>
                      )}
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
                {course.comingSoon ? (
                  <Button className="w-full" disabled>
                    Coming Soon
                  </Button>
                ) : isEnrolled ? (
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
