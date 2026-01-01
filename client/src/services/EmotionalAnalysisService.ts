/**
 * Emotional Analysis Service for Grandma Sue
 * 
 * Analyzes user messages to identify emotional states, problem types,
 * urgency levels, and user needs to inform appropriate responses.
 */

export interface EmotionalAnalysis {
  emotionalState: EmotionalState;
  emotionalIntensity: 'low' | 'medium' | 'high' | 'crisis';
  problemType: ProblemType;
  urgencyLevel: UrgencyLevel;
  userNeeds: UserNeed[];
  sentimentScore: number; // -1 to 1
  keywords: string[];
  crisisIndicators: CrisisIndicator[];
}

export type EmotionalState = 
  | 'anxious'
  | 'sad'
  | 'angry'
  | 'frustrated'
  | 'confused'
  | 'hopeless'
  | 'fearful'
  | 'overwhelmed'
  | 'lonely'
  | 'guilty'
  | 'numb'
  | 'mixed'
  | 'positive'
  | 'neutral';

export type ProblemType =
  | 'anxiety'
  | 'depression'
  | 'grief'
  | 'relationship'
  | 'work'
  | 'health'
  | 'family'
  | 'trauma'
  | 'stress'
  | 'loneliness'
  | 'self-esteem'
  | 'decision-making'
  | 'general'
  | 'crisis';

export type UrgencyLevel = 
  | 'casual-chat'
  | 'moderate-concern'
  | 'significant-distress'
  | 'crisis';

export type UserNeed =
  | 'validation'
  | 'advice'
  | 'information'
  | 'companionship'
  | 'venting'
  | 'problem-solving'
  | 'comfort'
  | 'professional-referral';

export interface CrisisIndicator {
  type: 'self-harm' | 'suicidal' | 'abuse' | 'psychotic' | 'substance' | 'violence';
  phrase: string;
  confidence: number;
}

/**
 * Comprehensive Emotion Keyword Lexicon
 * 
 * Sources & Inspiration:
 * - NRC Emotion Lexicon (Mohammad & Turney) - 8 basic emotions
 * - VADER (Valence Aware Dictionary for Sentiment Analysis)
 * - WordNet-Affect emotional categories
 * - LIWC (Linguistic Inquiry and Word Count) categories
 * - Plutchik's Wheel of Emotions
 * - Clinical psychology terminology
 * - Common internet/colloquial expressions
 * 
 * Open Source References:
 * - NRC: https://saifmohammad.com/WebPages/NRC-Emotion-Lexicon.htm
 * - VADER: https://github.com/cjhutto/vaderSentiment
 * - EmoLex: https://github.com/wikipedia2vec/emolex
 */

