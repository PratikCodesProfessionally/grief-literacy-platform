/**
 * Grandma Sue Test Suite
 * 
 * Run with: npx tsx client/src/tests/grandmaSue.test.ts
 */

import { emotionalAnalysisService } from '../services/EmotionalAnalysisService';
import { crisisDetectionService } from '../services/CrisisDetectionService';
import { knowledgeBaseService } from '../services/KnowledgeBaseService';

// Colors for console output
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean) {
  try {
    const result = fn();
    if (result) {
      console.log(`${green}✓${reset} ${name}`);
      passed++;
    } else {
      console.log(`${red}✗${reset} ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`${red}✗${reset} ${name} - Error: ${error}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('  GRANDMA SUE TEST SUITE');
console.log('='.repeat(60) + '\n');

// ============================================
// Emotional Analysis Tests
// ============================================
console.log(`${yellow}▸ Emotional Analysis Tests${reset}\n`);

test('Detects anxiety emotional state', () => {
  const analysis = emotionalAnalysisService.analyze("I've been feeling really anxious and worried about everything");
  return analysis.emotionalState === 'anxious';
});

test('Detects sadness emotional state', () => {
  const analysis = emotionalAnalysisService.analyze("I feel so sad and unhappy, I can't stop crying");
  return analysis.emotionalState === 'sad';
});

test('Detects hopelessness emotional state', () => {
  const analysis = emotionalAnalysisService.analyze("Everything feels hopeless, there's no point to anything");
  return analysis.emotionalState === 'hopeless';
});

test('Detects loneliness emotional state', () => {
  const analysis = emotionalAnalysisService.analyze("I feel so lonely and isolated, nobody cares about me");
  return analysis.emotionalState === 'lonely';
});

test('Detects positive emotional state', () => {
  const analysis = emotionalAnalysisService.analyze("I'm feeling happy and grateful today, things are getting better");
  return analysis.emotionalState === 'positive';
});

test('Identifies grief problem type', () => {
  const analysis = emotionalAnalysisService.analyze("My mother died last month and I miss her so much");
  return analysis.problemType === 'grief';
});

test('Identifies relationship problem type', () => {
  const analysis = emotionalAnalysisService.analyze("My boyfriend and I had a huge fight about our relationship");
  return analysis.problemType === 'relationship';
});

test('Identifies work problem type', () => {
  const analysis = emotionalAnalysisService.analyze("My boss is terrible and I hate my job");
  return analysis.problemType === 'work';
});

test('Detects high emotional intensity', () => {
  const analysis = emotionalAnalysisService.analyze("I can't take this anymore, I'm falling apart, this is unbearable!");
  return analysis.emotionalIntensity === 'high' || analysis.emotionalIntensity === 'crisis';
});

test('Identifies validation as user need', () => {
  const analysis = emotionalAnalysisService.analyze("Am I wrong to feel this way? Is it normal to be upset?");
  return analysis.userNeeds.includes('validation');
});

test('Identifies advice as user need', () => {
  const analysis = emotionalAnalysisService.analyze("What should I do? How can I fix this situation?");
  return analysis.userNeeds.includes('advice');
});

// ============================================
// Crisis Detection Tests
// ============================================
console.log(`\n${yellow}▸ Crisis Detection Tests${reset}\n`);

test('Detects suicidal ideation', () => {
  const assessment = crisisDetectionService.assess("I want to kill myself");
  return assessment.isCrisis === true && assessment.crisisTypes.includes('suicidal-ideation');
});

test('Detects suicide plan (high risk)', () => {
  const assessment = crisisDetectionService.assess("I have a plan to end it all tonight");
  return assessment.riskLevel === 'high' || assessment.riskLevel === 'imminent';
});

test('Detects self-harm', () => {
  const assessment = crisisDetectionService.assess("I've been cutting myself to cope with the pain");
  return assessment.isCrisis === true && assessment.crisisTypes.includes('self-harm');
});

test('Detects domestic violence', () => {
  const assessment = crisisDetectionService.assess("My husband hits me and I'm afraid he'll hurt me again");
  return assessment.isCrisis === true && assessment.crisisTypes.includes('abuse-victim');
});

test('Provides crisis resources for suicidal content', () => {
  const assessment = crisisDetectionService.assess("I don't want to live anymore");
  return assessment.resources.length > 0 && assessment.resources.some(r => r.contact.includes('988'));
});

test('No crisis for normal conversation', () => {
  const assessment = crisisDetectionService.assess("I had a nice day today, feeling grateful");
  return assessment.isCrisis === false && assessment.riskLevel === 'none';
});

test('No crisis for past tense discussion', () => {
  const assessment = crisisDetectionService.assess("In the past I used to feel hopeless but I'm better now");
  // Should have lower confidence due to past tense
  return assessment.riskLevel !== 'imminent';
});

test('Quick check identifies crisis keywords', () => {
  return crisisDetectionService.quickCheck("I want to kill myself") === true;
});

test('Quick check passes normal content', () => {
  return crisisDetectionService.quickCheck("I had a nice lunch today") === false;
});

// ============================================
// Knowledge Base Tests
// ============================================
console.log(`\n${yellow}▸ Knowledge Base Tests${reset}\n`);

test('Has embedded knowledge chunks', () => {
  const count = knowledgeBaseService.getChunkCount();
  return count > 10; // Should have at least 10+ embedded chunks
});

test('Retrieves relevant chunks for anxiety', () => {
  const result = knowledgeBaseService.retrieve("I'm feeling anxious", 'anxious', 'anxiety', 5);
  return result.chunks.length > 0 && result.topicMatch.includes('anxiety');
});

test('Retrieves relevant chunks for grief', () => {
  const result = knowledgeBaseService.retrieve("My mother died", 'sad', 'grief', 5);
  return result.chunks.length > 0 && result.topicMatch.includes('grief');
});

test('Retrieves crisis content for crisis queries', () => {
  const result = knowledgeBaseService.retrieve("I want to end it all", 'hopeless', 'crisis', 5);
  return result.crisisIndicators === true || result.topicMatch.includes('crisis');
});

test('Retrieves appropriate techniques for anxiety', () => {
  const result = knowledgeBaseService.retrieve("I'm having a panic attack", 'anxious', 'anxiety', 5);
  return result.techniques.includes('grounding') || result.techniques.includes('validation');
});

test('Documents array is accessible', () => {
  const docs = knowledgeBaseService.getDocuments();
  return Array.isArray(docs);
});

// ============================================
// Results Summary
// ============================================
console.log('\n' + '='.repeat(60));
console.log('  TEST RESULTS');
console.log('='.repeat(60));
console.log(`\n  ${green}Passed: ${passed}${reset}`);
console.log(`  ${red}Failed: ${failed}${reset}`);
console.log(`  Total:  ${passed + failed}\n`);

if (failed > 0) {
  console.log(`${red}Some tests failed. Please review the implementation.${reset}\n`);
  process.exit(1);
} else {
  console.log(`${green}All tests passed! ✓${reset}\n`);
  process.exit(0);
}
