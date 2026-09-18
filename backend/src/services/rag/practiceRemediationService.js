/**
 * SalinTinig — Practice Story Remediation Service
 *
 * Generates AI-powered follow-up/remedial questions for Practice Stories
 * when a student answers a main quiz question incorrectly.
 *
 * Strategy (Ultra-Low Token Usage ~180-220 tokens/request):
 *   1. Micro-RAG Chunking: Extracts only the 2-3 most relevant sentences (~70-90 words).
 *   2. Compact Prompting:  Uses abbreviated JSON output keys (h, q, o, a).
 *   3. In-Memory LRU Cache: Reuses cached AI responses for identical combos.
 *   4. Safe Fallback: Returns pre-stored `explanation` if GROQ AI is unavailable.
 *
 * GROQ Free Tier: 14,400 requests/day & 500,000 tokens/day (resets daily at midnight UTC).
 * Estimated ~200 tokens per remediation call → ~2,500 follow-up questions/day max on free tier.
 */

'use strict';

const Groq = require('groq-sdk');

// ── In-Memory LRU Cache (Simple Map, max 200 entries) ───────────────────────
const MAX_CACHE_SIZE = 200;
const _cache = new Map();

function _getCacheKey(materialId, questionText, selectedOptionIndex) {
  return `${materialId}::${questionText.slice(0, 60)}::${selectedOptionIndex}`;
}

function _getFromCache(key) {
  if (!_cache.has(key)) return null;
  // Move to end (LRU refresh)
  const value = _cache.get(key);
  _cache.delete(key);
  _cache.set(key, value);
  return value;
}

function _setInCache(key, value) {
  if (_cache.size >= MAX_CACHE_SIZE) {
    // Evict oldest (first) entry
    const oldestKey = _cache.keys().next().value;
    _cache.delete(oldestKey);
  }
  _cache.set(key, value);
}

// ── Micro-RAG: Extract 2-3 most relevant sentences from story text ──────────
/**
 * Extracts the most relevant ~70-90 word snippet from the story's content_text
 * based on keyword overlap with the question text.
 *
 * @param {string} contentText - Full story text from reading_materials
 * @param {string} questionText - The quiz question the student got wrong
 * @returns {string}
 */