const EMOTIONAL_KEYWORDS: Record<EmotionalState, string[]> = {
  'anxious': [
    // Core anxiety terms
    'anxious', 'anxiety', 'worried', 'worry', 'worrying', 'nervous', 'nervousness',
    'panicking', 'panic', 'panic attack', 'scared', 'fear', 'fearful', 'terrified',
    'dread', 'dreading', 'uneasy', 'tense', 'tension', 'on edge', 'edgy',
    // Stress-related (NRC/VADER)
    'stressed', 'stress', 'stressful', 'pressure', 'pressured', 'under pressure',
    'weighing on', 'weighing on me', 'deadline', 'deadlines',
    // Physical manifestations
    'heart racing', 'can\'t breathe', 'sweating', 'shaking', 'trembling', 'restless',
    'can\'t sleep', 'insomnia', 'racing thoughts', 'overthinking',
    // Anticipatory anxiety
    'apprehensive', 'apprehension', 'anticipating', 'what if', 'afraid of',
    'concerned', 'concern', 'alarmed', 'distressed', 'agitated', 'jittery',
    'freaking out', 'freak out', 'losing it', 'spiraling', 'spiral',
    // German loanwords/expressions commonly used
    'angst', 'unease', 'disquiet'
  ],
  'sad': [
    // Core sadness (NRC)
    'sad', 'sadness', 'unhappy', 'down', 'feeling down', 'blue', 'feeling blue',
    'tearful', 'tears', 'crying', 'cry', 'cried', 'weeping', 'weep', 'sobbing',
    'melancholy', 'melancholic', 'heartbroken', 'heart broken', 'brokenhearted',
    'devastated', 'devastation', 'grief', 'grieving', 'mourning', 'bereaved',
    // Depression-adjacent
    'low', 'feeling low', 'depressed', 'depression', 'depressing', 'miserable',
    'gloomy', 'gloom', 'heavy', 'heavy-hearted', 'heaviness', 'weight',
    'not okay', 'not ok', 'not alright', 'not fine', 'struggling', 'struggle',
    'hard time', 'difficult time', 'tough time', 'rough time', 'bad day',
    // Loss-related
    'loss', 'lost', 'missing', 'miss', 'longing', 'yearn', 'yearning', 'ache', 'aching',
    // Despair
    'despairing', 'despair', 'despondent', 'dejected', 'dejection', 'disheartened',
    'discouraged', 'downcast', 'downhearted', 'crestfallen', 'woeful', 'woe',
    'sorrowful', 'sorrow', 'mournful', 'forlorn', 'wretched', 'bleak',
    // Colloquial
    'bummed', 'bummed out', 'in the dumps', 'feeling like crap', 'hurting',
    'in pain', 'suffering', 'pained', 'broken', 'shattered', 'crushed'
  ],
  'angry': [
    // Core anger (NRC/Plutchik)
    'angry', 'anger', 'mad', 'furious', 'fury', 'rage', 'raging', 'livid',
    'pissed', 'pissed off', 'enraged', 'outraged', 'outrage', 'hate', 'hatred',
    'resent', 'resentment', 'resentful', 'bitter', 'bitterness',
    // Intensity variations
    'irritated', 'irritation', 'annoyed', 'annoyance', 'aggravated', 'aggravation',
    'infuriated', 'incensed', 'irate', 'wrathful', 'wrath', 'seething',
    // Hostility
    'hostile', 'hostility', 'antagonistic', 'combative', 'aggressive', 'aggression',
    'violent feelings', 'want to hurt', 'could kill', 'seeing red',
    // Frustration-anger blend
    'fed up', 'sick of', 'had enough', 'can\'t stand', 'can\'t take it',
    // Disgust-anger (Plutchik adjacent)
    'disgusted', 'disgust', 'revolted', 'repulsed', 'appalled', 'contempt',
    // Colloquial
    'ticked off', 'steamed', 'fuming', 'boiling', 'losing my temper',
    'want to scream', 'exploding', 'blowing up'
  ],
  'frustrated': [
    // Core frustration
    'frustrated', 'frustration', 'annoyed', 'irritated', 'fed up', 'stuck',
    'blocked', 'exasperated', 'exasperation',
    // Failure-related
    'failed', 'failure', 'failing', 'messed up', 'screwed up', 'blew it',
    'didn\'t finish', 'couldn\'t finish', 'not completed', 'incomplete',
    'had not', 'haven\'t done', 'behind on', 'falling behind',
    // Ineffectiveness
    'useless', 'pointless', 'waste of time', 'going nowhere', 'getting nowhere',
    'can\'t do it', 'can\'t figure out', 'doesn\'t work', 'not working',
    // Obstacles
    'obstacle', 'barrier', 'roadblock', 'setback', 'hindered', 'impeded',
    'thwarted', 'defeated', 'stymied', 'stonewalled',
    // Impatience
    'impatient', 'impatience', 'tired of waiting', 'sick of trying',
    'tried everything', 'nothing works', 'at my wit\'s end', 'wits end',
    // Disappointment blend
    'let down', 'disappointed', 'disappointment', 'dissatisfied', 'dissatisfaction',
    'underwhelmed', 'unmet expectations'
  ],
  'confused': [
    // Core confusion
    'confused', 'confusion', 'lost', 'uncertain', 'uncertainty', 'unsure',
    'don\'t know', 'don\'t understand', 'can\'t understand', 'bewildered',
    'puzzled', 'perplexed', 'baffled', 'mystified',
    // Indecision
    'torn', 'torn between', 'conflicted', 'ambivalent', 'ambivalence',
    'indecisive', 'can\'t decide', 'don\'t know what to do',
    // Disorientation
    'disoriented', 'discombobulated', 'mixed up', 'muddled', 'foggy',
    'brain fog', 'hazy', 'unclear', 'vague', 'fuzzy',
    // Overwhelmed-confusion
    'too many options', 'too much information', 'information overload',
    'head spinning', 'can\'t think straight', 'can\'t process',
    // Seeking clarity
    'need help understanding', 'what should i do', 'what do i do',
    'how do i', 'i don\'t get it', 'makes no sense', 'doesn\'t make sense'
  ],
  'hopeless': [
    // Core hopelessness
    'hopeless', 'hopelessness', 'no hope', 'lost hope', 'losing hope',
    'no point', 'pointless', 'what\'s the point', 'why bother',
    'give up', 'giving up', 'gave up', 'want to give up',
    // Despair
    'never get better', 'won\'t get better', 'can\'t get better',
    'no future', 'no way out', 'trapped', 'stuck forever',
    'worthless', 'worthlessness', 'useless', 'no purpose',
    // Nihilism
    'nothing matters', 'doesn\'t matter', 'who cares', 'what\'s the use',
    'futile', 'futility', 'meaningless', 'meaning', 'no meaning',
    // Defeat
    'defeated', 'beaten', 'broken', 'can\'t go on', 'can\'t continue',
    'end of the road', 'hit rock bottom', 'rock bottom', 'bottom',
    // Resignation
    'resigned', 'resignation', 'accepted defeat', 'this is it',
    'it\'s over', 'no escape', 'doomed', 'cursed'
  ],
  'fearful': [
    // Core fear (NRC/Plutchik)
    'afraid', 'fear', 'fearful', 'frightened', 'scared', 'terrified', 'terror',
    'horrified', 'horror', 'petrified', 'phobia', 'phobic',
    // Anticipatory fear
    'dreading', 'dread', 'apprehensive', 'foreboding', 'ominous',
    'bad feeling', 'sense of doom', 'impending', 'inevitable',
    // Vulnerability
    'vulnerable', 'exposed', 'unsafe', 'threatened', 'in danger',
    'at risk', 'defenseless', 'helpless', 'powerless',
    // Specific fears
    'fear of', 'scared of', 'afraid of', 'terrified of', 'worried about',
    'nightmare', 'nightmares', 'haunted', 'haunting',
    // Physical fear response
    'frozen', 'paralyzed', 'can\'t move', 'fight or flight', 'hypervigilant',
    // Colloquial
    'freaked out', 'spooked', 'creeped out', 'gives me chills'
  ],
  'overwhelmed': [
    // Core overwhelm
    'overwhelmed', 'overwhelming', 'too much', 'can\'t cope', 'can\'t handle',
    'drowning', 'swamped', 'buried', 'flooded', 'inundated',
    // Breaking point
    'breaking down', 'falling apart', 'coming apart', 'cracking', 'snapping',
    'at breaking point', 'breaking point', 'on the edge', 'edge',
    // Mental health
    'mental health', 'mentally', 'affecting my mental', 'weighing on my mental',
    'emotional breakdown', 'nervous breakdown', 'meltdown',
    // Capacity exceeded
    'can\'t take anymore', 'had enough', 'maxed out', 'at capacity',
    'spread too thin', 'stretched too thin', 'pulled in all directions',
    // Exhaustion blend
    'burnt out', 'burnout', 'burned out', 'exhausted', 'exhaustion',
    'drained', 'depleted', 'running on empty', 'nothing left',
    // Colloquial
    'in over my head', 'over my head', 'can\'t keep up', 'losing control',
    'out of control', 'chaos', 'chaotic', 'juggling too much'
  ],
  'lonely': [
    // Core loneliness
    'lonely', 'loneliness', 'alone', 'all alone', 'on my own',
    'isolated', 'isolation', 'solitary', 'solitude',
    // Social disconnection
    'no one', 'nobody', 'nobody cares', 'no one cares', 'no one understands',
    'disconnected', 'disconnect', 'left out', 'excluded', 'outcast',
    'abandoned', 'abandonment', 'rejected', 'rejection',
    // Relationship absence
    'no friends', 'friendless', 'no one to talk to', 'no support',
    'unsupported', 'invisible', 'forgotten', 'ignored',
    // Emotional isolation
    'misunderstood', 'don\'t belong', 'don\'t fit in', 'outsider',
    'alienated', 'alienation', 'estranged', 'distant',
    // Yearning for connection
    'need someone', 'wish someone', 'want someone', 'crave connection',
    'starved for', 'touch starved', 'affection', 'companionship'
  ],
  'guilty': [
    // Core guilt
    'guilty', 'guilt', 'guilt-ridden', 'blame myself', 'self-blame',
    'my fault', 'it\'s my fault', 'all my fault', 'i caused',
    'should have', 'shouldn\'t have', 'could have', 'would have',
    // Regret
    'regret', 'regretful', 'regretting', 'wish i had', 'wish i hadn\'t',
    'if only', 'i should have', 'i had not', 'i didn\'t', 'i failed to',
    // Shame
    'ashamed', 'shame', 'shameful', 'embarrassed', 'embarrassment',
    'humiliated', 'humiliation', 'mortified', 'disgrace', 'disgraced',
    // Self-condemnation
    'bad person', 'terrible person', 'awful person', 'horrible person',
    'i\'m the worst', 'i deserve', 'i don\'t deserve', 'unforgivable',
    // Responsibility
    'let everyone down', 'let them down', 'disappointed everyone',
    'failed them', 'betrayed', 'betrayal', 'broke their trust'
  ],
  'numb': [
    // Core numbness
    'numb', 'numbness', 'empty', 'emptiness', 'void', 'hollow',
    'nothing', 'feel nothing', 'don\'t feel', 'can\'t feel',
    // Detachment
    'detached', 'detachment', 'disconnected', 'dissociated', 'dissociating',
    'out of body', 'not real', 'unreal', 'dreamlike',
    // Emotional flatness
    'flat', 'flatlined', 'blank', 'vacant', 'expressionless',
    'indifferent', 'apathetic', 'apathy', 'don\'t care', 'couldn\'t care',
    // Shutdown
    'shut down', 'shutdown', 'closed off', 'walled off', 'blocked out',
    'frozen', 'paralyzed', 'stuck', 'immobilized',
    // Exhaustion-numbness
    'too tired to feel', 'beyond feeling', 'cried out', 'all cried out',
    'nothing left', 'drained of emotion', 'emotionally drained'
  ],
  'mixed': [
    // Ambivalence
    'mixed feelings', 'mixed emotions', 'conflicted', 'conflicting',
    'complicated', 'complex feelings', 'torn', 'ambivalent',
    // Contradictory states
    'happy and sad', 'love and hate', 'good and bad', 'both',
    'on one hand', 'on the other hand', 'part of me', 'another part',
    // Emotional chaos
    'emotional rollercoaster', 'up and down', 'all over the place',
    'don\'t know how i feel', 'not sure how i feel', 'confusing emotions',
    // Bittersweet
    'bittersweet', 'nostalgic', 'nostalgia', 'wistful'
  ],
  'positive': [
    // Joy (NRC/Plutchik)
    'happy', 'happiness', 'joy', 'joyful', 'joyous', 'delighted', 'delight',
    'good', 'great', 'wonderful', 'amazing', 'fantastic', 'awesome',
    'excellent', 'incredible', 'marvelous', 'brilliant', 'superb',
    // Improvement
    'better', 'improving', 'improved', 'getting better', 'progress',
    'breakthrough', 'turning point', 'milestone', 'achievement',
    // Gratitude
    'grateful', 'gratitude', 'thankful', 'blessed', 'appreciative',
    'appreciate', 'appreciation', 'lucky', 'fortunate',
    // Hope (NRC: anticipation+joy)
    'hopeful', 'hope', 'hoping', 'optimistic', 'optimism', 'looking forward',
    'excited', 'excitement', 'eager', 'enthusiastic', 'anticipating',
    // Relief
    'relieved', 'relief', 'weight lifted', 'burden lifted', 'free',
    // Peace (NRC: trust)
    'peaceful', 'peace', 'calm', 'calming', 'serene', 'tranquil', 'relaxed',
    'at ease', 'comfortable', 'content', 'contentment', 'satisfied',
    // Love & connection
    'loved', 'loving', 'love', 'caring', 'cared for', 'supported',
    'connected', 'belonging', 'accepted', 'understood', 'safe',
    // Energy & vitality
    'energized', 'motivated', 'inspired', 'uplifted', 'encouraged',
    'confident', 'strong', 'capable', 'empowered', 'proud',
    // Colloquial positive
    'on cloud nine', 'over the moon', 'on top of the world', 'living my best life',
    'feeling good', 'doing well', 'things are good', 'life is good'
  ],
  'neutral': []
};

