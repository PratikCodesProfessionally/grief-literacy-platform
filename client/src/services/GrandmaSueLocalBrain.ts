/**
 * Grandma Sue's local "brain".
 *
 * Runs when no cloud AI is reachable. The older local engine mapped each message to an
 * emotion and picked a canned paragraph, so it greeted people again mid-conversation,
 * repeated itself, and never remembered anything. This layer adds:
 *  - memory derived from the conversation (the person's name, who they are grieving)
 *  - conversational intents (greetings, thanks, jokes, stories, breathing, yes/no follow-ups, ...)
 *  - reflective listening ("you feel like nobody listens to you")
 *  - anti-repetition across recent replies
 *  - shorter, rotating advice instead of six-paragraph walls
 *
 * It is deliberately pure (no network, no import.meta.env) so it can be unit-tested with tsx.
 * Crisis handling stays in RAGPipelineService and always runs before this.
 */

import type { EmotionalAnalysis } from './EmotionalAnalysisService';

export interface BrainMessage {
  role: 'user' | 'assistant';
  content: string;
  analysis?: EmotionalAnalysis;
}

export interface LovedOne {
  relation: string; // as the user said it: "mom", "grandpa", "dog"
  kind: RelationKind;
  name?: string;
}

export interface BrainMemory {
  userName?: string;
  lovedOne?: LovedOne;
  userTurns: number;
}

export type BrainResult =
  | { kind: 'reply'; text: string }
  | { kind: 'advice' } // the user accepted an offer of suggestions
  | { kind: 'pass' }; // let the emotion-based engine answer

type RelationKind = 'parent' | 'grandparent' | 'partner' | 'child' | 'sibling' | 'friend' | 'pet' | 'relative';

const RELATIONS: Record<string, RelationKind> = {
  mom: 'parent', mother: 'parent', mum: 'parent', mommy: 'parent', mama: 'parent',
  dad: 'parent', father: 'parent', daddy: 'parent', papa: 'parent',
  grandma: 'grandparent', grandmother: 'grandparent', granny: 'grandparent', nana: 'grandparent',
  grandpa: 'grandparent', grandfather: 'grandparent', granddad: 'grandparent',
  husband: 'partner', wife: 'partner', partner: 'partner', fiance: 'partner', 'fiancé': 'partner',
  fiancee: 'partner', boyfriend: 'partner', girlfriend: 'partner',
  son: 'child', daughter: 'child', baby: 'child', child: 'child',
  brother: 'sibling', sister: 'sibling', twin: 'sibling',
  friend: 'friend', 'best friend': 'friend',
  dog: 'pet', cat: 'pet', puppy: 'pet', kitty: 'pet', horse: 'pet', pet: 'pet',
  aunt: 'relative', uncle: 'relative', cousin: 'relative', niece: 'relative', nephew: 'relative',
};

const FEMALE = new Set(['mom', 'mother', 'mum', 'mommy', 'mama', 'grandma', 'grandmother', 'granny', 'nana',
  'wife', 'fiancee', 'girlfriend', 'daughter', 'sister', 'aunt', 'niece']);
const MALE = new Set(['dad', 'father', 'daddy', 'papa', 'grandpa', 'grandfather', 'granddad', 'husband',
  'boyfriend', 'son', 'brother', 'uncle', 'nephew']);

const RELATION_PATTERN = Object.keys(RELATIONS)
  .sort((a, b) => b.length - a.length)
  .map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

// "passed" alone is ambiguous ("my friend passed the exam"), so exclude it when an object follows.
const LOSS_VERBS = String.raw`died|passed away|passed on|passed(?!\s+(?:the|my|a|an|his|her|their|our|me|it|by|through|out|up|over)\b)|is gone|was killed|was put down|lost (?:her|his|their) (?:battle|fight)`;