function extractRelevantSnippet(contentText, questionText) {
  if (!contentText || !questionText) return '';

  const sentences = contentText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  if (sentences.length === 0) return contentText.slice(0, 300);

  const stopWords = new Set([
    'ang', 'ng', 'sa', 'na', 'at', 'ay', 'si', 'ni', 'para',
    'the', 'a', 'an', 'in', 'of', 'to', 'for', 'and', 'or',
    'is', 'was', 'are', 'were', 'did', 'do', 'does',
    'what', 'who', 'why', 'how', 'when', 'where', 'which',
  ]);

  const questionWords = questionText
    .toLowerCase()
    .replace(/[?.,!]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  const scored = sentences.map((sentence) => {
    const lower = sentence.toLowerCase();
    const score = questionWords.reduce(
      (acc, word) => acc + (lower.includes(word) ? 1 : 0),
      0
    );
    return { sentence, score };
  });

  scored.sort((a, b) => b.score - a.score);

  let snippet = '';
  let wordCount = 0;
  for (const { sentence } of scored) {
    const words = sentence.split(/\s+/).length;
    if (wordCount + words > 110) break;
    snippet += (snippet ? ' ' : '') + sentence;
    wordCount += words;
    if (wordCount >= 60) break;
  }

  return snippet.trim() || sentences.slice(0, 3).join(' ').slice(0, 400);
}

// ── GROQ AI Remediation ──────────────────────────────────────────────────────
/**
 * Generate a remedial follow-up question using GROQ AI + Micro-RAG.
 *
 * @param {object} params
 * @param {string} params.materialId
 * @param {string} params.contentText
 * @param {string} params.questionText
 * @param {string[]} params.options
 * @param {number} params.selectedOptionIndex
 * @param {number} params.correctOptionIndex
 * @param {string} [params.explanation]
 * @param {string} [params.language]
 * @returns {Promise<{hint:string, followUpQuestion:string, options:string[], correctAnswerIndex:number, fromCache:boolean, fallback:boolean}>}
 */
async function generateRemedialQuestion({
  materialId,
  contentText,
  questionText,
  options,
  selectedOptionIndex,
  correctOptionIndex,
  explanation = '',
  language = 'fil',
}) {
  const cacheKey = _getCacheKey(materialId, questionText, selectedOptionIndex);

  // 1. Cache check — 0 tokens consumed on hit
  const cached = _getFromCache(cacheKey);
  if (cached) {
    console.log(`[GROQ Remediation Service]: Cache HIT for Material #${materialId}. 0 tokens consumed.`);
    return { ...cached, fromCache: true, fallback: false };
  }

  // 2. Micro-RAG snippet
  const snippet = extractRelevantSnippet(contentText, questionText);
  const wrongOption = (options && options[selectedOptionIndex]) || `Option ${selectedOptionIndex + 1}`;
  const correctOption = (options && options[correctOptionIndex]) || `Option ${correctOptionIndex + 1}`;
  const isEnglish = language === 'en';

  // 3. Ultra-compact system + user prompts
  const systemPrompt = isEnglish
    ? 'You are a reading tutor. Output ONLY valid JSON with keys: h (hint ≤15 words from story), q (follow-up question ≤12 words), o (array of exactly 3 short options ≤5 words each), a (correct option index 0-2), e (exactly 1 short sentence explaining why the correct option is right). No extra text.'
    : 'Ikaw ay guro sa pagbabasa. I-output lamang ang valid JSON: h (pahiwatig ≤15 salita mula sa kuwento), q (follow-up tanong ≤12 salita), o (array ng tatlong maikling pagpipilian ≤5 salita bawat isa), a (tamang index 0-2), e (eksaktong 1 maikling pangungusap na nagpapaliwanag kung bakit tama ang sagot). Walang dagdag.';

  const userPrompt = [
    `Story: "${snippet}"`,
    `Q: ${questionText}`,
    `Student chose: "${wrongOption}" (wrong). Correct: "${correctOption}"`,
    isEnglish
      ? 'Give a simpler follow-up question and 1 short explanation sentence.'
      : 'Magbigay ng mas simpleng follow-up na tanong at 1 maikling pangungusap na paliwanag.',
  ].join('\n');

  // 4. Validate API key before calling
  const groqKey = (process.env.GROQ_API_KEY || '').replace(/['"]/g, '').trim();
  if (!groqKey || groqKey === 'gsk_your_groq_api_key_here') {
    console.warn('[GROQ Remediation Notice]: GROQ_API_KEY is not set or contains default placeholder — using static fallback.');
    return _buildFallback(explanation, isEnglish, options, correctOptionIndex);
  }

  // 5. Call GROQ
  try {
    const modelName = 'qwen/qwen3.8-27b';
    console.log(`[GROQ Remediation Service]: Generating remedial follow-up question with Groq (${modelName}) in ${language.toUpperCase()} mode...`);
    const groq = new Groq({ apiKey: groqKey });

    const completion = await groq.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.35,
      max_tokens: 180,
      response_format: { type: 'json_object' },
    });

    const raw = ((completion.choices || [])[0] || {});
    const rawContent = ((raw.message || {}).content || '').trim();
    if (!rawContent) throw new Error('Empty GROQ response');

    const parsed = JSON.parse(rawContent);
    const result = {
      hint: String(parsed.h || '').trim(),
      followUpQuestion: String(parsed.q || '').trim(),
      options: Array.isArray(parsed.o) ? parsed.o.map(String) : [],
      correctAnswerIndex: typeof parsed.a === 'number' ? parsed.a : 0,
      explanation: String(parsed.e || parsed.explanation || '').trim(),
      fromCache: false,
      fallback: false,
    };

    if (!result.hint || !result.followUpQuestion || result.options.length < 2) {
      throw new Error('GROQ response missing required fields');
    }

    // Cache for future hits
    _setInCache(cacheKey, {
      hint: result.hint,
      followUpQuestion: result.followUpQuestion,
      options: result.options,
      correctAnswerIndex: result.correctAnswerIndex,
      explanation: result.explanation,
    });

    const usage = completion.usage || {};
    console.log(
      `[GROQ Remediation Service]: Remediation generated successfully. Tokens: ${usage.prompt_tokens || 0} prompt + ${usage.completion_tokens || 0} completion = ${usage.total_tokens || 0} total. Follow-up: "${result.followUpQuestion.substring(0, 80)}"`
    );

    return result;
  } catch (err) {
    console.error('[GROQ Remediation Error - Groq]:', err.message, '— falling back to static remediation.');
    return _buildFallback(explanation, isEnglish, options, correctOptionIndex);
  }
}

/**
 * Static fallback when GROQ AI is unavailable or rate-limited.
 */
function _buildFallback(explanation, isEnglish, options, correctOptionIndex) {
  const correctOption = (options && options[correctOptionIndex]) || '';
  const distractors = (options || []).filter((_, i) => i !== correctOptionIndex).slice(0, 2);
  const fallbackOptions = [correctOption, ...distractors].slice(0, 3);

  return {
    hint:
      explanation ||
      (isEnglish
        ? 'Re-read the story and look for the key detail.'
        : 'Basahin muli ang kuwento at hanapin ang mahalagang detalye.'),
    followUpQuestion: isEnglish
      ? 'Based on the story, which answer is correct?'
      : 'Batay sa kuwento, alin ang tamang sagot?',
    options:
      fallbackOptions.length >= 2
        ? fallbackOptions
        : isEnglish
        ? ['True', 'False']
        : ['Tama', 'Mali'],
    correctAnswerIndex: 0,
    explanation: explanation || (isEnglish ? 'This is supported by the story.' : 'Ito ay batay sa kuwento.'),
    fromCache: false,
    fallback: true,
  };
}

module.exports = { generateRemedialQuestion };