/**
 * Problem Type Keywords - Expanded with domain-specific vocabulary
 * Aligned with common therapeutic/clinical categories
 */
const PROBLEM_KEYWORDS: Record<ProblemType, string[]> = {
  'anxiety': [
    // Clinical terms
    'anxiety', 'anxiety disorder', 'anxious', 'panic', 'panic attack', 'panic disorder',
    'worry', 'worrying', 'nervous', 'nervousness', 'fear', 'phobia', 'phobic',
    'ocd', 'obsessive', 'compulsive', 'intrusive thoughts', 'rumination', 'ruminating',
    // Specific anxiety types
    'social anxiety', 'generalized anxiety', 'gad', 'agoraphobia', 'claustrophobia',
    'health anxiety', 'hypochondria', 'separation anxiety', 'performance anxiety',
    // Physical symptoms
    'heart palpitations', 'chest tightness', 'shortness of breath', 'hyperventilating',
    'sweaty palms', 'trembling', 'shaking', 'dizzy', 'nausea from anxiety'
  ],
  'depression': [
    // Clinical terms
    'depressed', 'depression', 'depressive', 'major depression', 'clinical depression',
    'sad', 'sadness', 'hopeless', 'hopelessness', 'despair', 'despairing',
    // Symptoms
    'no motivation', 'unmotivated', 'can\'t get out of bed', 'don\'t want to get up',
    'worthless', 'worthlessness', 'empty', 'emptiness', 'numb', 'flat',
    // Anhedonia
    'no pleasure', 'nothing enjoyable', 'don\'t enjoy', 'lost interest',
    'can\'t feel joy', 'nothing makes me happy', 'joyless',
    // Energy/sleep
    'no energy', 'exhausted', 'tired all the time', 'sleeping too much',
    'can\'t sleep', 'insomnia', 'early waking', 'fatigue', 'lethargy',
    // Cognition
    'can\'t concentrate', 'brain fog', 'can\'t think', 'slow thinking',
    // Self-perception
    'burden', 'failure', 'useless', 'pathetic', 'hate myself'
  ],
  'grief': [
    // Death-related
    'died', 'death', 'dead', 'passed away', 'passed on', 'passing',
    'lost someone', 'loss', 'losing', 'losing someone', 'bereavement',
    'grief', 'grieving', 'mourning', 'mourn',
    // Rituals/events
    'funeral', 'memorial', 'burial', 'cremation', 'anniversary of death',
    'death anniversary', 'birthday of deceased', 'holidays without them',
    // Relationship to deceased
    'gone', 'gone forever', 'never see again', 'miss them', 'missing them',
    'can\'t believe they\'re gone', 'still expect to see', 'empty chair',
    // Other losses
    'miscarriage', 'stillbirth', 'lost pregnancy', 'pet loss', 'pet died',
    'end of relationship', 'divorce grief', 'empty nest',
    // Grief stages/experiences
    'stages of grief', 'denial', 'bargaining', 'complicated grief',
    'prolonged grief', 'anticipatory grief', 'ambiguous loss'
  ],
  'relationship': [
    // Partners
    'relationship', 'relationships', 'partner', 'boyfriend', 'girlfriend',
    'husband', 'wife', 'spouse', 'fiancé', 'fiancee', 'significant other',
    'dating', 'date', 'seeing someone', 'talking to someone',
    // Status changes
    'breakup', 'break up', 'broke up', 'breaking up', 'separation', 'separated',
    'divorce', 'divorcing', 'divorced', 'marriage', 'married', 'wedding',
    'engagement', 'engaged', 'moving in', 'moving out',
    // Issues
    'cheating', 'cheated', 'affair', 'infidelity', 'unfaithful', 'betrayal',
    'trust issues', 'jealousy', 'jealous', 'possessive', 'controlling',
    'communication issues', 'fighting', 'arguments', 'arguing', 'conflict',
    'toxic relationship', 'abusive relationship', 'codependent', 'codependency',
    'intimacy', 'intimacy issues', 'long distance', 'ldr', 'commitment'
  ],
  'work': [
    // Employment
    'work', 'working', 'job', 'jobs', 'career', 'profession', 'occupation',
    'boss', 'manager', 'supervisor', 'coworker', 'coworkers', 'colleague',
    'workplace', 'office', 'company', 'employer', 'employee',
    // Employment status
    'fired', 'laid off', 'layoff', 'terminated', 'let go', 'downsized',
    'unemployed', 'unemployment', 'job search', 'job hunting', 'interview',
    'hired', 'new job', 'promotion', 'demotion', 'raise', 'salary',
    // Academic work
    'assignment', 'assignments', 'project', 'projects', 'deadline', 'deadlines',
    'task', 'tasks', 'homework', 'coursework', 'thesis', 'dissertation',
    'presentation', 'report', 'meeting', 'meetings',
    // Work problems
    'overworked', 'underpaid', 'micromanaged', 'harassment', 'discrimination',
    'hostile work environment', 'burnout', 'work-life balance', 'overtime'
  ],
  'health': [
    // General health
    'health', 'healthy', 'unhealthy', 'sick', 'sickness', 'illness', 'ill',
    'disease', 'condition', 'diagnosis', 'diagnosed', 'prognosis',
    // Medical
    'doctor', 'hospital', 'medical', 'medicine', 'medication', 'treatment',
    'surgery', 'operation', 'procedure', 'test results', 'lab work',
    // Symptoms
    'pain', 'chronic pain', 'ache', 'hurts', 'symptom', 'symptoms',
    'fatigue', 'weakness', 'disability', 'disabled',
    // Mental health
    'mental health', 'mental illness', 'psychiatric', 'therapy', 'therapist',
    'counseling', 'counselor', 'psychologist', 'psychiatrist', 'medication',
    // Specific conditions
    'chronic illness', 'autoimmune', 'cancer', 'heart disease', 'diabetes',
    'chronic fatigue', 'fibromyalgia', 'long covid'
  ],
  'family': [
    // Family members
    'family', 'families', 'parent', 'parents', 'mother', 'mom', 'mum', 'mama',
    'father', 'dad', 'papa', 'daddy', 'sibling', 'siblings', 'brother', 'sister',
    'child', 'children', 'kid', 'kids', 'son', 'daughter', 'baby',
    'grandparent', 'grandmother', 'grandma', 'grandfather', 'grandpa',
    'aunt', 'uncle', 'cousin', 'niece', 'nephew', 'in-laws', 'step-',
    'relatives', 'extended family',
    // Family dynamics
    'family drama', 'family conflict', 'family issues', 'dysfunctional',
    'estranged', 'estrangement', 'no contact', 'low contact', 'boundaries',
    'favoritism', 'black sheep', 'scapegoat', 'golden child',
    // Family changes
    'new baby', 'pregnancy', 'pregnant', 'adoption', 'foster', 'custody',
    'empty nest', 'caregiving', 'caregiver', 'aging parents', 'eldercare'
  ],
  'trauma': [
    // Core trauma terms
    'trauma', 'traumatic', 'traumatized', 'ptsd', 'post-traumatic',
    'flashback', 'flashbacks', 'triggered', 'trigger', 'triggers',
    // Types of trauma
    'abuse', 'abused', 'abusive', 'assault', 'assaulted', 'attacked',
    'violence', 'violent', 'domestic violence', 'dv', 'sexual assault',
    'rape', 'molestation', 'molested', 'childhood abuse', 'neglect',
    // Events
    'accident', 'car accident', 'crash', 'disaster', 'war', 'combat',
    'witnessed', 'victim', 'survivor', 'near death', 'almost died',
    // Symptoms
    'nightmare', 'nightmares', 'night terrors', 'hypervigilant', 'hypervigilance',
    'startle', 'easily startled', 'avoidance', 'avoiding', 'dissociation',
    'haunted', 'haunting', 'can\'t forget', 'intrusive memories',
    // Processing
    'emdr', 'trauma therapy', 'processing trauma', 'trauma response'
  ],
  'stress': [
    // Core stress
    'stress', 'stressed', 'stressful', 'stressor', 'stressors',
    'pressure', 'pressured', 'under pressure', 'high pressure',
    'deadline', 'deadlines', 'crunch time', 'time pressure',
    // Overwhelm
    'too much', 'overwhelmed', 'overwhelming', 'swamped', 'buried',
    'burnout', 'burned out', 'burnt out', 'exhausted', 'exhaustion',
    'overworked', 'overloaded', 'stretched thin',
    // Life stressors
    'weighing on', 'weighing on me', 'on my plate', 'juggling',
    'balancing', 'work-life balance', 'life stress', 'daily stress',
    // Academic stress
    'assignment', 'assignments', 'school', 'university', 'college',
    'exam', 'exams', 'test', 'tests', 'finals', 'midterms', 'grades',
    'studying', 'homework', 'coursework', 'academic pressure',
    // Life events
    'moving', 'relocation', 'new city', 'major change', 'life change',
    'financial stress', 'money problems', 'bills', 'debt'
  ],
  'loneliness': [
    // Core loneliness
    'lonely', 'loneliness', 'alone', 'all alone', 'by myself',
    'isolated', 'isolation', 'social isolation', 'quarantine',
    // Social absence
    'no friends', 'friendless', 'no one to talk to', 'nobody to talk to',
    'no support', 'no support system', 'unsupported',
    // Disconnection
    'disconnected', 'disconnect', 'don\'t belong', 'don\'t fit in',
    'outsider', 'outcast', 'excluded', 'left out', 'invisible',
    // Rejection
    'rejected', 'rejection', 'abandoned', 'abandonment', 'forgotten',
    'unwanted', 'unlovable', 'nobody likes me', 'no one cares',
    // Social challenges
    'social skills', 'making friends', 'hard to connect', 'can\'t connect',
    'social anxiety', 'introvert', 'shy', 'withdrawn'
  ],
  'self-esteem': [
    // Confidence
    'confidence', 'confident', 'self-confidence', 'self-esteem', 'self-worth',
    'insecure', 'insecurity', 'insecurities', 'self-doubt', 'doubt myself',
    // Self-perception
    'hate myself', 'don\'t like myself', 'ugly', 'unattractive', 'fat',
    'stupid', 'dumb', 'idiot', 'worthless', 'not good enough',
    'not smart enough', 'not pretty enough', 'not enough',
    // Comparison
    'compare myself', 'comparison', 'everyone else', 'better than me',
    'inferior', 'inadequate', 'imposter', 'imposter syndrome', 'fraud',
    // Labels
    'failure', 'loser', 'pathetic', 'weak', 'useless', 'broken',
    // Body image
    'body image', 'how i look', 'appearance', 'weight', 'eating disorder',
    'anorexia', 'bulimia', 'binge eating', 'body dysmorphia'
  ],
  'decision-making': [
    // Decisions
    'decide', 'decision', 'decisions', 'deciding', 'choice', 'choices',
    'choose', 'choosing', 'option', 'options', 'alternative', 'alternatives',
    // Indecision
    'should i', 'should i not', 'don\'t know what to do', 'what should i do',
    'torn between', 'can\'t decide', 'indecisive', 'on the fence',
    'pros and cons', 'weighing options',
    // Life decisions
    'life decision', 'big decision', 'major decision', 'crossroads',
    'at a crossroads', 'turning point', 'fork in the road',
    // Specific decisions
    'career change', 'should i stay', 'should i leave', 'moving',
    'marriage decision', 'having kids', 'going back to school'
  ],
  'general': [],
  'crisis': [
    // Suicidal ideation
    'suicide', 'suicidal', 'kill myself', 'end my life', 'take my life',
    'end it', 'end it all', 'not want to live', 'don\'t want to live',
    'want to die', 'wish i was dead', 'better off dead',
    'no reason to live', 'can\'t go on', 'can\'t do this anymore',
    // Self-harm
    'self-harm', 'self harm', 'hurt myself', 'cutting', 'cut myself',
    'burn myself', 'injure myself', 'pain to cope',
    // Plans/means
    'plan to', 'have a plan', 'method', 'pills', 'overdose', 'jump',
    'gun', 'rope', 'bridge', 'goodbye', 'final goodbye', 'note',
    // Crisis states
    'emergency', 'crisis', 'in crisis', 'need help now', 'urgent',
    'can\'t be safe', 'not safe', 'danger to myself'
  ]
};

