/**
 * Knowledge Base Service for Grandma Sue
 * 
 * Implements a RAG (Retrieval-Augmented Generation) architecture for processing
 * psychology textbooks and counseling resources. Similar to NotebookLM, this service
 * indexes documents and retrieves relevant context for informed responses.
 */

// Types for document processing
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  embedding?: number[];
}

export interface ChunkMetadata {
  sourceId: string;
  sourceName: string;
  sourceType: 'textbook' | 'guide' | 'research' | 'technique' | 'crisis-protocol';
  pageNumber?: number;
  section?: string;
  chapter?: string;
  topicCategories: TopicCategory[];
  techniqueType?: TechniqueType[];
  applicability: 'general' | 'crisis' | 'specific';
  evidenceLevel: 'research-backed' | 'clinical-consensus' | 'anecdotal';
  lastUpdated: Date;
}

export type TopicCategory = 
  | 'anxiety'
  | 'depression'
  | 'grief'
  | 'trauma'
  | 'relationships'
  | 'stress'
  | 'self-esteem'
  | 'anger'
  | 'loneliness'
  | 'crisis'
  | 'general-wellness';

export type TechniqueType =
  | 'active-listening'
  | 'cbt'
  | 'validation'
  | 'grounding'
  | 'reframing'
  | 'behavioral-activation'
  | 'mindfulness'
  | 'self-compassion'
  | 'boundary-setting'
  | 'crisis-intervention';

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  processedAt?: Date;
  chunkCount: number;
  status: 'pending' | 'processing' | 'ready' | 'error';
  errorMessage?: string;
}

export interface RetrievalResult {
  chunks: DocumentChunk[];
  relevanceScores: number[];
  techniques: TechniqueType[];
  topicMatch: TopicCategory[];
  crisisIndicators: boolean;
}

