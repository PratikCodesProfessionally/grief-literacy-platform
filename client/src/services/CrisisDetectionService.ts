/**
 * Crisis Detection Service for Grandma Sue
 * 
 * Dedicated service for identifying and responding to crisis situations.
 * This is a critical safety component that must be highly accurate.
 */

export interface CrisisAssessment {
  isCrisis: boolean;
  riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'imminent';
  crisisTypes: CrisisType[];
  indicators: DetectedIndicator[];
  recommendedAction: RecommendedAction;
  resources: CrisisResource[];
  responseGuidance: string;
}

export interface DetectedIndicator {
  type: CrisisType;
  phrase: string;
  severity: 'warning' | 'concern' | 'critical';
  confidence: number;
}

export interface CrisisResource {
  name: string;
  contact: string;
  type: 'phone' | 'text' | 'chat' | 'emergency';
  available: string; // e.g., "24/7"
  description: string;
}

export type CrisisType = 
  | 'suicidal-ideation'
  | 'suicide-plan'
  | 'self-harm'
  | 'abuse-victim'
  | 'abuse-perpetrator'
  | 'psychotic-symptoms'
  | 'severe-depression'
  | 'panic-attack'
  | 'substance-crisis'
  | 'violence-threat'
  | 'domestic-violence';

export type RecommendedAction =
  | 'continue-conversation'    // No crisis, continue normally
  | 'gentle-check-in'          // Low risk, ask caring questions
  | 'express-concern'          // Moderate risk, show concern
  | 'encourage-professional'   // High risk, encourage professional help
  | 'provide-crisis-resources' // High/imminent, provide specific resources
  | 'emergency-protocol';      // Imminent danger, emergency services

