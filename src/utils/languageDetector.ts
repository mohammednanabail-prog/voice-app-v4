/**
 * Language detection and text segmentation utilities
 * Specifically optimized for mixed French, Arabic, and English educational/translation texts.
 */

export interface DetectedLanguage {
  lang: 'ar' | 'fr' | 'en' | string;
  langName: string;
  flag: string;
}

const ARABIC_REGEX = /[\u0600-\u06FF]/;
const FRENCH_ACCENTS_REGEX = /[éèêëàâäîïôöùûüçœæÉÈÊËÀÂÄÎÏÔÖÙÛÜÇŒÆ]/;
const FRENCH_APOSTROPHE_REGEX = /\b(j'|l'|c'|d'|n'|m'|t'|s'|qu'|jusqu'|lorsqu')/i;

const FRENCH_EXPRESSIONS_REGEX =
  /\b(excusez-moi|s'il vous plaît|s'il te plaît|s'il-vous-plaît|de rien|au revoir|à bientôt|à plus tard|rendez-vous|c'est-à-dire|peut-être|vas-y|allez-y|avez-vous|comment-allez-vous|parlez-vous|je vous en prie)\b/i;

const FRENCH_WORDS_REGEX =
  /\b(excusez|excuse|moi|toi|lui|nous|vous|eux|leur|leurs|bonjour|bonsoir|salut|merci|pardon|enchanté|bienvenue|au revoir|adieu|oui|non|d'accord|si|voilà|voici|monsieur|madame|mademoiselle|ami|amie|frère|soeur|père|mère|maison|travail|temps|jour|journée|soir|soirée|nuit|matin|aujourd'hui|demain|hier|maintenant|toujours|jamais|souvent|parfois|très|trop|beaucoup|peu|plus|moins|aussi|bien|mal|mieux|rien|tout|tous|toute|toutes|autre|autres|même|chaque|chose|personne|comment|pourquoi|quand|qui|que|quoi|quel|quelle|quels|quelles|le|la|les|un|une|des|du|de|ce|cet|cette|ces|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|nos|votre|vos|je|tu|il|elle|on|ils|elles|et|ou|mais|donc|car|avec|dans|sur|sous|pour|par|sans|chez|vers|suis|es|est|sommes|êtes|sont|été|ai|as|a|avons|avez|ont|eu|fais|fait|font|vais|vas|va|allons|allez|vont|peux|peut|veut|veux|sais|sait|parle|parlez|parles|parlons|comprends|comprend|langue|français|française)\b/i;

const ENGLISH_WORDS_REGEX =
  /\b(hello|hi|how|are|you|welcome|thank|thanks|please|sorry|excuse me|bye|goodbye|morning|evening|night|yes|no|what|where|when|why|who|which|this|that|these|those|the|is|am|are|was|were|been|have|has|had|do|does|did|will|would|can|could|should|shall|may|might|must|i|he|she|it|we|they|me|him|her|us|them|my|your|his|our|their|in|on|at|by|for|with|about|into|through|during|before|after|to|from|up|down|out|over|under|again|here|there|all|any|both|each|few|more|most|other|some|such|not|only|own|same|so|than|too|very|just|now|english|friend|good|bad)\b/i;

/**
 * Detect language of a segment with context awareness
 */
export function detectSegmentLanguage(
  text: string,
  contextPairHint?: 'fr' | 'en' | 'ar' | string
): DetectedLanguage {
  const trimmed = text.trim();
  if (!trimmed) {
    return { lang: 'fr', langName: 'فرنسية', flag: '🇫🇷' };
  }

  // 1. Arabic: if it contains any Arabic characters
  if (ARABIC_REGEX.test(trimmed)) {
    return { lang: 'ar', langName: 'عربية', flag: '🇸🇦' };
  }

  // 2. Clear French signals
  if (
    FRENCH_ACCENTS_REGEX.test(trimmed) ||
    FRENCH_APOSTROPHE_REGEX.test(trimmed) ||
    FRENCH_EXPRESSIONS_REGEX.test(trimmed) ||
    FRENCH_WORDS_REGEX.test(trimmed)
  ) {
    return { lang: 'fr', langName: 'فرنسية', flag: '🇫🇷' };
  }

  // 3. French verbal/adverbial endings: -ez (e.g. Parlez, Excusez), -ons, -euse, -ment
  if (
    /\b\w+(ez|ons|euse)\b/i.test(trimmed) ||
    (/\b\w+ment\b/i.test(trimmed) && !/\b(movement|moment|government|payment|element)\b/i.test(trimmed))
  ) {
    return { lang: 'fr', langName: 'فرنسية', flag: '🇫🇷' };
  }

  // 4. Distinct English vocabulary
  if (ENGLISH_WORDS_REGEX.test(trimmed)) {
    return { lang: 'en', langName: 'إنجليزية', flag: '🇬🇧' };
  }

  // 5. Contextual fallback for Latin text:
  // If the document has French content or default context is French-Arabic, classify as French
  if (contextPairHint === 'en') {
    return { lang: 'en', langName: 'إنجليزية', flag: '🇬🇧' };
  }

  // Default to French for Latin sentences in this app
  return { lang: 'fr', langName: 'فرنسية', flag: '🇫🇷' };
}

/**
 * Cycle through languages when user clicks language toggle
 */
export function getNextLanguage(currentLang: string): { lang: string; langName: string } {
  switch (currentLang.toLowerCase()) {
    case 'fr':
      return { lang: 'ar', langName: 'عربية' };
    case 'ar':
      return { lang: 'en', langName: 'إنجليزية' };
    case 'en':
      return { lang: 'fr', langName: 'فرنسية' };
    default:
      return { lang: 'fr', langName: 'فرنسية' };
  }
}

export interface ParsedSegment {
  id: string;
  text: string;
  lang: string;
  langName: string;
  vocalizedText: string;
  translationPairId?: string;
  role?: 'source' | 'translation' | 'standalone';
}

/**
 * High-speed, infallible segmenter for mixed texts of any length (handles 100+ sentences instantly)
 */
export function parseAndSegmentMultilingualText(rawText: string): {
  detectedPairType: string;
  segments: ParsedSegment[];
} {
  // Normalize newlines and clean lines
  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const units: string[] = [];

  for (const line of rawLines) {
    // If line has both Arabic and Latin characters, split them apart
    const hasAr = ARABIC_REGEX.test(line);
    const hasLatin = /[a-zA-Z]/.test(line);

    if (hasAr && hasLatin) {
      // Split into sentences or clauses
      const parts = line.split(/(?<=[.!?؟])\s+|(?<=[^\u0600-\u06FF])\s+(?=[\u0600-\u06FF])|(?<=[\u0600-\u06FF])\s+(?=[a-zA-Z])/);
      for (const p of parts) {
        const tp = p.trim();
        if (tp) units.push(tp);
      }
    } else {
      // Check if line contains multiple sentence terminators
      const subSentences = line.split(/(?<=[.!?؟])\s+/);
      for (const s of subSentences) {
        const ts = s.trim();
        if (ts) units.push(ts);
      }
    }
  }

  let hasFrench = false;
  let hasArabic = false;
  let hasEnglish = false;

  // First pass: detect presence of languages
  for (const u of units) {
    const det = detectSegmentLanguage(u);
    if (det.lang === 'fr') hasFrench = true;
    if (det.lang === 'ar') hasArabic = true;
    if (det.lang === 'en') hasEnglish = true;
  }

  const contextHint = hasFrench ? 'fr' : hasEnglish ? 'en' : 'fr';

  const segments: ParsedSegment[] = [];
  let currentPairId = 1;

  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const det = detectSegmentLanguage(u, contextHint);

    let role: 'source' | 'translation' | 'standalone' = 'standalone';
    let pairId: string | undefined = undefined;

    // Detect alternating translation pairs (e.g. French line followed by Arabic translation)
    if (i > 0) {
      const prevDet = detectSegmentLanguage(units[i - 1], contextHint);
      if (
        (prevDet.lang === 'fr' && det.lang === 'ar') ||
        (prevDet.lang === 'en' && det.lang === 'ar') ||
        (prevDet.lang === 'ar' && (det.lang === 'fr' || det.lang === 'en'))
      ) {
        pairId = `pair_${currentPairId}`;
        role = 'translation';
        if (segments[i - 1]) {
          segments[i - 1].translationPairId = pairId;
          segments[i - 1].role = 'source';
        }
        currentPairId++;
      }
    }

    segments.push({
      id: `seg_${i + 1}`,
      text: u,
      lang: det.lang,
      langName: det.langName,
      vocalizedText: u,
      translationPairId: pairId,
      role,
    });
  }

  let detectedPairType = 'متعدد اللغات';
  if (hasFrench && hasArabic) detectedPairType = 'فرنسي - عربي';
  else if (hasEnglish && hasArabic) detectedPairType = 'إنجليزي - عربي';
  else if (hasFrench && hasEnglish) detectedPairType = 'فرنسي - إنجليزي';
  else if (hasArabic) detectedPairType = 'عربي';
  else if (hasFrench) detectedPairType = 'فرنسي';
  else if (hasEnglish) detectedPairType = 'إنجليزي';

  return { detectedPairType, segments };
}