// Built-in psychology knowledge base (embedded content)
const EMBEDDED_KNOWLEDGE: DocumentChunk[] = [
  // Active Listening Techniques
  {
    id: 'al-001',
    content: `Active listening involves fully concentrating on what the speaker is saying rather than passively hearing. Key techniques include: 1) Reflective listening - echoing back emotions and content to show understanding. 2) Paraphrasing - restating in your own words to confirm comprehension. 3) Open-ended questions - encouraging elaboration rather than yes/no answers. 4) Minimal encouragers - using "mmm-hmm", "I see", "go on" to show presence. 5) Summarizing - periodically reviewing key points discussed.`,
    metadata: {
      sourceId: 'core-techniques',
      sourceName: 'Core Counseling Techniques',
      sourceType: 'technique',
      topicCategories: ['general-wellness'],
      techniqueType: ['active-listening'],
      applicability: 'general',
      evidenceLevel: 'clinical-consensus',
      lastUpdated: new Date('2025-01-01')
    }
  },
  {
    id: 'al-002',
    content: `Validation is the recognition and acceptance of another person's internal experience as valid. It does not mean agreeing with everything they say, but acknowledging their feelings are understandable given their perspective. Effective validation phrases: "That makes sense given what you've been through", "Your feelings are completely valid", "Anyone in your situation would feel that way", "It's understandable that you feel this way".`,
    metadata: {
      sourceId: 'core-techniques',
      sourceName: 'Core Counseling Techniques',
      sourceType: 'technique',
      topicCategories: ['general-wellness'],
      techniqueType: ['validation'],
      applicability: 'general',
      evidenceLevel: 'clinical-consensus',
      lastUpdated: new Date('2025-01-01')
    }
  },
  
  // Anxiety Management
  {
    id: 'anx-001',
    content: `Anxiety is characterized by persistent worry, physical tension, and avoidance behaviors. Key approaches include: 1) Grounding techniques - 5-4-3-2-1 sensory exercise (5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste). 2) Diaphragmatic breathing - slow, deep breaths from the belly. 3) Cognitive restructuring - identifying and challenging anxious thoughts. 4) Progressive muscle relaxation. 5) Exposure therapy principles - gradually facing feared situations.`,
    metadata: {
      sourceId: 'anxiety-management',
      sourceName: 'Anxiety Management Guide',
      sourceType: 'guide',
      topicCategories: ['anxiety'],
      techniqueType: ['grounding', 'cbt'],
      applicability: 'general',
      evidenceLevel: 'research-backed',
      lastUpdated: new Date('2025-01-01')
    }
  },
  {
    id: 'anx-002',
    content: `Common cognitive distortions in anxiety include: Catastrophizing (expecting the worst), Fortune telling (predicting negative outcomes), Mind reading (assuming what others think), All-or-nothing thinking (seeing things as completely good or bad), Overgeneralization (one negative event means a pattern). Helpful reframes: "What evidence supports this thought?", "What would I tell a friend?", "What's the most realistic outcome?", "Will this matter in 5 years?"`,
    metadata: {
      sourceId: 'cbt-foundations',
      sourceName: 'CBT Foundations',
      sourceType: 'textbook',
      topicCategories: ['anxiety'],
      techniqueType: ['cbt', 'reframing'],
      applicability: 'general',
      evidenceLevel: 'research-backed',
      lastUpdated: new Date('2025-01-01')
    }
  },
  
  // Depression Support
  {
    id: 'dep-001',
    content: `Depression manifests as persistent low mood, loss of interest, fatigue, and negative thinking. Behavioral activation is a key evidence-based approach: Start with small, manageable activities that bring even slight pleasure or accomplishment. Don't wait for motivation - action often precedes motivation. Schedule pleasant activities in advance. Track mood before and after activities to see connections. Avoid all-or-nothing thinking about activities.`,
    metadata: {
      sourceId: 'depression-guide',
      sourceName: 'Depression Support Guide',
      sourceType: 'guide',
      topicCategories: ['depression'],
      techniqueType: ['behavioral-activation'],
      applicability: 'general',
      evidenceLevel: 'research-backed',
      lastUpdated: new Date('2025-01-01')
    }
  },
  {
    id: 'dep-002',
    content: `Self-compassion involves treating yourself with the same kindness you would offer a good friend. Three components: 1) Self-kindness over self-judgment - being gentle with yourself during difficulty. 2) Common humanity - recognizing suffering is part of the shared human experience. 3) Mindfulness - holding painful experiences in balanced awareness without over-identification. Practice: "This is a moment of suffering. Suffering is part of life. May I be kind to myself."`,
    metadata: {
      sourceId: 'self-compassion',
      sourceName: 'Self-Compassion Framework',
      sourceType: 'technique',
      topicCategories: ['depression', 'self-esteem'],
      techniqueType: ['self-compassion', 'mindfulness'],
      applicability: 'general',
      evidenceLevel: 'research-backed',
      lastUpdated: new Date('2025-01-01')
    }
  },
  
  // Grief and Loss
  {
    id: 'grief-001',
    content: `Grief is a natural response to loss, not a problem to be solved. The Dual Process Model suggests healthy grief involves oscillating between loss-oriented coping (confronting grief) and restoration-oriented coping (attending to life changes). There is no "right" timeline for grief. Complicated grief may require professional support if: intense longing persists beyond 12 months, functioning is severely impaired, or thoughts of suicide emerge.`,
    metadata: {
      sourceId: 'grief-counseling',
      sourceName: 'Grief Counseling Handbook',
      sourceType: 'textbook',
      topicCategories: ['grief'],
      techniqueType: ['validation', 'active-listening'],
      applicability: 'general',
      evidenceLevel: 'research-backed',
      lastUpdated: new Date('2025-01-01')
    }
  },
  {
    id: 'grief-002',
    content: `Supporting someone through grief: 1) Acknowledge the loss - don't avoid the topic. 2) Be present without trying to fix. 3) Allow all emotions without judgment. 4) Share memories if welcomed. 5) Avoid platitudes like "they're in a better place" or "everything happens for a reason". 6) Remember significant dates. 7) Continue checking in after the initial period. 8) Normalize the unpredictable nature of grief. 9) Help with practical tasks when appropriate.`,
    metadata: {
      sourceId: 'grief-counseling',
      sourceName: 'Grief Counseling Handbook',
      sourceType: 'textbook',
      topicCategories: ['grief'],
      techniqueType: ['active-listening', 'validation'],
      applicability: 'general',
      evidenceLevel: 'clinical-consensus',
      lastUpdated: new Date('2025-01-01')
    }
  },
  
  // Trauma-Informed Care
  {
    id: 'trauma-001',
    content: `Trauma-informed care principles: 1) Safety - ensuring physical and emotional safety. 2) Trustworthiness - being clear, consistent, and maintaining boundaries. 3) Choice - giving control back to the person. 4) Collaboration - working together rather than doing to. 5) Empowerment - focusing on strengths. When someone shares trauma: Don't probe for details. Validate their courage in sharing. Normalize trauma responses. Emphasize safety. Gently recommend professional support.`,
    metadata: {
      sourceId: 'trauma-informed',
      sourceName: 'Trauma-Informed Care Guide',
      sourceType: 'guide',
      topicCategories: ['trauma'],
      techniqueType: ['validation', 'active-listening'],
      applicability: 'specific',
      evidenceLevel: 'clinical-consensus',
      lastUpdated: new Date('2025-01-01')
    }
  },
  
  // Relationship Support
  {
    id: 'rel-001',
    content: `Healthy relationship communication: 1) Use "I" statements ("I feel hurt when..." vs "You always..."). 2) Listen to understand, not to respond. 3) Avoid criticism, contempt, defensiveness, stonewalling (Gottman's "Four Horsemen"). 4) Take breaks when flooded emotionally. 5) Express appreciation regularly. 6) Repair after conflict - acknowledge hurt, take responsibility, make amends. Boundaries are essential: clear limits about what you will and won't accept.`,
    metadata: {
      sourceId: 'relationship-skills',
      sourceName: 'Relationship Skills Training',
      sourceType: 'guide',
      topicCategories: ['relationships'],
      techniqueType: ['boundary-setting', 'active-listening'],
      applicability: 'general',
      evidenceLevel: 'research-backed',
      lastUpdated: new Date('2025-01-01')
    }
  },
  
  // Stress Management
  {
    id: 'stress-001',
    content: `Stress management strategies: 1) Identify what you can and cannot control. 2) Break overwhelming tasks into small steps. 3) Practice time management - prioritize, delegate, say no. 4) Build recovery time into your schedule. 5) Physical exercise is proven to reduce stress hormones. 6) Sleep hygiene is essential. 7) Social support buffers stress. 8) Mindfulness helps break the stress-rumination cycle. Remember: Self-care is not selfish - you can't pour from an empty cup.`,
    metadata: {
      sourceId: 'stress-management',
      sourceName: 'Stress Management Guide',
      sourceType: 'guide',
      topicCategories: ['stress'],
      techniqueType: ['mindfulness', 'behavioral-activation'],
      applicability: 'general',
      evidenceLevel: 'research-backed',
      lastUpdated: new Date('2025-01-01')
    }
  },
  
  // Crisis Intervention
  {
    id: 'crisis-001',
    content: `Crisis recognition indicators: Direct statements about wanting to die or self-harm. Talking about being a burden. Expressing hopelessness about the future. Giving away possessions. Sudden calmness after severe depression. Increased substance use. Withdrawal from social connections. Recent major loss or life change. Access to lethal means. Previous suicide attempts (strongest predictor).`,
    metadata: {
      sourceId: 'crisis-protocol',
      sourceName: 'Crisis Intervention Protocol',
      sourceType: 'crisis-protocol',
      topicCategories: ['crisis'],
      techniqueType: ['crisis-intervention'],
      applicability: 'crisis',
      evidenceLevel: 'clinical-consensus',
      lastUpdated: new Date('2025-01-01')
    }
  },
  {
    id: 'crisis-002',
    content: `Crisis response protocol: 1) Stay calm and present. 2) Listen without judgment. 3) Validate their pain: "I can hear you're really suffering." 4) Ask directly about suicidal thoughts (asking does NOT increase risk). 5) Don't promise confidentiality if safety is at risk. 6) Provide crisis resources: 988 Suicide & Crisis Lifeline (US), Crisis Text Line: text HOME to 741741. 7) Help reduce access to means. 8) Don't leave them alone if immediate risk. 9) Encourage professional help. 10) Follow up.`,
    metadata: {
      sourceId: 'crisis-protocol',
      sourceName: 'Crisis Intervention Protocol',
      sourceType: 'crisis-protocol',
      topicCategories: ['crisis'],
      techniqueType: ['crisis-intervention', 'validation'],
      applicability: 'crisis',
      evidenceLevel: 'clinical-consensus',
      lastUpdated: new Date('2025-01-01')
    }
  },
  
  // Mindfulness Techniques
  {
    id: 'mind-001',
    content: `Mindfulness is present-moment awareness without judgment. Simple practices: 1) Breath awareness - focus on breathing, notice when mind wanders, gently return. 2) Body scan - progressively notice sensations from head to toe. 3) Mindful observation - focus on one object, noticing details. 4) Mindful listening - fully attend to sounds without labeling. 5) Noting - silently label experiences: "thinking", "feeling", "hearing". Start with just 2-3 minutes. Consistency matters more than duration.`,
    metadata: {
      sourceId: 'mindfulness-guide',
      sourceName: 'Mindfulness Practice Guide',
      sourceType: 'technique',
      topicCategories: ['anxiety', 'stress', 'general-wellness'],
      techniqueType: ['mindfulness', 'grounding'],
      applicability: 'general',
      evidenceLevel: 'research-backed',
      lastUpdated: new Date('2025-01-01')
    }
  },
  
  // Loneliness and Connection
  {
    id: 'lonely-001',
    content: `Loneliness is the gap between desired and actual social connection. It's about quality, not quantity of relationships. Addressing loneliness: 1) Recognize it's common - you're not alone in feeling alone. 2) Start small - brief positive interactions count. 3) Volunteer or join interest-based groups. 4) Reach out to existing connections. 5) Challenge negative assumptions about rejection. 6) Practice self-compassion about social struggles. 7) Consider therapy if loneliness is persistent. Digital connection can supplement but not replace in-person interaction.`,
    metadata: {
      sourceId: 'connection-guide',
      sourceName: 'Building Connection Guide',
      sourceType: 'guide',
      topicCategories: ['loneliness', 'relationships'],
      techniqueType: ['behavioral-activation', 'self-compassion'],
      applicability: 'general',
      evidenceLevel: 'research-backed',
      lastUpdated: new Date('2025-01-01')
    }
  }
];