// Crisis detection patterns with severity levels
const CRISIS_PATTERNS: Array<{
  patterns: RegExp[];
  type: CrisisType;
  severity: DetectedIndicator['severity'];
}> = [
  // Suicidal ideation - Critical
  {
    patterns: [
      /\b(want|going|planning|thinking\s+about)\s+(to\s+)?(kill|end)\s+(myself|my\s*life|it\s*all)\b/i,
      /\bsuicide\b/i,
      /\bkill\s+myself\b/i,
      /\bend\s+(it|my\s+life|everything)\b/i,
      /\bdon'?t\s+want\s+to\s+(live|be\s+alive|exist)\b/i,
      /\bbetter\s+off\s+dead\b/i,
      /\bno\s+reason\s+to\s+live\b/i,
      /\bwish\s+i\s+(was|were)\s+(dead|never\s+born)\b/i,
      /\bwon'?t\s+be\s+around\s+much\s+longer\b/i,
      /\beveryone\s+would\s+be\s+better\s+off\s+without\s+me\b/i
    ],
    type: 'suicidal-ideation',
    severity: 'critical'
  },
  
  // Suicide plan - Critical (indicates higher risk than ideation)
  {
    patterns: [
      /\b(have|got)\s+a\s+(plan|way)\s+to\s+(kill|end)\b/i,
      /\bknow\s+how\s+i'?m\s+going\s+to\s+do\s+it\b/i,
      /\b(bought|have|got)\s+(pills|gun|rope|knife)\b/i,
      /\bwriting\s+(my\s+)?(goodbye|suicide)\s+(note|letter)\b/i,
      /\bgiving\s+away\s+my\s+(stuff|things|possessions)\b/i,
      /\bsaid\s+(my\s+)?goodbyes\b/i
    ],
    type: 'suicide-plan',
    severity: 'critical'
  },
  
  // Self-harm - Concern to Critical
  {
    patterns: [
      /\b(cut|cutting|burn|burning|hurt|hurting)\s+(myself|my\s+(arm|leg|body|wrist))\b/i,
      /\bself[- ]?harm\b/i,
      /\b(want|need)\s+to\s+(hurt|cut|burn)\s+(myself)?\b/i,
      /\b(scratching|hitting|punching)\s+(myself|my)\b/i
    ],
    type: 'self-harm',
    severity: 'critical'
  },
  
  // Abuse victim - Critical
  {
    patterns: [
      /\b(he|she|they|my\s+(partner|husband|wife|boyfriend|girlfriend))\s+(hit|hits|beat|beats|hurt|hurts|abuse|abuses)\s+me\b/i,
      /\bdomestic\s+(violence|abuse)\b/i,
      /\b(physical|sexual|emotional)\s+abuse\b/i,
      /\bafraid\s+(of|he'?ll|she'?ll)\s+(him|her|hurt|kill)\b/i,
      /\btrapped\s+in\s+(this|my)\s+relationship\b/i,
      /\bhe\s+(won'?t\s+let|doesn'?t\s+let)\s+me\s+leave\b/i
    ],
    type: 'abuse-victim',
    severity: 'critical'
  },
  
  // Violence toward others - Critical
  {
    patterns: [
      /\b(want|going|planning)\s+to\s+(kill|hurt|harm)\s+(someone|him|her|them|my)\b/i,
      /\b(could|might)\s+hurt\s+(someone|him|her|them)\b/i,
      /\bhomicidal\b/i
    ],
    type: 'violence-threat',
    severity: 'critical'
  },
  
  // Substance crisis - Critical
  {
    patterns: [
      /\boverdos(e|ed|ing)\b/i,
      /\bcan'?t\s+stop\s+(drinking|using|taking)\b/i,
      /\baddiction\s+(is|has)\s+(out\s+of\s+control|ruining|destroying)\b/i,
      /\bgoing\s+through\s+withdrawal\b/i,
      /\brelapsed\b/i
    ],
    type: 'substance-crisis',
    severity: 'critical'
  },
  
  // Psychotic symptoms - Critical
  {
    patterns: [
      /\b(voices|voice)\s+(tell|telling|told)\s+me\s+to\b/i,
      /\bthey'?re\s+(watching|following|after)\s+me\b/i,
      /\bpeople\s+are\s+(trying\s+to|out\s+to)\s+(get|hurt|kill)\s+me\b/i,
      /\b(see|seeing|hear|hearing)\s+things\s+(that\s+)?(aren'?t|no\s+one\s+else)\b/i
    ],
    type: 'psychotic-symptoms',
    severity: 'critical'
  },
  
  // Severe depression - Concern
  {
    patterns: [
      /\bcan'?t\s+(get\s+out\s+of|leave)\s+(bed|house)\b/i,
      /\bhaven'?t\s+(eaten|slept)\s+in\s+days\b/i,
      /\bcompletely\s+(hopeless|worthless|empty)\b/i,
      /\bnothing\s+matters\s+anymore\b/i,
      /\bgiven\s+up\s+(on\s+everything|completely)\b/i
    ],
    type: 'severe-depression',
    severity: 'concern'
  },
  
  // Panic attack - Warning
  {
    patterns: [
      /\b(having|had)\s+a\s+panic\s+attack\b/i,
      /\bcan'?t\s+breathe\b/i,
      /\bheart\s+(is\s+)?racing\b/i,
      /\bthink\s+i'?m\s+(dying|going\s+crazy)\b/i,
      /\bfeeling\s+(like|i'?m)\s+going\s+to\s+pass\s+out\b/i
    ],
    type: 'panic-attack',
    severity: 'warning'
  }
];

// Crisis resources database
const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    contact: '988',
    type: 'phone',
    available: '24/7',
    description: 'Free, confidential crisis support for suicidal thoughts, emotional distress, or substance abuse crises.'
  },
  {
    name: '988 Suicide & Crisis Lifeline (Text)',
    contact: 'Text 988',
    type: 'text',
    available: '24/7',
    description: 'Text-based crisis support for those who prefer texting over calling.'
  },
  {
    name: 'Crisis Text Line',
    contact: 'Text HOME to 741741',
    type: 'text',
    available: '24/7',
    description: 'Free, confidential text-based support for any crisis.'
  },
  {
    name: 'National Domestic Violence Hotline',
    contact: '1-800-799-7233',
    type: 'phone',
    available: '24/7',
    description: 'Support for victims and survivors of domestic violence.'
  },
  {
    name: 'SAMHSA National Helpline',
    contact: '1-800-662-4357',
    type: 'phone',
    available: '24/7',
    description: 'Treatment referral and information for mental health and substance abuse.'
  },
  {
    name: 'Emergency Services',
    contact: '911',
    type: 'emergency',
    available: '24/7',
    description: 'For immediate life-threatening emergencies.'
  },
  {
    name: 'RAINN Sexual Assault Hotline',
    contact: '1-800-656-4673',
    type: 'phone',
    available: '24/7',
    description: 'Support for survivors of sexual violence.'
  },
  {
    name: 'Trevor Project (LGBTQ+)',
    contact: '1-866-488-7386',
    type: 'phone',
    available: '24/7',
    description: 'Crisis intervention for LGBTQ+ young people.'
  },
  {
    name: 'Veterans Crisis Line',
    contact: '988, then press 1',
    type: 'phone',
    available: '24/7',
    description: 'Crisis support for veterans and their loved ones.'
  }
];