// Words that look like names after "I'm ..." but are really feelings or states.
const NOT_NAMES = new Set([
  'sad', 'tired', 'fine', 'ok', 'okay', 'good', 'great', 'not', 'so', 'really', 'very', 'just', 'here', 'back',
  'sorry', 'lonely', 'anxious', 'scared', 'afraid', 'angry', 'upset', 'lost', 'stressed', 'depressed', 'happy',
  'alright', 'alone', 'done', 'struggling', 'feeling', 'going', 'trying', 'grieving', 'confused', 'exhausted',
  'well', 'better', 'worse', 'bored', 'hurt', 'broken', 'numb', 'a', 'an', 'the', 'in', 'at', 'on', 'still',
  'tomorrow', 'later', 'now', 'today', 'crazy', 'maybe', 'whatever', 'anything', 'nothing', 'when', 'if',
]);

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export class GrandmaSueLocalBrain {
  /** Pick from a pool, avoiding lines Grandma Sue used in her recent replies. */
  pick(pool: string[], history: BrainMessage[] = []): string {
    const recent = history
      .filter((m) => m.role === 'assistant')
      .slice(-8)
      .map((m) => m.content);
    // Compare on the middle of each line: openings often differ only by "dear"/"honey"/a name.
    const probe = (line: string) => {
      if (line.length <= 60) return line;
      const mid = Math.floor(line.length / 2);
      return line.slice(mid - 25, mid + 25);
    };
    const fresh = pool.filter((line) => !recent.some((r) => r.includes(probe(line))));
    return pickRandom(fresh.length ? fresh : pool);
  }

  /** Rebuild what Grandma Sue "remembers" from the whole conversation. */
  remember(history: BrainMessage[], current?: string): BrainMemory {
    const memory: BrainMemory = { userTurns: 0 };
    const turns = [...history];
    if (current) turns.push({ role: 'user', content: current });

    for (let i = 0; i < turns.length; i++) {
      const m = turns[i];
      if (m.role !== 'user') continue;
      memory.userTurns++;

      const name = this.extractUserName(m.content);
      if (name) memory.userName = name;

      const loss = this.extractLoss(m.content);
      if (loss) {
        // A new loss replaces the old one only if it's a different relation.
        if (!memory.lovedOne || memory.lovedOne.relation !== loss.relation) memory.lovedOne = loss;
        else if (loss.name) memory.lovedOne.name = loss.name;
      }

      // "Her name was Rose" / a bare "Rose" right after Grandma asked for the name.
      if (memory.lovedOne && !memory.lovedOne.name) {
        const prev = turns[i - 1];
        const askedName = prev?.role === 'assistant' && /\bname\b/i.test(prev.content) && /\?/.test(prev.content);
        const named = this.extractLovedOneName(m.content, askedName);
        if (named) memory.lovedOne.name = named;
      }
    }
    return memory;
  }

  /**
   * Try to answer conversationally. Returns 'pass' when the emotion-based engine
   * (validation + advice pools + knowledge base) is the better fit.
   */
  respond(userMessage: string, analysis: EmotionalAnalysis, history: BrainMessage[]): BrainResult {
    const text = userMessage.trim();
    const lower = text.toLowerCase().replace(/[’`]/g, "'");
    const words = wordCount(lower);
    const short = words <= 6;
    const memory = this.remember(history, text);
    const priorUserTurns = history.filter((m) => m.role === 'user').length;
    const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant')?.content || '';
    const calm = analysis.emotionalState === 'neutral' || analysis.emotionalState === 'positive';
    const reply = (t: string): BrainResult => ({ kind: 'reply', text: t });
    const dear = memory.userName || this.pick(['dear', 'sweetheart', 'honey'], history);

    // 1. Someone just told us about a loss: respond to *that*, personally.
    const lossNow = this.extractLoss(text);
    const lossAlreadyKnown = this.remember(history).lovedOne?.relation === lossNow?.relation;
    if (lossNow && !lossAlreadyKnown) {
      return reply(this.lossResponse(lossNow, history));
    }

    // 2. They answered "what was their name?"
    const prevMemory = this.remember(history);
    if (memory.lovedOne?.name && !prevMemory.lovedOne?.name && prevMemory.lovedOne) {
      return reply(this.lovedOneNamedResponse(memory.lovedOne, history));
    }

    // 3. Sharing a memory of the person they lost.
    const upset = ['angry', 'frustrated', 'anxious', 'fearful'].includes(analysis.emotionalState);
    if (memory.lovedOne && !upset && this.isSharingMemory(lower, memory.lovedOne)) {
      return reply(this.memoryResponse(memory.lovedOne, text, history));
    }

    // 4. Introductions.
    const introducedName = this.extractUserName(text);
    if (introducedName && short) {
      return reply(this.pick([
        `${introducedName}! What a lovely name. I'm so glad you told me. Now, ${introducedName}, how is your heart doing today?`,
        `Well, it's a real pleasure to meet you, ${introducedName}. Pull up a chair. What's been on your mind?`,
        `${introducedName}. I'll remember that, dear. What brings you to sit with me today?`,
      ], history));
    }

    // 5. Accepting or declining an offer of suggestions.
    const offeredIdeas = /suggestion|some ideas|few (?:more )?ideas|gentle (?:ideas|suggestions)|things that might help|something that (?:might|could) help/i.test(lastAssistant);
    const wantsToVent = /\b(just (?:want|need) to (?:vent|talk|be heard)|just listen|don't want (?:advice|suggestions)|no advice)\b/.test(lower);
    if (wantsToVent && words <= 12) {
      return reply(this.pick([
        `Of course, ${dear}. No advice, just an open ear. Go on, let it all out. I'm listening.`,
        `Then vent away, ${dear}. I won't try to fix a thing. What's been building up?`,
        `That's perfectly alright. Sometimes we don't need fixing, we just need someone to hear us. Tell me everything.`,
      ], history));
    }
    if (offeredIdeas && short) {
      if (/^(yes|yeah|yea|yep|sure|ok|okay|please|yes please|that would help|go ahead|i'd like that|i would like that|more|more please)\b/.test(lower)) {
        return { kind: 'advice' };
      }
      if (/^(no|nope|not really|not now|no thanks|just listen|i just want to talk|i just need to vent)\b/.test(lower)) {
        return reply(this.pick([
          `Of course, ${dear}. No advice, just an open ear. Go on, I'm listening.`,
          `That's perfectly alright. Sometimes we don't need fixing, we just need someone to hear us. Tell me more.`,
          `Then I'll just sit here with you, ${dear}. Say whatever comes, there's no wrong way to do this.`,
        ], history));
      }
    }

    // 6. Asking for a breathing / calming exercise.
    if (/\b(breath|breathing|breathe|calm (?:me )?down|help me relax|panic attack|grounding|relaxation exercise)\b/.test(lower)) {
      return reply(this.breathingExercise(dear, history));
    }

    // 7. Jokes and stories (a little lightness is medicine too).
    if (/\b(joke|make me laugh|something funny|cheer me up)\b/.test(lower) ||
        (/^(another|one more|again)\b/.test(lower) && /\bjoke|laugh|chuckle|ha!/i.test(lastAssistant))) {
      return reply(this.joke(history));
    }
    if (/\b(tell me a story|a story|story time|tell me about your life|tell me about yourself)\b/.test(lower) ||
        (/^(another|one more)\b/.test(lower) && /story|years ago|when i was/i.test(lastAssistant))) {
      return reply(this.story(history));
    }

    // 8. Who/what is Grandma Sue? Be honest.
    if (/\b(are you (?:a |an )?(?:real|human|bot|robot|ai|person|computer|machine|chatbot)|who are you|what are you|is this (?:a )?(?:bot|ai|real))\b/.test(lower)) {
      return reply(this.pick([
        `I'm Grandma Sue, ${dear}. I'll be honest with you: I'm an AI companion, not a real grandma, though I was made with a lot of grandmotherly love. I can listen, remember what you tell me while we talk, and share gentle ideas. For anything serious, a real person (a counselor, a friend, a helpline) is worth so much more than me. Now, what's on your heart?`,
        `Just an old soul made of code, ${dear}! I'm an AI companion, so I can't hug you or bring you soup, but I can listen as long as you like, and I won't judge a single word. What would you like to talk about?`,
      ], history));
    }

    // 9. Social niceties (only for short, calm messages so we never brush past pain).
    if (short && /^(thank|thanks|thx|ty\b|thank you|that helps|that helped|that was helpful)/.test(lower)) {
      return reply(this.pick([
        `Oh, you're so welcome, ${dear}. Thank *you* for letting me keep you company. Is there anything else sitting on your heart?`,
        `Anytime, ${dear}. That's what I'm here for. How are you feeling now, compared to when we started?`,
        `You're very welcome. I'm proud of you for reaching out, you know. Not everyone does.`,
      ], history));
    }
    if (short && /^(bye|goodbye|good bye|see you|see ya|talk later|gotta go|i have to go|good night|goodnight|night night)/.test(lower)) {
      const night = /night/.test(lower) || new Date().getHours() >= 21;
      return reply(this.pick(night ? [
        `Goodnight, ${dear}. Try to rest that sweet head of yours. I'll be right here whenever you need me.`,
        `Sleep well, ${dear}. Tomorrow is a fresh page. Come back and tell me how it goes.`,
      ] : [
        `Take good care of yourself, ${dear}. My door is always open, come back anytime.`,
        `Off you go then! Drink some water, be gentle with yourself, and come back and visit soon.`,
        `Bye for now, ${dear}. Remember: you don't have to carry everything alone.`,
      ], history));
    }
    if (short && /\b(love you|you're sweet|you are sweet|you're kind|you're the best|you are the best|you're nice)\b/.test(lower)) {
      return reply(this.pick([
        `Oh, stop it, you'll make an old woman blush! You're pretty wonderful yourself, ${dear}.`,
        `Well, aren't you a treasure. That warmed my heart right up. Now, how are *you* doing?`,
      ], history));
    }
    if (short && /^(how are you|how're you|how are u|how r u|how do you do|how's it going|hows it going|how have you been)/.test(lower)) {
      return reply(this.pick([
        `Oh, these old knees are grumbling about the weather, but my heart's happy you stopped by. Now never mind me. How are *you*, ${dear}?`,
        `I'm doing just fine, thank you for asking! I've got my tea and my favorite chair. But I'd much rather hear about you. How's your day been?`,
        `Can't complain, and nobody would listen if I did! Ha! Now tell me, how are you really doing?`,
      ], history));
    }
    if (short && calm && /^(hi|hello|hey|hiya|howdy|good (morning|afternoon|evening)|greetings|yo)\b/.test(lower)) {
      return reply(this.greeting(memory, priorUserTurns > 0, history));
    }

    // 10. "I don't know" / "ok" / "hmm": gently keep the door open.
    if (words <= 4 && /^(i don't know|i dont know|idk|not sure|dunno|hmm+|ok|okay|k|nothing|meh|i guess|whatever|maybe)\b/.test(lower)) {
      return reply(this.pick([
        `That's alright, ${dear}. You don't need to have the words yet. If today had a weather report, what would it be: sunny, cloudy, or stormy?`,
        `No rush at all. We can just sit here a moment together. Sometimes it helps to start small: what's one thing that happened today?`,
        `"I don't know" is a perfectly honest answer. Would it help if I asked you some easier questions, or would you rather I tell you a little story?`,
        `Mm-hmm. I'm still here. Is it more of a heavy feeling, a busy-head feeling, or an empty feeling today?`,
      ], history));
    }

    return { kind: 'pass' };
  }

  /**
   * A reply for neutral small talk mid-conversation. The old engine answered every neutral
   * message with a fresh "Hello there, dear!", which made Grandma Sue feel like a goldfish.
   */
  neutralContinuation(userMessage: string, history: BrainMessage[]): string {
    const memory = this.remember(history, userMessage);
    const dear = memory.userName || this.pick(['dear', 'sweetheart', 'honey'], history);
    const reflected = this.reflect(userMessage);
    const isQuestion = /\?\s*$/.test(userMessage.trim());

    if (isQuestion) {
      return this.pick([
        `Oh, now that's a good question, ${dear}. I'm better at listening than at knowing everything, but I'll tell you what I think: the answer usually becomes clearer when we talk it through. What's got you wondering about it?`,
        `Hmm, let me think on that. What do *you* think, ${dear}? I've found people usually know more than they give themselves credit for.`,
      ], history);
    }
    if (reflected) {
      return this.pick([
        `So ${reflected}. Tell me more about that, ${dear}. How did it feel?`,
        `Mm, ${reflected}. And how are you feeling about it?`,
        `I'm following you, ${dear}: ${reflected}. What happened next?`,
        `Is that so? ${capitalize(reflected.charAt(0)) + reflected.slice(1)}. I'd love to hear more.`,
      ], history);
    }
    const lovedOneLine = memory.lovedOne
      ? ` And how are you holding up with everything about your ${memory.lovedOne.relation}${memory.lovedOne.name ? `, ${memory.lovedOne.name}` : ''}?`
      : '';
    return this.pick([
      `I see, ${dear}. Go on, I'm listening.${lovedOneLine}`,
      `Mm-hmm. Tell me more. I've got all the time in the world for you.${lovedOneLine}`,
      `Oh? Keep going, ${dear}. I want to understand.`,
    ], history);
  }

  /** A short lead-in that shows we heard the person's own words. Empty string if nothing to reflect. */
  reflectionLead(userMessage: string, history: BrainMessage[] = []): string {
    const reflected = this.reflect(userMessage);
    if (!reflected) return '';
    return this.pick([
      `When you say ${reflected}, I can really hear how much that weighs on you.`,
      `${capitalize(reflected.charAt(0)) + reflected.slice(1)}. Oh, I'm so sorry.`,
      `Thank you for telling me that ${reflected}.`,
    ], history);
  }

  /**
   * The old advice blocks were five or six bold paragraphs at once. Keep the intro, two or three
   * tips (preferring ones not shown recently), and the closing question, then offer more.
   */
  trimAdvice(advice: string, history: BrainMessage[], maxTips = 3): string {
    const parts = advice.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length <= maxTips + 2) return advice;
    const intro = parts[0];
    const closing = parts[parts.length - 1];
    const tips = parts.slice(1, -1);
    const recent = history.filter((m) => m.role === 'assistant').slice(-6).map((m) => m.content).join('\n');
    const unseen = tips.filter((t) => !recent.includes(t.slice(0, 40)));
    const pool = unseen.length >= maxTips ? unseen : tips;
    const chosen = [...pool].sort(() => Math.random() - 0.5).slice(0, maxTips);
    const ordered = tips.filter((t) => chosen.includes(t));
    const more = tips.length > maxTips ? `\n\nI have a few more ideas if you'd like them. Just say so.` : '';
    return [intro, ...ordered, closing].join('\n\n') + more;
  }

  /** Swap a name in for a generic endearment now and then, so it feels personal. */
  personalize(text: string, history: BrainMessage[], current?: string): string {
    const { userName } = this.remember(history, current);
    if (!userName || text.includes(userName)) return text;
    const assistantTurns = history.filter((m) => m.role === 'assistant').length;
    if (assistantTurns % 3 !== 1) return text; // roughly every third reply
    return text.replace(/\b(dear|sweetheart|honey)\b/, userName);
  }

  // ---------------------------------------------------------------------------
  // Extraction helpers
  // ---------------------------------------------------------------------------

  extractUserName(text: string): string | undefined {
    const explicit = text.match(/\b(?:my name is|my name's|call me|i am called|i'm called|name's)\s+([A-Za-zÀ-ÿ'-]{2,20})/i);
    if (explicit && !NOT_NAMES.has(explicit[1].toLowerCase())) return capitalize(explicit[1]);
    // "I'm Sarah" / "It's Sarah": only a single capitalised word, so "I'm tired" never counts.
    const casual = text.trim().match(/^(?:hi,?\s+|hello,?\s+|hey,?\s+)?(?:i'm|i am|it's|this is)\s+([A-Z][a-zÀ-ÿ'-]{1,19})[.!]?$/);
    if (casual && !NOT_NAMES.has(casual[1].toLowerCase())) return capitalize(casual[1]);
    return undefined;
  }

  extractLoss(text: string): LovedOne | undefined {
    const lower = text.toLowerCase().replace(/[’`]/g, "'");
    const patterns = [
      new RegExp(`\\b(?:my|our)\\s+(${RELATION_PATTERN})\\b[^.?!]{0,40}?\\b(?:${LOSS_VERBS})\\b`),
      new RegExp(`\\blost\\s+(?:my|our)\\s+(${RELATION_PATTERN})\\b`),
      new RegExp(`\\b(?:death|passing|funeral|loss)\\s+of\\s+(?:my|our)\\s+(${RELATION_PATTERN})\\b`),
      new RegExp(`\\b(?:my|our)\\s+(${RELATION_PATTERN})'?s?\\s+(?:death|passing|funeral)\\b`),
      new RegExp(`\\bmy\\s+late\\s+(${RELATION_PATTERN})\\b`),
    ];
    for (const p of patterns) {
      const m = lower.match(p);
      if (m) {
        const relation = m[1];
        const lovedOne: LovedOne = { relation, kind: RELATIONS[relation] || 'relative' };
        // "my mom Rose died" / "my dog, Biscuit, passed"
        const named = text.match(new RegExp(`\\bmy\\s+(?:late\\s+)?${relation}[,]?\\s+([A-Z][a-zÀ-ÿ'-]{1,19})\\b`, 'i'));
        if (named && /^[A-Z]/.test(named[1]) && !NOT_NAMES.has(named[1].toLowerCase()) &&
            !/^(died|passed|is|was|has)$/i.test(named[1])) {
          lovedOne.name = capitalize(named[1]);
        }
        const nameWas = this.extractLovedOneName(text, false);
        if (nameWas) lovedOne.name = nameWas;
        return lovedOne;
      }
    }
    return undefined;
  }

  private extractLovedOneName(text: string, askedForName: boolean): string | undefined {
    const m = text.match(/\b(?:her|his|their|its) name (?:was|is)\s+([A-Za-zÀ-ÿ'-]{2,20})/i) ||
              text.match(/\b(?:named|called)\s+([A-Z][a-zÀ-ÿ'-]{1,19})/);
    if (m && !NOT_NAMES.has(m[1].toLowerCase())) return capitalize(m[1]);
    if (askedForName) {
      const bare = text.trim().match(/^(?:it was|it's|its|she was|he was)?\s*([A-Za-zÀ-ÿ'-]{2,20})[.!]?$/i);
      if (bare && !NOT_NAMES.has(bare[1].toLowerCase()) && !/^(yes|no|why|what|nothing)$/i.test(bare[1])) {
        return capitalize(bare[1]);
      }
    }
    return undefined;
  }

  /**
   * Turn "I feel like nobody listens to me" into "you feel like nobody listens to you".
   * Only reflects short first-person statements so the grammar stays natural.
   */
  reflect(text: string): string {
    const first = text.trim().split(/(?<=[.!?])\s+/)[0].replace(/[.!?]+$/, '').trim();
    if (!first || first.endsWith('?')) return '';
    const lower = first.toLowerCase().replace(/[’`]/g, "'");
    if (!/^(i|i'm|i've|i'd|i'll|my|me)\b/.test(lower)) return '';
    const words = lower.split(/\s+/);
    if (words.length < 3 || words.length > 16) return '';
    const swaps: Record<string, string> = {
      i: 'you', "i'm": "you're", "i've": "you've", "i'd": "you'd", "i'll": "you'll", me: 'you', my: 'your',
      mine: 'yours', myself: 'yourself', your: 'my', yours: 'mine',
      yourself: 'myself', "you're": "I'm", "you've": "I've",
    };
    // "was" only flips when it follows "I" ("I was" → "you were"), not "it was".
    return words
      .map((w, i) => {
        if (w === 'was') return words[i - 1] === 'i' ? 'were' : 'was';
        if (w === 'am') return words[i - 1] === 'i' ? 'are' : 'am';
        if (w === 'you') return /^(are|were|'re)$/.test(words[i + 1] || '') ? 'I' : 'me';
        if (w === 'are' && words[i - 1] === 'you') return 'am';
        if (w === 'were' && words[i - 1] === 'you') return 'was';
        return swaps[w] ?? w;
      })
      .join(' ');
  }

  private isSharingMemory(lower: string, lovedOne: LovedOne): boolean {
    // Must name them, or use a clearly nostalgic phrase ("she used to"), so a story about
    // a boss ("she always yells at me") isn't mistaken for a fond memory.
    const mentions = lower.includes(lovedOne.relation) || (lovedOne.name ? lower.includes(lovedOne.name.toLowerCase()) : false) ||
      /\b(she|he|they)\s+(used to|taught me|loved to|would always)\b/.test(lower);
    const reminiscing = /\b(used to|always|remember|loved|would|taught me|favorite|favourite|every (?:sunday|summer|morning|christmas|year)|we (?:went|had|used))\b/.test(lower);
    return mentions && reminiscing && wordCount(lower) >= 5;
  }

  // ---------------------------------------------------------------------------
  // Response builders
  // ---------------------------------------------------------------------------

  private pronoun(lovedOne: LovedOne) {
    if (FEMALE.has(lovedOne.relation)) return { subj: 'she', obj: 'her', poss: 'her' };
    if (MALE.has(lovedOne.relation)) return { subj: 'he', obj: 'him', poss: 'his' };
    return { subj: 'they', obj: 'them', poss: 'their' };
  }

  private lossResponse(lovedOne: LovedOne, history: BrainMessage[]): string {
    const rel = lovedOne.relation;
    const p = this.pronoun(lovedOne);
    const byKind: Record<RelationKind, string[]> = {
      parent: [
        `There's no one quite like the person who raised us, and losing them can shake the very ground under your feet.`,
        `Losing a parent changes the whole shape of the world. Nobody is ever really ready for it, no matter how old we are.`,
      ],
      grandparent: [
        `Grandparents hold so much of our story. Losing one can feel like a whole library has closed its doors.`,
        `I know a thing or two about being a grandparent, and I can tell you: ${p.subj} loved you more than words could say.`,
      ],
      partner: [
        `When we lose the person we shared our days with, even the quiet in the house sounds different.`,
        `Losing your ${rel} means losing your everyday person: the one you told the little things to. That is an enormous loss.`,
      ],
      child: [
        `There are no words big enough for losing a child. I'm so, so sorry. Whatever you're feeling right now, it is allowed.`,
      ],
      sibling: [
        `A ${rel} knows us from the very beginning. That's a deep and particular kind of loss.`,
      ],
      friend: [
        `Friends are the family we choose. Losing one leaves a real hole in the world.`,
      ],
      pet: [
        `People who haven't loved an animal sometimes don't understand, but this is real grief. ${capitalize(p.subj)} ${p.subj === 'they' ? 'were' : 'was'} family.`,
        `Our animals love us without conditions, so of course losing ${p.obj} hurts this much. That's love with nowhere to go.`,
      ],
      relative: [
        `Losing family, any family, leaves an ache that's hard to explain to anyone else.`,
      ],
    };
    const opening = this.pick([
      `Oh, sweetheart. I'm so sorry about your ${rel}.`,
      `Oh, my dear. Your ${rel}... I'm so very sorry.`,
      `Come here, honey. I'm so sorry you lost your ${rel}.`,
    ], history);
    const ask = lovedOne.name
      ? `${lovedOne.name}. What a name to carry in your heart. Would you tell me a little about ${p.obj}?`
      : this.pick([
          `What was ${p.poss} name, if you'd like to share it?`,
          `Would you tell me ${p.poss} name? I'd like to know who we're remembering.`,
        ], history);
    return `${opening} ${this.pick(byKind[lovedOne.kind], history)}\n\n${ask}`;
  }

  private lovedOneNamedResponse(lovedOne: LovedOne, history: BrainMessage[]): string {
    const p = this.pronoun(lovedOne);
    const name = lovedOne.name!;
    return this.pick([
      `${name}. What a beautiful name. Thank you for sharing ${p.obj} with me.\n\nWhat's something about ${name} that always makes you smile, even now?`,
      `${name}... I'll hold that name gently. Tell me about ${p.obj}, dear. What was ${name} like?`,
      `Oh, ${name}. I can tell from the way you say it that ${p.subj} ${p.subj === 'they' ? 'were' : 'was'} loved. What do you miss most?`,
    ], history);
  }

  private memoryResponse(lovedOne: LovedOne, text: string, history: BrainMessage[]): string {
    const who = lovedOne.name || `your ${lovedOne.relation}`;
    const p = this.pronoun(lovedOne);
    const reflected = this.reflect(text);
    const echo = reflected ? ` ${capitalize(reflected.charAt(0)) + reflected.slice(1)}. I can just picture it.` : '';
    return this.pick([
      `Oh, I love that.${echo} Those little things are the threads that keep ${who} close to you.\n\nWhat else do you remember?`,
      `Thank you for sharing that memory of ${who}, dear.${echo} It sounds like ${p.subj} left a real mark on your heart.\n\nHow does it feel to talk about ${p.obj}?`,
      `That made me smile.${echo} Grief is just love that's lost its address, and you clearly loved ${who} so much.\n\nIs there something you wish you could tell ${p.obj} today?`,
    ], history);
  }

  private greeting(memory: BrainMemory, returning: boolean, history: BrainMessage[]): string {
    const hour = new Date().getHours();
    const name = memory.userName ? `, ${memory.userName}` : '';
    const dear = memory.userName || 'dear';

    if (returning) {
      const followUp = memory.lovedOne
        ? `I've been thinking about you and your ${memory.lovedOne.relation}${memory.lovedOne.name ? `, ${memory.lovedOne.name}` : ''}. How have you been holding up?`
        : `How have things been since we last talked?`;
      return this.pick([
        `Well, look who it is! Welcome back${name}. ${followUp}`,
        `There you are${name}! I was hoping you'd stop by again. ${followUp}`,
      ], history);
    }

    if (hour >= 23 || hour < 5) {
      return this.pick([
        `Oh, you're up late${name}. Is sleep being stubborn tonight, or is something keeping your mind busy?`,
        `Hello, night owl${name}. The late hours can feel lonely. I'm glad you came to sit with me. What's keeping you up?`,
      ], history);
    }
    const part = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return this.pick([
      `Good ${part}${name}! Come sit with me. I just put the kettle on. How are you feeling today?`,
      `Well hello there${name}! Isn't it nice to have a little company this ${part}? What's on your mind?`,
      `Hello, ${dear}! I'm so glad you're here. Is this more of a "just chatting" visit or a "something's on my heart" visit?`,
    ], history);
  }

  private breathingExercise(dear: string, history: BrainMessage[]): string {
    return this.pick([
      `Let's do this together, ${dear}. Drop your shoulders for me first.\n\n1. Breathe in through your nose for **4**... 2... 3... 4.\n2. Hold it gently for **4**.\n3. Now let it out slowly through your mouth for **6**, like you're cooling a spoonful of soup.\n\nLet's do that three more times. I'll wait right here. How does your body feel now?`,
      `Alright, ${dear}, let's bring you back to right here, right now. Look around and find:\n\n• **5** things you can see\n• **4** things you can touch\n• **3** things you can hear\n• **2** things you can smell\n• **1** thing you can taste\n\nTake your time. There's no hurry at all. Tell me what you noticed, if you like.`,
      `Put one hand on your chest and one on your tummy, ${dear}. Breathe in slowly so the hand on your tummy rises, not the one on your chest. Then breathe out even slower.\n\nDo that five times, nice and easy. Your body knows how to calm down; we're just reminding it. How are you feeling?`,
    ], history);
  }

  private joke(history: BrainMessage[]): string {
    return this.pick([
      `Alright, here's one my late husband Harold used to tell: Why did the scarecrow win an award? Because he was *outstanding in his field*! Ha! He told that one every single harvest.`,
      `What do you call a sleeping dinosaur? A dino-*snore*! My grandkids groan every time, but they always laugh in the end.`,
      `Why don't eggs tell jokes? They'd crack each other up! Oh, I do love a good silly one.`,
      `I told my doctor I broke my arm in two places. He told me to stop going to those places! Ha! Old jokes are the best jokes.`,
      `What did the teapot say to the kettle? "Don't get too steamed up, dear." That one's my motto, really.`,
      `Why did the cookie go to the doctor? Because it felt *crummy*. If you're feeling a bit crummy yourself, I'm right here.`,
    ], history) + `\n\nWant another, or shall we chat a while?`;
  }

  private story(history: BrainMessage[]): string {
    return this.pick([
      `Years ago, when my Harold passed, I couldn't bring myself to touch his garden. The weeds grew, the roses drooped. Then one spring my neighbor knocked with two cups of coffee and said, "Let's just pull ten weeds today." Just ten. We did that every morning for a month.\n\nI learned that grief doesn't need a big plan, just ten weeds at a time. Is there one small thing like that you could do this week?`,
      `When I was a girl, my mother kept a jar on the windowsill. Whenever something good happened, even something tiny, she wrote it on a scrap of paper and dropped it in. On hard nights she'd tip the jar out and we'd read them together.\n\nGood moments are easy to forget when we're hurting. What's one small good thing from this week we could put in your jar?`,
      `My grandson once asked why I talk to my plants. I told him, "Because they listen, and because they grow when someone pays attention." I think people are the same. We grow when someone pays attention to us.\n\nI'm paying attention to you right now. What would you like to tell me?`,
      `There was a winter, oh, a long time ago, when everything went wrong at once: money, health, a falling-out with my sister. I remember sitting at the kitchen table thinking spring would never come. But it did. It always does, even when we can't imagine it.\n\nWhat season does your life feel like right now, dear?`,
    ], history);
  }
}

export const grandmaSueLocalBrain = new GrandmaSueLocalBrain();