/**
 * Recommended psychology books from freepsychotherapybooks.org
 * These can be downloaded for free and uploaded to enhance Grandma Sue's knowledge
 */
export interface RecommendedBook {
  title: string;
  author: string;
  url: string;
  topics: TopicCategory[];
  description: string;
  priority: 'essential' | 'recommended' | 'supplementary';
}

export const RECOMMENDED_BOOKS: RecommendedBook[] = [
  {
    title: 'The Technique of Psychotherapy',
    author: 'Lewis Wolberg',
    url: 'https://www.freepsychotherapybooks.org/ebook/the-technique-of-psychotherapy/',
    topics: ['general-wellness', 'anxiety', 'depression'],
    description: 'Comprehensive guide to psychotherapy techniques. Excellent for understanding therapeutic communication.',
    priority: 'essential'
  },
  {
    title: 'Cognitive Therapy: Basics and Beyond',
    author: 'Judith Beck',
    url: 'https://www.freepsychotherapybooks.org/ebook/cognitive-therapy-basics-and-beyond/',
    topics: ['anxiety', 'depression', 'stress'],
    description: 'Foundational text on CBT principles and techniques.',
    priority: 'essential'
  },
  {
    title: 'Grief Counseling and Grief Therapy',
    author: 'J. William Worden',
    url: 'https://www.freepsychotherapybooks.org/ebook/grief-counseling-and-grief-therapy/',
    topics: ['grief', 'trauma'],
    description: 'The definitive guide to understanding and supporting those experiencing loss.',
    priority: 'essential'
  },
  {
    title: 'The Art of Empathy',
    author: 'Karla McLaren',
    url: 'https://www.freepsychotherapybooks.org/ebook/the-art-of-empathy/',
    topics: ['relationships', 'general-wellness'],
    description: 'Practical skills for empathic listening and emotional attunement.',
    priority: 'recommended'
  },
  {
    title: 'Trauma and Recovery',
    author: 'Judith Herman',
    url: 'https://www.freepsychotherapybooks.org/ebook/trauma-and-recovery/',
    topics: ['trauma', 'anxiety'],
    description: 'Groundbreaking work on understanding and healing from trauma.',
    priority: 'recommended'
  },
  {
    title: 'Feeling Good: The New Mood Therapy',
    author: 'David Burns',
    url: 'https://www.freepsychotherapybooks.org/ebook/feeling-good/',
    topics: ['depression', 'anxiety', 'self-esteem'],
    description: 'Classic self-help CBT book with practical exercises.',
    priority: 'recommended'
  },
  {
    title: 'The Mindfulness and Acceptance Workbook for Anxiety',
    author: 'John Forsyth & Georg Eifert',
    url: 'https://www.freepsychotherapybooks.org/ebook/mindfulness-acceptance-workbook-anxiety/',
    topics: ['anxiety', 'stress'],
    description: 'ACT-based approach to managing anxiety.',
    priority: 'supplementary'
  },
  {
    title: 'Self-Compassion: The Proven Power of Being Kind to Yourself',
    author: 'Kristin Neff',
    url: 'https://www.freepsychotherapybooks.org/ebook/self-compassion/',
    topics: ['self-esteem', 'depression', 'general-wellness'],
    description: 'Research-based approach to developing self-compassion.',
    priority: 'supplementary'
  }
];