// Response guidance templates
const RESPONSE_GUIDANCE: Record<RecommendedAction, string> = {
  'continue-conversation': 
    'Continue the supportive conversation normally. No crisis indicators detected.',
  
  'gentle-check-in': 
    'The person may be struggling. Ask caring, open-ended questions about how they\'re doing. Validate their feelings.',
  
  'express-concern': 
    'Express genuine concern about what they\'ve shared. Validate their pain. Ask if they\'ve considered talking to a professional.',
  
  'encourage-professional': 
    'Gently but clearly encourage professional help. Explain that what they\'re going through deserves proper support. Offer to help them find resources.',
  
  'provide-crisis-resources': 
    'The person is in crisis. Stay calm and compassionate. Validate their pain. Provide specific crisis resources. Don\'t leave them without resources.',
  
  'emergency-protocol': 
    'This is an emergency. Express serious concern. Provide emergency resources (911, 988). Encourage them to seek immediate help. Do not end the conversation until they acknowledge the resources.'
};

/**
 * Crisis Detection Service
 */
export class CrisisDetectionService {
  
  /**
   * Assess a message for crisis indicators
   */
  assess(message: string): CrisisAssessment {
    const indicators = this.detectIndicators(message);
    const crisisTypes = [...new Set(indicators.map(i => i.type))];
    const riskLevel = this.calculateRiskLevel(indicators);
    const recommendedAction = this.determineAction(riskLevel, crisisTypes);
    const resources = this.selectResources(crisisTypes);
    
    return {
      isCrisis: riskLevel !== 'none' && riskLevel !== 'low',
      riskLevel,
      crisisTypes,
      indicators,
      recommendedAction,
      resources,
      responseGuidance: RESPONSE_GUIDANCE[recommendedAction]
    };
  }
  