const CRISIS_PATTERNS: { pattern: RegExp; type: CrisisIndicator['type'] }[] = [
  // Suicidal ideation
  { pattern: /\b(kill|killing)\s*(myself|me)\b/i, type: 'suicidal' },
  { pattern: /\b(want|going|planning)\s*to\s*(die|end\s*(it|my\s*life))\b/i, type: 'suicidal' },
  { pattern: /\bsuicid(e|al)\b/i, type: 'suicidal' },
  { pattern: /\bdon'?t\s*want\s*to\s*(be\s*alive|live|exist)\b/i, type: 'suicidal' },
  { pattern: /\bbetter\s*off\s*(dead|without\s*me)\b/i, type: 'suicidal' },
  { pattern: /\bno\s*reason\s*to\s*live\b/i, type: 'suicidal' },
  { pattern: /\bend\s*(it\s*all|my\s*life|everything)\b/i, type: 'suicidal' },
  { pattern: /\bwish\s*i\s*(was|were)\s*(dead|never\s*born)\b/i, type: 'suicidal' },
  
  // Self-harm
  { pattern: /\b(cut|cutting|burn|burning)\s*myself\b/i, type: 'self-harm' },
  { pattern: /\bself[- ]?harm\b/i, type: 'self-harm' },
  { pattern: /\bhurt(ing)?\s*myself\b/i, type: 'self-harm' },
  
  // Abuse
  { pattern: /\b(he|she|they)\s*(hit|hits|beat|beats|abuse|abuses|hurt|hurts)\s*me\b/i, type: 'abuse' },
  { pattern: /\bdomestic\s*(violence|abuse)\b/i, type: 'abuse' },
  { pattern: /\b(physical|sexual|emotional)\s*abuse\b/i, type: 'abuse' },
  
  // Substance
  { pattern: /\boverdos(e|ed|ing)\b/i, type: 'substance' },
  { pattern: /\bcan'?t\s*stop\s*(drinking|using|taking)\b/i, type: 'substance' },
  { pattern: /\baddiction\s*(is|has)\s*out\s*of\s*control\b/i, type: 'substance' },
  
  // Violence toward others
  { pattern: /\b(want|going)\s*to\s*(kill|hurt|harm)\s*(someone|him|her|them)\b/i, type: 'violence' }
];

const NEED_INDICATORS: Record<UserNeed, string[]> = {
  'validation': ['am i wrong', 'is it okay', 'is this normal', 'do you think', 'am i crazy', 'should i feel'],
  'advice': ['what should i', 'how do i', 'what can i', 'help me', 'advice', 'suggestion', 'recommend'],
  'information': ['what is', 'why does', 'how does', 'explain', 'tell me about', 'learn'],
  'companionship': ['talk to someone', 'listen', 'be there', 'lonely', 'no one to talk to'],
  'venting': ['just need to', 'get this off', 'let it out', 'so frustrated', 'can\'t believe'],
  'problem-solving': ['figure out', 'solve', 'fix', 'solution', 'what to do about'],
  'comfort': ['sad', 'hurting', 'hard time', 'struggling', 'going through'],
  'professional-referral': ['therapist', 'counselor', 'professional help', 'treatment', 'medication']
};

/**
 * Emotional Analysis Service
 */
export class EmotionalAnalysisService {
  
  /**
   * Analyze a user message for emotional content
   */
  analyze(message: string): EmotionalAnalysis {
    const lower = message.toLowerCase();
    const words = lower.split(/\s+/);
    
    // Detect emotional state
    const emotionalState = this.detectEmotionalState(lower);
    
    // Detect problem type
    const problemType = this.detectProblemType(lower);
    
    // Detect crisis indicators
    const crisisIndicators = this.detectCrisisIndicators(message);
    
    // Calculate sentiment score
    const sentimentScore = this.calculateSentiment(lower);
    
    // Determine intensity
    const emotionalIntensity = this.determineIntensity(lower, crisisIndicators);
    
    // Determine urgency
    const urgencyLevel = this.determineUrgency(emotionalIntensity, crisisIndicators, problemType);
    
    // Detect user needs
    const userNeeds = this.detectUserNeeds(lower, urgencyLevel);
    
    // Extract keywords
    const keywords = this.extractKeywords(lower);
    
    return {
      emotionalState,
      emotionalIntensity,
      problemType,
      urgencyLevel,
      userNeeds,
      sentimentScore,
      keywords,
      crisisIndicators
    };
  }
  
  /**
   * Detect primary emotional state
   */
  private detectEmotionalState(message: string): EmotionalState {
    const scores: Record<EmotionalState, number> = {} as Record<EmotionalState, number>;
    
    for (const [state, keywords] of Object.entries(EMOTIONAL_KEYWORDS)) {
      scores[state as EmotionalState] = keywords.reduce((count, keyword) => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = message.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);
    }
    
    // Find the state with highest score
    let maxState: EmotionalState = 'neutral';
    let maxScore = 0;
    
    for (const [state, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxState = state as EmotionalState;
      }
    }
    
    // Check for mixed emotions
    const significantEmotions = Object.entries(scores)
      .filter(([state, score]) => score > 0 && state !== 'neutral' && state !== 'positive')
      .length;
    
    if (significantEmotions > 2) {
      return 'mixed';
    }
    
    return maxState;
  }
  
  /**
   * Detect problem type
   */
  private detectProblemType(message: string): ProblemType {
    // Check for crisis first
    if (PROBLEM_KEYWORDS['crisis'].some(kw => message.includes(kw))) {
      return 'crisis';
    }
    
    const scores: Record<ProblemType, number> = {} as Record<ProblemType, number>;
    
    for (const [type, keywords] of Object.entries(PROBLEM_KEYWORDS)) {
      if (type === 'crisis') continue;
      scores[type as ProblemType] = keywords.reduce((count, keyword) => {
        return count + (message.includes(keyword) ? 1 : 0);
      }, 0);
    }
    
    let maxType: ProblemType = 'general';
    let maxScore = 0;
    
    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxType = type as ProblemType;
      }
    }
    
    return maxType;
  }
  
  /**
   * Detect crisis indicators
   */
  private detectCrisisIndicators(message: string): CrisisIndicator[] {
    const indicators: CrisisIndicator[] = [];
    
    for (const { pattern, type } of CRISIS_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        indicators.push({
          type,
          phrase: match[0],
          confidence: 0.9
        });
      }
    }
    
    return indicators;
  }
  
  /**
   * Calculate sentiment score (-1 to 1)
   */
  private calculateSentiment(message: string): number {
    const positiveWords = ['good', 'great', 'happy', 'love', 'wonderful', 'amazing', 'beautiful', 
      'grateful', 'thankful', 'blessed', 'hopeful', 'excited', 'peaceful', 'calm', 'better',
      'improving', 'healing', 'strong', 'brave', 'proud'];
    
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'miserable',
      'sad', 'angry', 'frustrated', 'hopeless', 'worthless', 'scared', 'afraid', 'anxious',
      'depressed', 'lonely', 'hurt', 'pain', 'suffering', 'struggling', 'failing'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (message.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (message.includes(word)) negativeCount++;
    });
    
    const total = positiveCount + negativeCount;
    if (total === 0) return 0;
    
    return (positiveCount - negativeCount) / total;
  }
  
  /**
   * Determine emotional intensity
   */
  private determineIntensity(
    message: string, 
    crisisIndicators: CrisisIndicator[]
  ): EmotionalAnalysis['emotionalIntensity'] {
    // Crisis indicators = crisis intensity
    if (crisisIndicators.length > 0) {
      return 'crisis';
    }
    
    // Check for intensity modifiers
    const highIntensityWords = ['very', 'extremely', 'incredibly', 'so much', 'unbearable',
      'can\'t take', 'falling apart', 'breaking down', 'desperate', 'crisis', 'emergency'];
    
    const hasHighIntensity = highIntensityWords.some(w => message.includes(w));
    
    // Check message length (longer messages often indicate more distress)
    const isLong = message.length > 300;
    
    // Check for multiple exclamation marks or caps
    const hasEmphasis = /[!]{2,}|[A-Z]{5,}/.test(message);
    
    if (hasHighIntensity || (isLong && hasEmphasis)) {
      return 'high';
    }
    
    // Medium intensity indicators
    const mediumIntensityWords = ['struggling', 'hard time', 'difficult', 'worried', 'upset', 'bothering'];
    const hasMediumIntensity = mediumIntensityWords.some(w => message.includes(w));
    
    if (hasMediumIntensity || isLong) {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * Determine urgency level
   */
  private determineUrgency(
    intensity: EmotionalAnalysis['emotionalIntensity'],
    crisisIndicators: CrisisIndicator[],
    problemType: ProblemType
  ): UrgencyLevel {
    if (crisisIndicators.length > 0 || problemType === 'crisis') {
      return 'crisis';
    }
    
    if (intensity === 'high') {
      return 'significant-distress';
    }
    
    if (intensity === 'medium') {
      return 'moderate-concern';
    }
    
    return 'casual-chat';
  }
  
  /**
   * Detect user needs
   */
  private detectUserNeeds(message: string, urgency: UrgencyLevel): UserNeed[] {
    const needs: UserNeed[] = [];
    
    for (const [need, indicators] of Object.entries(NEED_INDICATORS)) {
      if (indicators.some(ind => message.includes(ind))) {
        needs.push(need as UserNeed);
      }
    }
    
    // Default needs based on urgency
    if (needs.length === 0) {
      switch (urgency) {
        case 'crisis':
          needs.push('professional-referral', 'comfort');
          break;
        case 'significant-distress':
          needs.push('validation', 'comfort');
          break;
        case 'moderate-concern':
          needs.push('validation', 'companionship');
          break;
        default:
          needs.push('companionship');
      }
    }
    
    return needs;
  }
  
  /**
   * Extract significant keywords from message
   */
  private extractKeywords(message: string): string[] {
    const words = message.split(/\s+/);
    const keywords: string[] = [];
    
    const allSignificantWords = [
      ...Object.values(EMOTIONAL_KEYWORDS).flat(),
      ...Object.values(PROBLEM_KEYWORDS).flat()
    ];
    
    words.forEach(word => {
      const cleaned = word.replace(/[^a-z]/g, '');
      if (cleaned.length > 3 && allSignificantWords.some(sw => cleaned.includes(sw) || sw.includes(cleaned))) {
        if (!keywords.includes(cleaned)) {
          keywords.push(cleaned);
        }
      }
    });
    
    return keywords.slice(0, 10); // Limit to 10 keywords
  }
  
  /**
   * Get a summary description of the analysis
   */
  getSummary(analysis: EmotionalAnalysis): string {
    const parts: string[] = [];
    
    if (analysis.emotionalState !== 'neutral') {
      parts.push(`Feeling ${analysis.emotionalState}`);
    }
    
    if (analysis.problemType !== 'general') {
      parts.push(`discussing ${analysis.problemType}`);
    }
    
    if (analysis.urgencyLevel === 'crisis') {
      parts.push('⚠️ CRISIS indicators detected');
    } else if (analysis.urgencyLevel === 'significant-distress') {
      parts.push('showing significant distress');
    }
    
    if (analysis.userNeeds.length > 0) {
      parts.push(`needs: ${analysis.userNeeds.join(', ')}`);
    }
    
    return parts.join('; ') || 'General conversation';
  }
}

export const emotionalAnalysisService = new EmotionalAnalysisService();