/**
 * Knowledge Base Service
 * Manages document storage, embedding, and retrieval
 */
export class KnowledgeBaseService {
  private documents: UploadedDocument[] = [];
  private chunks: DocumentChunk[] = [...EMBEDDED_KNOWLEDGE];
  private storageKey = 'grandmaSue_knowledgeBase';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load knowledge base from localStorage
   */
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.documents = data.documents || [];
        // Merge saved chunks with embedded knowledge
        const savedChunks = data.chunks || [];
        this.chunks = [...EMBEDDED_KNOWLEDGE, ...savedChunks.filter(
          (c: DocumentChunk) => !EMBEDDED_KNOWLEDGE.some(e => e.id === c.id)
        )];
      }
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    }
  }

  /**
   * Save knowledge base to localStorage
   */
  private saveToStorage(): void {
    try {
      // Only save non-embedded chunks to storage
      const customChunks = this.chunks.filter(
        c => !EMBEDDED_KNOWLEDGE.some(e => e.id === c.id)
      );
      localStorage.setItem(this.storageKey, JSON.stringify({
        documents: this.documents,
        chunks: customChunks
      }));
    } catch (error) {
      console.error('Failed to save knowledge base:', error);
    }
  }

  /**
   * Get all uploaded documents
   */
  getDocuments(): UploadedDocument[] {
    return [...this.documents];
  }

  /**
   * Get the total number of knowledge chunks
   */
  getChunkCount(): number {
    return this.chunks.length;
  }

  /**
   * Get recommended books for enhancing the knowledge base
   */
  getRecommendedBooks(topic?: TopicCategory): RecommendedBook[] {
    if (!topic) {
      return RECOMMENDED_BOOKS;
    }
    return RECOMMENDED_BOOKS.filter(book => book.topics.includes(topic));
  }

  /**
   * Get essential books (highest priority)
   */
  getEssentialBooks(): RecommendedBook[] {
    return RECOMMENDED_BOOKS.filter(book => book.priority === 'essential');
  }

  /**
   * Upload and process a document
   */
  async uploadDocument(file: File): Promise<UploadedDocument> {
    const doc: UploadedDocument = {
      id: `doc-${Date.now()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date(),
      chunkCount: 0,
      status: 'pending'
    };

    this.documents.push(doc);
    this.saveToStorage();

    // Process document asynchronously
    this.processDocument(doc, file);

    return doc;
  }

  /**
   * Process document content into chunks
   */
  private async processDocument(doc: UploadedDocument, file: File): Promise<void> {
    try {
      doc.status = 'processing';
      this.saveToStorage();

      const content = await this.extractContent(file);
      const newChunks = this.chunkContent(content, doc);
      
      this.chunks.push(...newChunks);
      doc.chunkCount = newChunks.length;
      doc.status = 'ready';
      doc.processedAt = new Date();
      
      this.saveToStorage();
    } catch (error) {
      doc.status = 'error';
      doc.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.saveToStorage();
    }
  }

  /**
   * Extract text content from file
   */
  private async extractContent(file: File): Promise<string> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    // Plain text files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await file.text();
    }
    
    // PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await this.extractPDFContent(file);
    }
    
    // Try to read as text for other file types
    try {
      const text = await file.text();
      // Check if it looks like valid text
      if (text && text.length > 0 && !/[\x00-\x08\x0E-\x1F]/.test(text.slice(0, 1000))) {
        return text;
      }
      throw new Error('Binary file detected');
    } catch {
      throw new Error(`Unsupported file type: ${fileType}. Supported formats: .txt, .pdf`);
    }
  }

  /**
   * Extract text from PDF using pdf.js v4.x
   */
  private async extractPDFContent(file: File): Promise<string> {
    try {
      // Import pdf.js
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set up worker using CDN (v4.4.168)
      pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      console.log(`Loading PDF: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      
      // Load PDF document
      let pdf;
      try {
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
        });
        pdf = await loadingTask.promise;
      } catch (loadError: any) {
        console.error('PDF load error:', loadError);
        throw new Error(`Could not load PDF: ${loadError.message || 'Unknown error'}`);
      }
      
      let fullText = '';
      const totalPages = pdf.numPages;
      
      console.log(`Processing PDF: ${file.name} (${totalPages} pages)`);
      
      // Extract text from each page with progress logging
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine text items into page text
          const pageText = textContent.items
            .filter((item: any) => item.str && item.str.trim())
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (pageText) {
            fullText += `\n\n[Page ${pageNum}]\n${pageText}`;
          }
          
          // Log progress every 10 pages
          if (pageNum % 10 === 0) {
            console.log(`Processed ${pageNum}/${totalPages} pages...`);
          }
        } catch (pageError: any) {
          console.warn(`Warning: Could not extract text from page ${pageNum}:`, pageError.message);
          // Continue with other pages
        }
      }
      
      if (!fullText.trim()) {
        throw new Error('No text content found in PDF. The PDF might be image-based (scanned document).');
      }
      
      console.log(`Successfully extracted ${fullText.length} characters from ${file.name}`);
      return fullText.trim();
      
    } catch (error: any) {
      console.error('PDF extraction error:', error);
      
      // Provide helpful error messages
      if (error.message?.includes('password')) {
        throw new Error('This PDF is password protected. Please use an unprotected PDF.');
      }
      if (error.message?.includes('Invalid PDF')) {
        throw new Error('Invalid or corrupted PDF file. Please try a different file.');
      }
      
      throw new Error(`Failed to extract PDF content: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Split content into semantic chunks
   */
  private chunkContent(content: string, doc: UploadedDocument): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const paragraphs = content.split(/\n\n+/);
    
    let currentChunk = '';
    let chunkIndex = 0;
    const maxChunkSize = 1000; // ~250 tokens

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk) {
        chunks.push(this.createChunk(currentChunk, doc, chunkIndex++));
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(this.createChunk(currentChunk, doc, chunkIndex));
    }

    return chunks;
  }

  /**
   * Create a document chunk with auto-detected metadata
   */
  private createChunk(content: string, doc: UploadedDocument, index: number): DocumentChunk {
    const topics = this.detectTopics(content);
    const techniques = this.detectTechniques(content);
    
    return {
      id: `${doc.id}-chunk-${index}`,
      content: content.trim(),
      metadata: {
        sourceId: doc.id,
        sourceName: doc.name,
        sourceType: this.detectSourceType(doc.name),
        topicCategories: topics,
        techniqueType: techniques,
        applicability: this.detectApplicability(content),
        evidenceLevel: 'anecdotal', // User-uploaded content
        lastUpdated: new Date()
      }
    };
  }

  /**
   * Detect topics from content
   */
  private detectTopics(content: string): TopicCategory[] {
    const lower = content.toLowerCase();
    const topics: TopicCategory[] = [];
    
    const topicKeywords: Record<TopicCategory, string[]> = {
      'anxiety': ['anxiety', 'anxious', 'worry', 'panic', 'nervous', 'fear'],
      'depression': ['depression', 'depressed', 'sad', 'hopeless', 'worthless'],
      'grief': ['grief', 'loss', 'death', 'died', 'mourning', 'bereavement'],
      'trauma': ['trauma', 'ptsd', 'abuse', 'violence', 'assault'],
      'relationships': ['relationship', 'partner', 'marriage', 'family', 'friend'],
      'stress': ['stress', 'overwhelm', 'burnout', 'pressure', 'exhausted'],
      'self-esteem': ['self-esteem', 'confidence', 'self-worth', 'insecure'],
      'anger': ['anger', 'angry', 'rage', 'frustrated', 'irritated'],
      'loneliness': ['lonely', 'alone', 'isolated', 'disconnected'],
      'crisis': ['suicide', 'self-harm', 'crisis', 'emergency'],
      'general-wellness': ['wellness', 'health', 'wellbeing', 'coping']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(k => lower.includes(k))) {
        topics.push(topic as TopicCategory);
      }
    }

    return topics.length > 0 ? topics : ['general-wellness'];
  }

  /**
   * Detect technique types from content
   */
  private detectTechniques(content: string): TechniqueType[] {
    const lower = content.toLowerCase();
    const techniques: TechniqueType[] = [];
    
    const techniqueKeywords: Record<TechniqueType, string[]> = {
      'active-listening': ['listen', 'reflect', 'paraphrase', 'empathy'],
      'cbt': ['cognitive', 'thought', 'belief', 'reframe'],
      'validation': ['valid', 'understandable', 'makes sense', 'acknowledge'],
      'grounding': ['ground', '5-4-3-2-1', 'present', 'senses'],
      'reframing': ['reframe', 'perspective', 'different angle'],
      'behavioral-activation': ['activity', 'schedule', 'routine', 'behavior'],
      'mindfulness': ['mindful', 'awareness', 'present moment', 'meditation'],
      'self-compassion': ['self-compassion', 'self-kindness', 'gentle with yourself'],
      'boundary-setting': ['boundary', 'limit', 'say no', 'protect'],
      'crisis-intervention': ['crisis', 'safety', 'hotline', 'emergency']
    };

    for (const [technique, keywords] of Object.entries(techniqueKeywords)) {
      if (keywords.some(k => lower.includes(k))) {
        techniques.push(technique as TechniqueType);
      }
    }

    return techniques;
  }

  /**
   * Detect source type from filename
   */
  private detectSourceType(filename: string): ChunkMetadata['sourceType'] {
    const lower = filename.toLowerCase();
    if (lower.includes('textbook') || lower.includes('book')) return 'textbook';
    if (lower.includes('guide')) return 'guide';
    if (lower.includes('research') || lower.includes('study')) return 'research';
    if (lower.includes('crisis')) return 'crisis-protocol';
    return 'technique';
  }

  /**
   * Detect applicability level
   */
  private detectApplicability(content: string): ChunkMetadata['applicability'] {
    const lower = content.toLowerCase();
    if (lower.includes('crisis') || lower.includes('suicide') || lower.includes('emergency')) {
      return 'crisis';
    }
    if (lower.includes('specific') || lower.includes('particular')) {
      return 'specific';
    }
    return 'general';
  }

  /**
   * Retrieve relevant chunks based on user message and context
   */
  retrieve(
    userMessage: string,
    emotionalState: string,
    problemType: string,
    topK: number = 5
  ): RetrievalResult {
    const lower = userMessage.toLowerCase();
    
    // Score each chunk based on relevance
    const scored = this.chunks.map(chunk => ({
      chunk,
      score: this.calculateRelevance(chunk, lower, emotionalState, problemType)
    }));

    // Sort by score and take top K
    scored.sort((a, b) => b.score - a.score);
    const topChunks = scored.slice(0, topK);

    // Collect unique techniques and topics from retrieved chunks
    const techniques = new Set<TechniqueType>();
    const topics = new Set<TopicCategory>();
    let hasCrisis = false;

    topChunks.forEach(({ chunk }) => {
      chunk.metadata.techniqueType?.forEach(t => techniques.add(t));
      chunk.metadata.topicCategories.forEach(t => topics.add(t));
      if (chunk.metadata.applicability === 'crisis') {
        hasCrisis = true;
      }
    });

    return {
      chunks: topChunks.map(s => s.chunk),
      relevanceScores: topChunks.map(s => s.score),
      techniques: Array.from(techniques),
      topicMatch: Array.from(topics),
      crisisIndicators: hasCrisis
    };
  }

  /**
   * Calculate relevance score for a chunk
   */
  private calculateRelevance(
    chunk: DocumentChunk,
    userMessage: string,
    emotionalState: string,
    problemType: string
  ): number {
    let score = 0;
    const content = chunk.content.toLowerCase();
    const words = userMessage.split(/\s+/);

    // Word overlap
    words.forEach(word => {
      if (word.length > 3 && content.includes(word)) {
        score += 1;
      }
    });

    // Topic match
    const problemTopics: Record<string, TopicCategory[]> = {
      'anxiety': ['anxiety', 'stress'],
      'depression': ['depression', 'loneliness'],
      'grief': ['grief'],
      'relationship': ['relationships'],
      'stress': ['stress', 'general-wellness'],
      'trauma': ['trauma'],
      'crisis': ['crisis']
    };

    const matchingTopics = problemTopics[problemType] || [];
    matchingTopics.forEach(topic => {
      if (chunk.metadata.topicCategories.includes(topic)) {
        score += 3;
      }
    });

    // Emotional state boost
    if (emotionalState === 'negative' && chunk.metadata.techniqueType?.includes('validation')) {
      score += 2;
    }

    // Evidence level weight
    if (chunk.metadata.evidenceLevel === 'research-backed') {
      score += 1;
    }

    return score;
  }

  /**
   * Delete a document and its chunks
   */
  deleteDocument(docId: string): void {
    this.documents = this.documents.filter(d => d.id !== docId);
    this.chunks = this.chunks.filter(c => c.metadata.sourceId !== docId);
    this.saveToStorage();
  }

  /**
   * Clear all uploaded documents (keeps embedded knowledge)
   */
  clearUploadedDocuments(): void {
    this.documents = [];
    this.chunks = [...EMBEDDED_KNOWLEDGE];
    this.saveToStorage();
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