  /**
   * Detect crisis indicators in message
   */
  private detectIndicators(message: string): DetectedIndicator[] {
    const indicators: DetectedIndicator[] = [];
    
    for (const { patterns, type, severity } of CRISIS_PATTERNS) {
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
          indicators.push({
            type,
            phrase: match[0],
            severity,
            confidence: this.calculateConfidence(match[0], message)
          });
        }
      }
    }
    
    return indicators;
  }
  
  /**
   * Calculate confidence based on context
   */
  private calculateConfidence(match: string, fullMessage: string): number {
    let confidence = 0.8;
    
    // Negation check (e.g., "I don't want to kill myself" might be reassurance)
    const beforeMatch = fullMessage.substring(0, fullMessage.indexOf(match)).toLowerCase();
    if (beforeMatch.includes("don't ") || beforeMatch.includes("do not ") || 
        beforeMatch.includes("never ") || beforeMatch.includes("wouldn't ")) {
      confidence -= 0.3;
    }
    
    // Hypothetical check
    if (beforeMatch.includes("if ") || beforeMatch.includes("would ")) {
      confidence -= 0.2;
    }
    
    // Past tense check
    if (fullMessage.toLowerCase().includes("used to") || 
        fullMessage.toLowerCase().includes("in the past")) {
      confidence -= 0.2;
    }
    
    // Asking about others
    if (beforeMatch.includes("my friend ") || beforeMatch.includes("someone ") ||
        beforeMatch.includes("my ") && !beforeMatch.includes("myself")) {
      confidence -= 0.1;
    }
    
    // Intensity markers increase confidence
    const intensifiers = ['really', 'seriously', 'actually', "i'm going to", 'tonight', 'today'];
    if (intensifiers.some(i => fullMessage.toLowerCase().includes(i))) {
      confidence += 0.1;
    }
    
    return Math.max(0.3, Math.min(1, confidence));
  }
  
  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(indicators: DetectedIndicator[]): CrisisAssessment['riskLevel'] {
    if (indicators.length === 0) {
      return 'none';
    }
    
    const hasCritical = indicators.some(i => i.severity === 'critical');
    const hasConcern = indicators.some(i => i.severity === 'concern');
    const hasWarning = indicators.some(i => i.severity === 'warning');
    
    // Check for suicide plan (highest risk)
    if (indicators.some(i => i.type === 'suicide-plan' && i.confidence > 0.6)) {
      return 'imminent';
    }
    
    // Multiple critical indicators
    const criticalCount = indicators.filter(i => i.severity === 'critical').length;
    if (criticalCount >= 2) {
      return 'imminent';
    }
    
    // Single critical indicator
    if (hasCritical) {
      const maxConfidence = Math.max(...indicators.filter(i => i.severity === 'critical').map(i => i.confidence));
      return maxConfidence > 0.7 ? 'high' : 'moderate';
    }
    
    // Concern indicators
    if (hasConcern) {
      return 'moderate';
    }
    
    // Warning indicators
    if (hasWarning) {
      return 'low';
    }
    
    return 'none';
  }
  
  /**
   * Determine recommended action based on risk level
   */
  private determineAction(
    riskLevel: CrisisAssessment['riskLevel'],
    crisisTypes: CrisisType[]
  ): RecommendedAction {
    switch (riskLevel) {
      case 'imminent':
        return 'emergency-protocol';
      case 'high':
        return 'provide-crisis-resources';
      case 'moderate':
        return 'encourage-professional';
      case 'low':
        return crisisTypes.includes('panic-attack') ? 'gentle-check-in' : 'express-concern';
      case 'none':
      default:
        return 'continue-conversation';
    }
  }
  
  /**
   * Select appropriate resources based on crisis type
   */
  private selectResources(crisisTypes: CrisisType[]): CrisisResource[] {
    const resources: CrisisResource[] = [];
    
    // Always include primary suicide/crisis line for serious situations
    if (crisisTypes.some(t => 
      ['suicidal-ideation', 'suicide-plan', 'self-harm', 'severe-depression'].includes(t)
    )) {
      resources.push(
        CRISIS_RESOURCES.find(r => r.name === '988 Suicide & Crisis Lifeline')!,
        CRISIS_RESOURCES.find(r => r.name === 'Crisis Text Line')!
      );
    }
    
    // Domestic violence resources
    if (crisisTypes.some(t => ['abuse-victim', 'domestic-violence'].includes(t))) {
      resources.push(
        CRISIS_RESOURCES.find(r => r.name === 'National Domestic Violence Hotline')!
      );
    }
    
    // Substance abuse resources
    if (crisisTypes.includes('substance-crisis')) {
      resources.push(
        CRISIS_RESOURCES.find(r => r.name === 'SAMHSA National Helpline')!
      );
    }
    
    // Always include emergency services for high-risk situations
    if (crisisTypes.some(t => 
      ['suicide-plan', 'violence-threat', 'psychotic-symptoms'].includes(t)
    )) {
      resources.push(
        CRISIS_RESOURCES.find(r => r.name === 'Emergency Services')!
      );
    }
    
    // Default to general crisis resources if nothing specific
    if (resources.length === 0 && crisisTypes.length > 0) {
      resources.push(
        CRISIS_RESOURCES.find(r => r.name === '988 Suicide & Crisis Lifeline')!,
        CRISIS_RESOURCES.find(r => r.name === 'Crisis Text Line')!
      );
    }
    
    // Remove duplicates and undefined
    return [...new Map(resources.filter(Boolean).map(r => [r.name, r])).values()];
  }
  
  /**
   * Format crisis resources for display
   */
  formatResources(resources: CrisisResource[]): string {
    if (resources.length === 0) return '';
    
    let formatted = '\n\n**Crisis Resources:**\n';
    
    resources.forEach(resource => {
      formatted += `• **${resource.name}**: ${resource.contact}`;
      if (resource.available !== '24/7') {
        formatted += ` (${resource.available})`;
      }
      formatted += '\n';
    });
    
    return formatted;
  }
  
  /**
   * Generate a crisis response for Grandma Sue
   */
  generateCrisisResponse(assessment: CrisisAssessment): string {
    const parts: string[] = [];
    
    // Opening based on severity
    if (assessment.riskLevel === 'imminent') {
      parts.push(
        "Sweetheart, I need you to stop and listen to me very carefully. " +
        "What you've shared with me is really serious, and I'm very worried about your safety right now."
      );
    } else if (assessment.riskLevel === 'high') {
      parts.push(
        "Dear one, I'm really concerned about what you're telling me. " +
        "I can hear how much pain you're in, and I want you to know that you're not alone."
      );
    } else {
      parts.push(
        "I hear you, sweetheart, and I'm concerned about what you're going through. " +
        "Thank you for trusting me with this."
      );
    }
    
    // Validation
    parts.push(
      "Your pain is real, and your feelings are valid. " +
      "But I need you to know that there are people who can help you through this - " +
      "professionals who are trained to provide the support you need."
    );
    
    // Resources
    if (assessment.resources.length > 0) {
      parts.push(
        "Please reach out to one of these resources:\n" +
        assessment.resources.map(r => `• **${r.name}**: ${r.contact}`).join('\n')
      );
    }
    
    // Closing
    if (assessment.riskLevel === 'imminent') {
      parts.push(
        "I'm not going anywhere, dear. I'm here with you right now. " +
        "But please, will you call 988 or 911? Your life matters. You matter."
      );
    } else {
      parts.push(
        "I'm here to listen, but you deserve professional support for what you're going through. " +
        "Will you consider reaching out to one of these resources? " +
        "I care about you, and I want you to get the help you deserve."
      );
    }
    
    return parts.join('\n\n');
  }
  
  /**
   * Get all available crisis resources
   */
  getAllResources(): CrisisResource[] {
    return [...CRISIS_RESOURCES];
  }
  
  /**
   * Quick check for crisis (lighter than full assessment)
   */
  quickCheck(message: string): boolean {
    const lower = message.toLowerCase();
    
    // Quick keyword check
    const criticalKeywords = [
      'kill myself', 'suicide', 'want to die', 'end my life',
      'self-harm', 'cut myself', 'hurt myself', 'overdose',
      'he hits me', 'she hits me', 'abuses me'
    ];
    
    return criticalKeywords.some(keyword => lower.includes(keyword));
  }
}

export const crisisDetectionService = new CrisisDetectionService();
