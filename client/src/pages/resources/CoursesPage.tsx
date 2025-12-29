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
                      className="w-full max-w-2xl mx-auto rounded-lg shadow-md border my-6"
                    />
                  )}
                  {currentLessonContent === 'The Kübler-Ross Model Explained' && (
                    <img
                      src="/Images/TheKueblerRossModelExplainedInfographic.png"
                      alt="Infographic: The Kübler-Ross Model Explained"
                      className="w-full max-w-2xl mx-auto rounded-lg shadow-md border my-6"
                    />
                  )}
                  {currentLessonContent === 'Beyond the 5 Stages: Modern Understanding' && (
                    <img
                      src="/Images/BeyondThe5Stages.png"
                      alt="Infographic: Beyond the 5 Stages: Modern Understanding"
                      className="w-full max-w-2xl mx-auto rounded-lg shadow-md border my-6"
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
                      <div className="text-gray-700 dark:text-gray-300 mt-4 space-y-2">
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
                    <div className="text-gray-700 dark:text-gray-300 mt-4 space-y-2">
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
