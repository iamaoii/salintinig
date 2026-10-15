import { getApiUrl } from '../../../config/api.js';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { jsPDF } from 'jspdf';
import { CaretLeft, CaretRight, Clock } from '@phosphor-icons/react';
import BackButton from '../../../components/common/BackButton.jsx';
import Avatar from '../../../components/dashboard/student/Avatar.jsx';
import StatCard from '../../../components/dashboard/progress/StatCard.jsx';
import AchievementActivityRow from '../../../components/dashboard/activity/AchievementActivityRow.jsx';
import BadgeCard from '../../../components/dashboard/student/BadgeCard.jsx';
import StoryRow from '../../../components/dashboard/student/StoryRow.jsx';
import { StudentProfileSkeleton } from '../../../components/common/Skeleton.jsx';
import { getToken } from '../../../lib/auth.js';
import { decodeSecureToken } from '../../../lib/securityToken.js';
import { cacheService } from '../../../services/cacheService.js';
import systemLogo from '../../../assets/logo/logo.png';
import {
  getAccuracyInterpretation,
  getComprehensionInterpretation,
  getReadingSpeedInterpretation,
} from '../../../utils/readingAnalyticsHelper.js';

import { defaultBadges, defaultStories } from '../../../data/studentAchievements.js';

const ACHIEVEMENT_TABS = ['Phil-IRI Records', 'Badges', 'Stories', 'Actionable Insights'];

const BADGE_COLUMNS = 5;

function withPlaceholders(items) {
  if (items.length === 0) return items;
  const remainder = items.length % BADGE_COLUMNS;
  const missing = remainder === 0 ? 0 : BADGE_COLUMNS - remainder;
  const placeholders = Array.from({ length: missing }, (_, i) => ({
    id: `placeholder-${i}`,
    placeholder: true,
  }));
  return [...items, ...placeholders];
}

export default function StudentProfile() {
  const { lrn: rawLrn } = useParams();
  const lrn = decodeSecureToken('st', rawLrn);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Phil-IRI Records');
  const [profileLanguage, setProfileLanguage] = useState('fil');
  const [profilePeriod, setProfilePeriod] = useState('pre_test');
  
  const cacheKey = `student_profile_${lrn || rawLrn}`;
  const cachedData = cacheService.get(cacheKey);

  const [dbStudent, setDbStudent] = useState(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);

  useEffect(() => {
    let isMounted = true;
    const fetchStudent = async () => {
      try {
        const token = getToken();
        const targetLrn = lrn || rawLrn;
        if (!cachedData) setLoading(true);

        const res = await fetch(getApiUrl(`/api/teacher/students/${targetLrn}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (isMounted && res.ok && data.success && data.student) {
          setDbStudent(data.student);
          cacheService.set(cacheKey, data.student, 120000); // 2 minutes TTL
        }
      } catch (err) {
        console.warn('Fetch student details notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStudent();
    return () => { isMounted = false; };
  }, [lrn, rawLrn, cacheKey]);

  const student = dbStudent || {
    name: loading ? 'Loading profile...' : `Student (${lrn || ''})`,
    lrn: lrn || '',
    grade: '',
    section: 'Unassigned',
    level: 'Pending Evaluation',
  };
  const selectedAdaptiveProfile = (student.oralAdaptiveProfiles || []).find((profile) => {
    const language = String(profile.language || '').toLowerCase().startsWith('en') ? 'en' : 'fil';
    return language === profileLanguage && String(profile.period || 'pre_test').toLowerCase() === profilePeriod;
  });
  const formatGrade = (value) => {
    if (!value) return '—';
    const grade = String(value).match(/\d+/)?.[0];
    return grade ? `Grade ${grade}` : String(value);
  };

  // Map real database badges or default badge assets (only unlocked badges)
  const badges = (student.badges && student.badges.length > 0)
    ? student.badges.map((b) => {
        const found = defaultBadges.find(
          (db) => db.name.toLowerCase() === (b.badgeName || b.name || '').toLowerCase() ||
                  db.id === (b.id || b.badge_id)
        );
        return {
          id: b.id || b.badge_id || b.badgeName,
          name: b.badgeName || b.name,
          image: found?.image || (b.iconPath ? getApiUrl(b.iconPath) : defaultBadges[0]?.image),
          description: b.description || found?.description,
        };
      })
    : [];

  // Map real database completed stories
  const stories = (student.stories && student.stories.length > 0)
    ? student.stories.map((s) => ({
        id: s.id,
        title: s.title,
        color: s.color || 'blue',
      }))
    : [];

  const activities = (student.activities && student.activities.length > 0)
    ? student.activities
        .filter((act) => act.status === 'done' || act.status === 'completed' || act.status === 'finished')
        .map((act) => ({
          ...act,
          onAction: (a) => {
            if (a.attemptId) {
              navigate(`/teacher/phil-iri-assessments/review/${a.attemptId}`);
            } else if (a.id) {
              navigate(`/teacher/phil-iri-assessments/view/${a.id}`);
            }
          },
        }))
    : [];
  const oralEvidence = activities
    .filter((activity) =>
      activity.assessmentType === 'oral'
      && (String(activity.language || '').toLowerCase().startsWith('en') ? 'en' : 'fil') === profileLanguage
      && String(activity.assessmentPeriod || 'pre_test').toLowerCase() === profilePeriod
    )
    .sort((first, second) => new Date(first.completedAt || 0) - new Date(second.completedAt || 0));
  const evidenceAverage = (key) => oralEvidence.length
    ? Math.round(oralEvidence.reduce((total, activity) => total + Number(activity[key] || 0), 0) / oralEvidence.length)
    : 0;
  const buildDiagnosticEvidence = (profile, evidenceItems) => [
    ['Independent', 'independent', profile?.independentLevel, 'bg-emerald-50 text-emerald-800'],
    ['Instructional', 'instructional', profile?.instructionalLevel, 'bg-amber-50 text-amber-900'],
    ['Frustrational', 'frustrational', profile?.frustrationalLevel, 'bg-rose-50 text-rose-800'],
  ].map(([label, key, level, style]) => {
    const grade = String(level || '').match(/\d+/)?.[0];
    const resultPrefix = key === 'frustrational' ? 'frustr' : key;
    const evidence = evidenceItems.find((activity) =>
      grade && String(activity.passageGradeLevel || '').match(/\d+/)?.[0] === grade
      && (!activity.readingLevelResult || String(activity.readingLevelResult).toLowerCase().startsWith(resultPrefix))
    ) || evidenceItems.find((activity) => String(activity.readingLevelResult || '').toLowerCase().startsWith(resultPrefix));
    return { label, level, style, evidence };
  });
  const diagnosticEvidence = buildDiagnosticEvidence(selectedAdaptiveProfile, oralEvidence);

  // Synthesize Unified Actionable Pedagogical Insights (DepEd Aligned)
  const pedagogicalInsights = useMemo(() => {
    const isTagalog = profileLanguage === 'fil';
    const periodLabel = profilePeriod === 'post_test' ? 'Post-Test' : 'Pre-Test';
    const langLabel = isTagalog ? 'Filipino' : 'English';

    if (!oralEvidence || oralEvidence.length === 0) {
      return {
        hasData: false,
        periodLabel,
        langLabel,
        diagnosisTitle: isTagalog ? 'Wala Pang Datos ng Pagtatasa' : 'No Assessment Data Yet',
        diagnosisText: isTagalog
          ? `Wala pang natapos na oral reading assessment para sa ${periodLabel} (${langLabel}).`
          : `No completed oral reading assessments recorded for ${periodLabel} (${langLabel}).`,
        phonicsItems: [],
        guidedItems: [],
        compItems: [],
      };
    }

    // 1. Gather all miscues from oral assessment attempts in this period/language
    const allMiscues = [];
    oralEvidence.forEach((act) => {
      let mList = act.miscuesJson;
      if (typeof mList === 'string') {
        try { mList = JSON.parse(mList); } catch (_) { mList = []; }
      }
      if (Array.isArray(mList)) {
        allMiscues.push(...mList);
      }
    });

    const miscueCounts = {
      substitution: 0,
      mispronunciation: 0,
      omission: 0,
      insertion: 0,
      repetition: 0,
      transposition: 0,
      refusal_to_read: 0,
    };

    allMiscues.forEach((m) => {
      const type = String(m.miscue_type || m.type || '').toLowerCase();
      if (miscueCounts[type] !== undefined) {
        miscueCounts[type]++;
      }
    });

    const totalMiscues = Object.values(miscueCounts).reduce((a, b) => a + b, 0);

    // 2. Average Scores and Evidence Passages
    const avgAccuracy = evidenceAverage('accuracyScore');
    const avgComp = evidenceAverage('comprehensionScore');
    const avgSpeed = evidenceAverage('readingSpeed');

    // Sort miscues to find top 2 error patterns
    const sortedMiscues = Object.entries(miscueCounts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a);

    const primaryType = sortedMiscues[0]?.[0] || 'substitution';
    const primaryCount = sortedMiscues[0]?.[1] || 0;
    const secondaryType = sortedMiscues[1]?.[0] || null;
    const secondaryCount = sortedMiscues[1]?.[1] || 0;

    const dominantPct = totalMiscues > 0 ? Math.round((primaryCount / totalMiscues) * 100) : 0;

    // Detailed Diagnosis Title & Narrative based on actual multi-dimensional metrics
    let diagnosisTitle = '';
    let diagnosisText = '';

    if (totalMiscues === 0 && avgAccuracy >= 95 && avgComp >= 80) {
      diagnosisTitle = isTagalog ? 'Matatag at Huwarang Katatasan sa Pagbasa' : 'Mastery & Exemplary Reading Fluency';
      diagnosisText = isTagalog
        ? `Walang naitalang makabuluhang pagkakamali sa pagbasa. May ${avgAccuracy}% kawastuhan at ${avgComp}% pag-unawa sa mga nasagutang pagsusuri.`
        : `Zero significant reading miscues recorded. Demonstrates exemplary ${avgAccuracy}% accuracy and ${avgComp}% comprehension across evaluated selections.`;
    } else if (primaryType === 'substitution' || primaryType === 'mispronunciation') {
      const secNote = secondaryType ? (isTagalog ? ` na sinundan ng ${secondaryType} (${secondaryCount})` : ` followed by ${secondaryType} (${secondaryCount})`) : '';
      diagnosisTitle = isTagalog
        ? `Mataas ang Pagpapalit / Maling Pagbigkas (${dominantPct}% ng kabuuang mali)`
        : `Predominant Substitutions & Mispronunciations (${dominantPct}% of total miscues)`;
      diagnosisText = isTagalog
        ? `Madalas humula ng salita batay sa unang katinig sa halip na basahin ang buong pantig${secNote}. Karaniwang lumilitaw sa mga di-pamilyar o mahahabang salita.`
        : `Frequently substitutes target words based on initial consonants rather than sounding out the full syllabic structure${secNote}. Noticeable on longer, unfamiliar vocabulary.`;
    } else if (primaryType === 'omission') {
      diagnosisTitle = isTagalog
        ? `Madalas na Pagkakaltas ng Salita at Panlapi (${dominantPct}% ng kabuuang mali)`
        : `Frequent Word & Morphological Omissions (${dominantPct}% of total miscues)`;
      diagnosisText = isTagalog
        ? `Madalas lumaktaw ng mga maiikling kataga (hal. ang, mga, sa) o mga hulapi sa layuning pabilisin ang pagbasa.`
        : `Consistently skips short function words (e.g., in, on, the) or inflectional endings, often as a result of rushing through sentences.`;
    } else if (primaryType === 'repetition') {
      diagnosisTitle = isTagalog
        ? `Madalas na Pag-uulit at Pag-aatubili (${dominantPct}% ng kabuuang mali)`
        : `Frequent Word Repetitions & Hesitation (${dominantPct}% of total miscues)`;
      diagnosisText = isTagalog
        ? `Umuulit ng mga salita o parirala dahil sa pag-aalinlangan sa pagbasa. Senyales ito ng mababang kumpiyansa o pagpupumilit na magwasto sa sarili.`
        : `Repeats words or whole phrases due to hesitation and reading uncertainty. Suggests performance anxiety or difficulty maintaining forward momentum.`;
    } else if (primaryType === 'insertion') {
      diagnosisTitle = isTagalog
        ? `Pagdaragdag ng mga Salitang Wala sa Teksto (${dominantPct}% ng kabuuang mali)`
        : `Frequent Word Insertions (${dominantPct}% of total miscues)`;
      diagnosisText = isTagalog
        ? `Madalas magsingit ng mga salitang wala sa orihinal na teksto dahil sa labis na pag-asa sa konteksto kaysa sa nakasulat na salita.`
        : `Inserts extra words not present in the text due to over-relying on predictive context rather than print fidelity.`;
    } else if (primaryType === 'transposition') {
      diagnosisTitle = isTagalog
        ? `Pagpapalitan ng Ayos ng Salita / Transposisyon (${dominantPct}% ng kabuuang mali)`
        : `Word Order Transposition (${dominantPct}% of total miscues)`;
      diagnosisText = isTagalog
        ? `Nagpapalit-palit ang pagkakasunod-sunod ng mga salita habang nagbabasa nang mabilis.`
        : `Reverses the sequential order of words while reading quickly; requires visual phrase tracking anchors.`;
    } else {
      if (avgAccuracy < 80) {
        diagnosisTitle = isTagalog ? 'Kailangan ng Masinsinang Remedial sa Pagbasa' : 'Intensive Word Decoding Remediation Needed';
        diagnosisText = isTagalog
          ? `Nasa antas Frustration (${avgAccuracy}% kawastuhan). Nangangailangan ng regular na paggabay sa pagkilala ng mga tunog at salita.`
          : `Reading accuracy (${avgAccuracy}%) falls within Frustration boundaries. Requires structured, step-by-step decoding support.`;
      } else if (avgComp < 60) {
        diagnosisTitle = isTagalog ? 'Mababang Pag-unawa sa Detalye at Kahulugan' : 'Comprehension Gap on Inferential Concepts';
        diagnosisText = isTagalog
          ? `Kuntento ang bilis at pagbigkas ngunit bumababa ang marka sa mga tanong na nangangailangan ng mas malalim na pagsusuri (${avgComp}%).`
          : `Accurately decodes text but exhibits difficulty synthesizing meaning, resulting in a ${avgComp}% comprehension average.`;
      } else {
        diagnosisTitle = isTagalog ? 'Matatag na Kasanayan sa Pagbasa' : 'Consistent Reading Progression';
        diagnosisText = isTagalog
          ? 'Nasa tamang antas ng pag-unlad ang mag-aaral para sa kanyang baitang.'
          : 'Learner exhibits steady performance across evaluated passage levels.';
      }
    }

    // Build Extensive 3-Pillar Interventions
    const phonicsItems = [];
    const guidedItems = [];
    const compItems = [];

    const currentFruLevel = selectedAdaptiveProfile?.frustrationalLevel;
    const currentInsLevel = selectedAdaptiveProfile?.instructionalLevel;
    const targetGrade = currentInsLevel
      ? formatGrade(currentInsLevel)
      : currentFruLevel
      ? `Grade ${Math.max(1, parseInt(String(currentFruLevel).replace(/\D/g, '') || '4', 10) - 1)}`
      : isTagalog ? 'mababang baitang' : 'lower grade';

    // ── PILLAR 1: Phonics & Decoding (Multi-Branching Niche Options) ──
    if (primaryType === 'substitution' || primaryType === 'mispronunciation') {
      phonicsItems.push({
        title: isTagalog ? 'Syllable Chunking' : 'Syllable Chunking',
        desc: isTagalog
          ? 'Hatiin sa pantig ang mahahabang salita bago basahin nang buo.'
          : 'Break multi-syllabic words into manageable chunks before reading aloud.',
      });
      phonicsItems.push({
        title: isTagalog ? 'Minimal Pairs' : 'Minimal Pairs',
        desc: isTagalog
          ? 'Sanayin ang magkatunog na titik (/b/ vs /p/, /d/ vs /t/).'
          : 'Practice contrast pairs (/b/ vs /p/, /d/ vs /t/) to prevent phonetic slips.',
      });
      if (avgAccuracy < 85) {
        phonicsItems.push({
          title: isTagalog ? 'Sound Blends' : 'Medial & End Sounds',
          desc: isTagalog
            ? 'Bigyang-diin ang tunog sa gitna at dulo ng salita.'
            : 'Focus on medial vowel and final consonant blends, not just the first letter.',
        });
      } else {
        phonicsItems.push({
          title: isTagalog ? 'Pagsusuri ng Diin' : 'Stress & Accentuation',
          desc: isTagalog
            ? 'Sanayin ang tamang diin sa mga salitang may magkaibang kahulugan (hal. búhay vs buháy).'
            : 'Focus on correct word stress to preserve accurate word meaning while decoding.',
        });
      }
    } else if (primaryType === 'omission') {
      phonicsItems.push({
        title: isTagalog ? 'Visual Tracking' : 'Visual Tracking',
        desc: isTagalog
          ? 'Gamitan ng daliri o bookmark ang bawat salita habang nagbabasa.'
          : 'Use a finger or bookmark guide so words are not skipped.',
      });
      phonicsItems.push({
        title: isTagalog ? 'Pagsasanay sa Panlapi' : 'Affix Drills',
        desc: isTagalog
          ? 'Sanayin ang unlapi, gitlapi, at hulapi upang marinig ang buong salita.'
          : 'Target word endings and prefixes to avoid omitting morphemes.',
      });
      if (avgSpeed > 1.8) {
        phonicsItems.push({
          title: isTagalog ? 'Preno sa Bilis' : 'Pacing Anchor',
          desc: isTagalog
            ? 'Pabagalin nang kaunti ang bilis upang hindi malaktawan ang maliliit na kataga.'
            : 'Slightly slow reading speed to prevent skimming over small connective words.',
        });
      } else {
        phonicsItems.push({
          title: isTagalog ? 'Articulatory Check' : 'Articulatory Check',
          desc: isTagalog
            ? 'Ipausal nang buo ang bawat titik lalo na ang huling katinig bago magpatuloy.'
            : 'Ensure full vocal articulation of end consonants before moving forward.',
        });
      }
    } else if (primaryType === 'repetition') {
      phonicsItems.push({
        title: isTagalog ? 'Sight Words Drill' : 'Sight Words',
        desc: isTagalog
          ? 'Mabilisang pagkilala sa mga pamilyar na salita upang mabawasan ang pag-aatubili.'
          : 'Rapid word recognition drills to eliminate hesitation.',
      });
      phonicsItems.push({
        title: isTagalog ? 'Kumpyansa sa Pagbasa' : 'Self-Correction',
        desc: isTagalog
          ? 'Puriin ang kusang pagwawasto nang walang bawas sa kumpyansa.'
          : 'Encourage confident self-correction without penalty.',
      });
      if (avgSpeed < 1.0) {
        phonicsItems.push({
          title: isTagalog ? 'Forward Momentum' : 'Forward Momentum',
          desc: isTagalog
            ? 'Hikayating magpatuloy sa susunod na salita sa halip na ulitin ang buong linya.'
            : 'Encourage reading straight through without resetting the phrase upon minor hesitations.',
        });
      } else {
        phonicsItems.push({
          title: isTagalog ? 'Smooth Flow' : 'Smooth Flow',
          desc: isTagalog
            ? 'Gumamit ng metronome o banayad na tapik sa mesa para sa steady na ritmo.'
            : 'Use rhythmic tapping to establish a continuous, unbroken reading tempo.',
        });
      }
    } else if (primaryType === 'insertion') {
      phonicsItems.push({
        title: isTagalog ? 'Text Anchoring' : 'Text Anchoring',
        desc: isTagalog
          ? 'Basahin lamang ang nakasulat at iwasang manghula ng karagdagang salita.'
          : 'Read only the printed text without anticipating extra words.',
      });
      phonicsItems.push({
        title: isTagalog ? 'Cloze Reading' : 'Cloze Practice',
        desc: isTagalog
          ? 'Sanayin ang eksaktong pagtutugma ng nawawalang salita sa pangungusap.'
          : 'Practice filling in missing words to enforce text precision.',
      });
      phonicsItems.push({
        title: isTagalog ? 'Line Masking' : 'Line Masking',
        desc: isTagalog
          ? 'Takpan ang susunod na linya gamit ang card upang maiwasan ang paghula sa unahan.'
          : 'Cover upcoming sentences with a card to prevent skimming and anticipating text.',
      });
    } else if (primaryType === 'transposition') {
      phonicsItems.push({
        title: isTagalog ? 'Left-to-Right Tracking' : 'Directional Tracking',
        desc: isTagalog
          ? 'Ituro ang bawat salita mula kaliwa pakanan upang manatili sa tamang ayos.'
          : 'Reinforce strict left-to-right eye sweeps using a pointing guide.',
      });
      phonicsItems.push({
        title: isTagalog ? 'Syntax Modeling' : 'Word-Order Drills',
        desc: isTagalog
          ? 'Ipaayos ang mga ginulong salita (scrambled words) upang maranasan ang tamang pagkakasunod-sunod.'
          : 'Practice unscrambling short sentences to solidify natural grammatical order.',
      });
      phonicsItems.push({
        title: isTagalog ? 'Chunk Tracking' : 'Chunk Tracking',
        desc: isTagalog
          ? 'Basahin ang simuno bago ang panaguri nang may malinaw na pagitan.'
          : 'Read subject and predicate in isolated chunks to prevent sequential flipping.',
      });
    } else {
      if (avgAccuracy < 80) {
        phonicsItems.push({
          title: isTagalog ? 'Patinig at Katinig' : 'Phoneme Awareness',
          desc: isTagalog
            ? 'Muling balikan ang pagpapatunog ng mga payak na pantig at katinig.'
            : 'Reinforce letter-sound correspondence with foundational sound cards.',
        });
        phonicsItems.push({
          title: isTagalog ? 'Blending Drills' : 'Blending Drills',
          desc: isTagalog
            ? 'Pagsamahin ang mga tunog nang mabagal (hal. k-a-h-o-y -> kahoy).'
            : 'Blend individual phonemes progressively into whole words.',
        });
      } else {
        phonicsItems.push({
          title: isTagalog ? 'Word Families' : 'Word Families',
          desc: isTagalog
            ? 'Palawakin ang talasalitaan gamit ang mga magkakamag-anak na salita.'
            : 'Reinforce grade-appropriate word families and root words.',
        });
        phonicsItems.push({
          title: isTagalog ? 'Phrase Chunking' : 'Phrase Reading',
          desc: isTagalog
            ? 'Sanayin ang pagbasa ng 2–3 salita nang sabay sa halip na paisa-isa.'
            : 'Drill 2-3 word phrases to move smoothly beyond word-by-word reading.',
        });
      }
    }

    // ── PILLAR 2: Guided Oral Reading (Adaptive Niche Options) ──
    if (avgSpeed < 0.8) {
      guidedItems.push({
        title: isTagalog ? 'Sprint Timed Re-reading' : 'Sprint Timed Drills',
        desc: isTagalog
          ? 'Basahin ang 1–2 pangungusap nang 3 beses upang masanay ang dila sa bilis.'
          : 'Timed re-reading of 1–2 sentence strips to unlock higher oral processing speed.',
      });
    } else if (avgSpeed >= 0.8 && avgSpeed < 1.2) {
      guidedItems.push({
        title: isTagalog ? 'Choral Reading' : 'Choral Reading',
        desc: isTagalog
          ? 'Sabayang pagbasa kasama ang guro upang maiangat ang bilis patungong 1.2+ WPS.'
          : 'Read synchronously with the teacher to elevate pace toward 1.2+ WPS.',
      });
    } else if (avgSpeed > 2.2 && avgAccuracy < 90) {
      guidedItems.push({
        title: isTagalog ? 'Bantas at Preno' : 'Pacing Regulation',
        desc: isTagalog
          ? 'Huminto sa tuldok at kuwit; unahin ang kawastuhan bago ang bilis.'
          : 'Pause at commas and periods; prioritize accuracy over raw speed.',
      });
    } else {
      guidedItems.push({
        title: isTagalog ? 'Echo Reading' : 'Echo Reading',
        desc: isTagalog
          ? 'Ulitin ang binasang linya ng guro upang gayahin ang natural na intonasyon.'
          : 'Model expressive phrasing by echoing the teacher’s intonation and pauses.',
      });
    }

    // Dynamic Level Recommendation (Frustration vs Instructional vs Independent)
    if (selectedAdaptiveProfile?.frustrationalLevel && selectedAdaptiveProfile?.instructionalLevel) {
      guidedItems.push({
        title: isTagalog ? 'Bridge Practice' : 'Targeted Bridge',
        desc: isTagalog
          ? `Magsanay sa antas ${formatGrade(selectedAdaptiveProfile.instructionalLevel)} bago sumubok muli sa ${formatGrade(selectedAdaptiveProfile.frustrationalLevel)}.`
          : `Anchor on ${formatGrade(selectedAdaptiveProfile.instructionalLevel)} selections before re-attempting ${formatGrade(selectedAdaptiveProfile.frustrationalLevel)} content.`,
      });
    } else {
      guidedItems.push({
        title: isTagalog ? 'Leveled Practice' : 'Leveled Practice',
        desc: isTagalog
          ? `Magsanay sa mga seleksyon ng ${targetGrade} upang mapanatili ang mataas na tagumpay.`
          : `Anchor reading practice on ${targetGrade} selections to sustain high success rates.`,
      });
    }

    // Secondary Guided Intervention based on miscue/accuracy state
    if (secondaryType === 'omission') {
      guidedItems.push({
        title: isTagalog ? 'Paired Sentence Check' : 'Paired Checking',
        desc: isTagalog
          ? 'Makipagtulungan sa katabi upang senyasan kapag may nalaktawang salita.'
          : 'Partner reading with immediate peer-pointing whenever a word is skipped.',
      });
    } else if (secondaryType === 'repetition') {
      guidedItems.push({
        title: isTagalog ? 'Audio Recording' : 'Self-Listening',
        desc: isTagalog
          ? 'Iparinig sa bata ang kanyang nairecord na pagbasa upang marinig ang pag-aatubili.'
          : 'Play back student audio recordings to self-monitor and diminish repeated starts.',
      });
    } else {
      guidedItems.push({
        title: isTagalog ? 'Paghahawan ng Balakid' : 'Pre-teaching',
        desc: isTagalog
          ? 'Talakayin ang 3–5 mahihirap na salita bago basahin ang kuwento.'
          : 'Clarify 3–5 key vocabulary words before reading the text.',
      });
    }

    // ── PILLAR 3: Comprehension Focus (Targeted Niche Options) ──
    if (avgComp < 50) {
      compItems.push({
        title: isTagalog ? 'Literal na Detalye' : 'Text Evidence',
        desc: isTagalog
          ? 'Ihanap ng direktang patunay sa teksto ang tanong na "Sino, Saan, at Kailan".'
          : 'Hunt for direct text proof to answer "Who, What, Where, and When".',
      });
      compItems.push({
        title: isTagalog ? 'Story Map' : 'Story Map',
        desc: isTagalog
          ? 'Iayos ang Simula, Gitna, at Wakas gamit ang visual diagram.'
          : 'Track Beginning, Middle, and Ending using a visual organizer.',
      });
      compItems.push({
        title: isTagalog ? 'Chunk & Check' : 'Chunk & Check',
        desc: isTagalog
          ? 'Huminto pagkatapos ng bawat talata upang tiyaking naunawaan ito.'
          : 'Pause after every paragraph to verbally verify comprehension.',
      });
    } else if (avgComp >= 50 && avgComp < 70) {
      compItems.push({
        title: isTagalog ? 'Pahiwatig (Inferential)' : 'Inference Prompts',
        desc: isTagalog
          ? 'Itanong: "Bakit kaya ito nangyari?" batay sa pahiwatig sa teksto.'
          : 'Ask: "Why did that happen?" using implicit clues from the narrative.',
      });
      compItems.push({
        title: isTagalog ? 'Paghula sa Kalalabasan' : 'Predictions',
        desc: isTagalog
          ? 'Huminto sa gitna at itanong kung ano ang susunod na mangyayari.'
          : 'Pause mid-story and ask what is likely to happen next.',
      });
      compItems.push({
        title: isTagalog ? 'Oral Retelling' : 'Oral Retelling',
        desc: isTagalog
          ? 'Ipasalaysay muli ang kuwento gamit ang sariling mga salita nang hindi tinitingnan ang teksto.'
          : 'Have the learner recount the story using their own words without looking at the text.',
      });
    } else if (avgComp >= 70 && avgComp < 85) {
      compItems.push({
        title: isTagalog ? 'Sanhi at Bunga' : 'Cause & Effect',
        desc: isTagalog
          ? 'Tukuyin ang dahilan kung bakit nagbago ang desisyon ng tauhan sa kuwento.'
          : 'Identify why a character’s action triggered the turning point of the plot.',
      });
      compItems.push({
        title: isTagalog ? 'Paghahambing (Compare)' : 'Character Comparison',
        desc: isTagalog
          ? 'Paghambingin ang ugali ng dalawang tauhan gamit ang Venn diagram.'
          : 'Compare character motivations and reactions using a simple Venn diagram.',
      });
      compItems.push({
        title: isTagalog ? 'Pangunahing Diwa' : 'Main Idea & Theme',
        desc: isTagalog
          ? 'Ibuod ang pinakamahalagang aral ng kuwento sa isang buong pangungusap.'
          : 'Summarize the central moral or takeaway lesson in a single sentence.',
      });
    } else {
      compItems.push({
        title: isTagalog ? 'Kritikal na Pagsusuri' : 'Evaluative Prompts',
        desc: isTagalog
          ? 'Itanong: "Kung ikaw ang tauhan, gagawin mo rin ba ang ginawa niya?"'
          : 'Prompt: "If you were the character, what would you have done differently?"',
      });
      compItems.push({
        title: isTagalog ? 'Karanasan sa Buhay' : 'Text-to-Self',
        desc: isTagalog
          ? 'Iugnay ang tema ng kuwento sa sariling karanasan o lipunan.'
          : 'Relate story themes to real-world personal experiences and community issues.',
      });
      compItems.push({
        title: isTagalog ? 'Alternatibong Wakas' : 'Creative Ending',
        desc: isTagalog
          ? 'Lumikha ng kakaibang wakas ng kuwento kung nagbago ang pasya ng bida.'
          : 'Draft an alternative ending based on what if a different choice was made.',
      });
    }

    return {
      hasData: true,
      periodLabel,
      langLabel,
      diagnosisTitle,
      diagnosisText,
      phonicsItems,
      guidedItems,
      compItems,
    };
  }, [oralEvidence, selectedAdaptiveProfile, profileLanguage, profilePeriod]);

  const reportProfiles = (student.oralAdaptiveProfiles || []).map((profile) => {
    const language = String(profile.language || '').toLowerCase().startsWith('en') ? 'en' : 'fil';
    const period = String(profile.period || 'pre_test').toLowerCase();
    const evidenceItems = activities.filter((activity) => activity.assessmentType === 'oral'
      && (String(activity.language || '').toLowerCase().startsWith('en') ? 'en' : 'fil') === language
      && String(activity.assessmentPeriod || 'pre_test').toLowerCase() === period);
    return { profile, language, period, evidenceItems, boundaries: buildDiagnosticEvidence(profile, evidenceItems) };
  });
  const canGenerateReport = !loading && Boolean(student && student.name);

  const generateStudentReport = async () => {
    if (!canGenerateReport) return;

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    const drawFooter = () => {
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          'SalinTinig Official Student Assessment Document • Confidential Educational Record',
          margin,
          pageHeight - 9
        );
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - margin,
          pageHeight - 9,
          { align: 'right' }
        );
      }
    };

    let logoDataUrl = null;
    try {
      logoDataUrl = await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 300;
          canvas.height = img.height || 300;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = systemLogo;
      });
    } catch (_) {
      logoDataUrl = null;
    }

    let y = 14;

    // Header Banner
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, 'PNG', margin, y, 16, 16);
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(15, 23, 42);
    pdf.text('SalinTinig', margin + 19, y + 6);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(22, 95, 213);
    pdf.text('COMPREHENSIVE STUDENT READING & PERFORMANCE REPORT', margin + 19, y + 12);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('Phil-IRI & Adaptive Literacy Assessment System', margin + 19, y + 16);

    y += 20;
    pdf.setDrawColor(22, 95, 213);
    pdf.setLineWidth(0.8);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Student Demographics Card (Thin Black Border)
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.rect(margin, y, contentWidth, 24);

    const col1 = margin + 4;
    const col2 = margin + 70;
    const col3 = margin + 130;

    const drawField = (x, lineY, label, val) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(90, 90, 90);
      pdf.text(label, x, lineY);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(String(val || '—'), x, lineY + 4.5);
    };

    drawField(col1, y + 5, 'FULL NAME', student.name);
    drawField(col2, y + 5, 'LEARNER REFERENCE NO. (LRN)', student.lrn || '—');
    drawField(col3, y + 5, 'GRADE & SECTION', `${student.grade || '—'}${student.section ? ` / ${student.section}` : ''}`);

    drawField(col1, y + 15, 'TOTAL ASSESSMENTS TAKEN', `${activities.length} completed record(s)`);
    drawField(col2, y + 15, 'REPORT DATE', new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }));

    y += 32;

    // Executive Performance Summary (Thin Black Outline Cards)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Executive Reading Performance Summary', margin, y);
    y += 6;

    const overallAvgAccuracy = evidenceAverage('accuracyScore');
    const overallAvgComp = evidenceAverage('comprehensionScore');
    const overallAvgSpeed = evidenceAverage('readingSpeed');

    const pdfAccInfo = getAccuracyInterpretation(overallAvgAccuracy);
    const pdfCompInfo = getComprehensionInterpretation(overallAvgComp);
    const pdfSpeedInfo = getReadingSpeedInterpretation(overallAvgSpeed);

    const metrics = [
      { label: 'Overall Average Accuracy', val: `${overallAvgAccuracy}%`, desc: pdfAccInfo.badge },
      { label: 'Overall Average Comprehension', val: `${overallAvgComp}%`, desc: pdfCompInfo.badge },
      { label: 'Average Reading Speed', val: `${overallAvgSpeed} WPS`, desc: pdfSpeedInfo.badge },
    ];

    const cardW = (contentWidth - 8) / 3;
    metrics.forEach((m, idx) => {
      const cx = margin + idx * (cardW + 4);
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.rect(cx, y, cardW, 20);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(90, 90, 90);
      pdf.text(m.label, cx + 4, y + 5.5);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(22, 95, 213);
      pdf.text(m.val, cx + 4, y + 12.5);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`Rating: ${m.desc}`, cx + 4, y + 17.5);
    });

    y += 28;

    const checkOverflow = (neededHeight) => {
      if (y + neededHeight > pageHeight - 20) {
        pdf.addPage();
        y = 18;
      }
    };

    // Diagnostic Reading Profiles (Classic Grid Table with Black Outlines)
    if (reportProfiles.length > 0) {
      checkOverflow(35);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Phil-IRI Diagnostic Oral Reading Profiles', margin, y);
      y += 7;

      reportProfiles.forEach((rp) => {
        const periodLabel = rp.period === 'post_test' ? 'Post-Test' : 'Pre-Test';
        const langLabel = rp.language === 'en' ? 'English' : 'Filipino';

        checkOverflow(40);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(`${periodLabel} — ${langLabel} Oral Reading Profile`, margin, y);
        y += 6;

        // Calculate total table height
        let tableRowsHeight = 0;
        const processedRows = rp.boundaries.map((b) => {
          const basisText = b.evidence
            ? `${b.evidence.passageTitle || b.evidence.passageSet} (${b.evidence.passageSet}) — Acc: ${b.evidence.accuracyScore}%, Comp: ${b.evidence.comprehensionScore}%`
            : 'No reviewed assessment evidence recorded';
          const basisLines = pdf.splitTextToSize(basisText, contentWidth - 94);
          const rowH = Math.max(7, basisLines.length * 3.8 + 2);
          tableRowsHeight += rowH;
          return { b, basisLines, rowH };
        });

        const headerH = 6.5;
        const totalTableH = headerH + tableRowsHeight;

        checkOverflow(totalTableH + 5);

        const tableStartY = y;

        // Header Fill
        pdf.setFillColor(245, 247, 250);
        pdf.rect(margin, tableStartY, contentWidth, headerH, 'F');

        // Header Labels
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text('RESULT BOUNDARY', margin + 3, tableStartY + 4.5);
        pdf.text('CONFIRMED GRADE LEVEL', margin + 48, tableStartY + 4.5);
        pdf.text('TEACHER-REVIEWED EVIDENCE BASIS', margin + 93, tableStartY + 4.5);

        let currentY = tableStartY + headerH;

        processedRows.forEach(({ b, basisLines, rowH }) => {
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.15);
          pdf.line(margin, currentY, margin + contentWidth, currentY);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          if (b.label === 'Independent') pdf.setTextColor(4, 120, 87);
          else if (b.label === 'Instructional') pdf.setTextColor(180, 83, 9);
          else pdf.setTextColor(185, 28, 28);
          pdf.text(b.label, margin + 3, currentY + 4.5);

          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(15, 23, 42);
          pdf.text(formatGrade(b.level), margin + 48, currentY + 4.5);

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.setTextColor(51, 65, 85);
          pdf.text(basisLines, margin + 93, currentY + 4.5);

          currentY += rowH;
        });

        // Outer Border
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.2);
        pdf.rect(margin, tableStartY, contentWidth, totalTableH);

        // Vertical Column Dividers
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin + 45, tableStartY, margin + 45, tableStartY + totalTableH);
        pdf.line(margin + 90, tableStartY, margin + 90, tableStartY + totalTableH);

        y = tableStartY + totalTableH + 10;
      });
    }

    // Phil-IRI Assessment Attempt History (Fixed Column Positions No Overlap)
    if (activities.length > 0) {
      checkOverflow(30);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Phil-IRI Assessment Attempt History', margin, y);
      y += 7;

      const headerH = 6.5;
      const rowH = 6.5;
      const totalTableH = headerH + activities.length * rowH;

      checkOverflow(Math.min(totalTableH + 5, 40));

      const tableStartY = y;

      // Header Fill
      pdf.setFillColor(245, 247, 250);
      pdf.rect(margin, tableStartY, contentWidth, headerH, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(15, 23, 42);

      pdf.text('PASSAGE TITLE / RECORD', margin + 3, tableStartY + 4.5);
      pdf.text('TYPE / LANG', margin + 61, tableStartY + 4.5);
      pdf.text('ACCURACY', margin + 89, tableStartY + 4.5);
      pdf.text('COMPREHENSION', margin + 113, tableStartY + 4.5);
      pdf.text('RESULT LEVEL', margin + 147, tableStartY + 4.5);

      let currentY = tableStartY + headerH;

      activities.forEach((act) => {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.15);
        pdf.line(margin, currentY, margin + contentWidth, currentY);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(15, 23, 42);
        const title = act.passageTitle || act.title || act.passageSet || 'Assessment Attempt';
        pdf.text(title.length > 26 ? `${title.substring(0, 24)}...` : title, margin + 3, currentY + 4.5);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(51, 65, 85);
        const typeLang = `${act.assessmentType ? act.assessmentType.toUpperCase() : 'ORAL'} / ${act.language ? act.language.toUpperCase() : 'FIL'}`;
        pdf.text(typeLang, margin + 61, currentY + 4.5);

        pdf.text(`${act.accuracyScore ?? '—'}%`, margin + 89, currentY + 4.5);
        pdf.text(`${act.comprehensionScore ?? '—'}%`, margin + 113, currentY + 4.5);

        pdf.setFont('helvetica', 'bold');
        const resText = act.readingLevelResult || act.level || 'Completed';
        pdf.text(resText, margin + 147, currentY + 4.5);

        currentY += rowH;
      });

      // Outer Border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.rect(margin, tableStartY, contentWidth, totalTableH);

      // Vertical Column Dividers (Fixed Positions)
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin + 58, tableStartY, margin + 58, tableStartY + totalTableH);
      pdf.line(margin + 86, tableStartY, margin + 86, tableStartY + totalTableH);
      pdf.line(margin + 110, tableStartY, margin + 110, tableStartY + totalTableH);
      pdf.line(margin + 144, tableStartY, margin + 144, tableStartY + totalTableH);

      y = tableStartY + totalTableH + 12;
    }

    // Achievements & Milestones
    checkOverflow(35);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Student Reading Achievements & Milestones', margin, y);
    y += 7;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(22, 95, 213);
    pdf.text(`Unlocked Badges (${badges.length})`, margin, y);
    y += 5;

    if (badges.length > 0) {
      const badgeList = badges.map((b) => b.name).join(' • ');
      const bLines = pdf.splitTextToSize(badgeList, contentWidth);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(51, 65, 85);
      pdf.text(bLines, margin, y);
      y += bLines.length * 4 + 4;
    } else {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('No achievement badges unlocked yet.', margin, y);
      y += 6;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(22, 95, 213);
    pdf.text(`Completed Reading Stories (${stories.length})`, margin, y);
    y += 5;

    if (stories.length > 0) {
      const storyList = stories.map((s) => s.title).join(' • ');
      const sLines = pdf.splitTextToSize(storyList, contentWidth);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(51, 65, 85);
      pdf.text(sLines, margin, y);
      y += sLines.length * 4 + 6;
    } else {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('No reading stories completed yet.', margin, y);
      y += 6;
    }

    // Actionable Pedagogical Insights & Remedial Guidance (Panel Compliance)
    if (pedagogicalInsights.hasData) {
      checkOverflow(45);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Actionable Pedagogical Insights & Remedial Guidance', margin, y);
      y += 6;

      // Primary Diagnosis Box
      pdf.setFillColor(254, 252, 232);
      pdf.setDrawColor(245, 158, 11);
      pdf.setLineWidth(0.2);
      const diagText = `${pedagogicalInsights.diagnosisTitle}: ${pedagogicalInsights.diagnosisText}`;
      const diagLines = pdf.splitTextToSize(diagText, contentWidth - 8);
      const diagBoxH = Math.max(12, diagLines.length * 4 + 6);
      pdf.rect(margin, y, contentWidth, diagBoxH, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(146, 64, 14);
      pdf.text(diagLines, margin + 4, y + 5);
      y += diagBoxH + 6;

      // 3 Remedial Pillar Recommendations
      const pillarCardW = (contentWidth - 6) / 3;
      const pillars = [
        { title: 'Phonics & Decoding', items: pedagogicalInsights.phonicsItems },
        { title: 'Guided Oral Reading', items: pedagogicalInsights.guidedItems },
        { title: 'Comprehension Focus', items: pedagogicalInsights.compItems },
      ];

      checkOverflow(35);
      const pillarStartY = y;
      let maxCardH = 28;

      pillars.forEach((p, idx) => {
        const px = margin + idx * (pillarCardW + 3);
        pdf.setFillColor(250, 250, 250);
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.rect(px, pillarStartY, pillarCardW, maxCardH, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(p.title.toUpperCase(), px + 3, pillarStartY + 4.5);

        let itemY = pillarStartY + 8.5;
        p.items.slice(0, 3).forEach((item) => {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(6.5);
          pdf.setTextColor(30, 41, 59);
          const lineStr = `• ${item.title}: ${item.desc}`;
          const splitLines = pdf.splitTextToSize(lineStr, pillarCardW - 6);
          pdf.text(splitLines.slice(0, 2), px + 3, itemY);
          itemY += Math.min(splitLines.length, 2) * 3 + 1;
        });
      });

      y = pillarStartY + maxCardH + 8;
    }

    // Teacher Observations & Signatures (Sharp Thin Black Border)
    checkOverflow(40);
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.rect(margin, y, contentWidth, 32);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text('TEACHER REMARKS & LITERACY INTERVENTION RECOMMENDATIONS', margin + 4, y + 6);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('[ ] Individual Remediation Recommended   [ ] Peer Reading Buddy Program   [ ] Maintain Independent Progress', margin + 4, y + 12);

    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.15);
    pdf.line(margin + 4, y + 18, margin + contentWidth - 4, y + 18);
    pdf.line(margin + 4, y + 25, margin + contentWidth - 4, y + 25);
    drawFooter();

    const cleanName = String(student.name || 'Student')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '');
    const filename = `SalinTinig-Reading-Profile-${cleanName}.pdf`;
    pdf.save(filename);
  };

  const [recordsPage, setRecordsPage] = useState(1);
  const [storiesPage, setStoriesPage] = useState(1);
  const [badgesPage, setBadgesPage] = useState(1);

  const RECORDS_PAGE_SIZE = 5;
  const STORIES_PAGE_SIZE = 10;
  const BADGES_PAGE_SIZE = 10;

  const totalRecordsPages = Math.ceil(activities.length / RECORDS_PAGE_SIZE) || 1;
  const paginatedActivities = useMemo(() => {
    const start = (recordsPage - 1) * RECORDS_PAGE_SIZE;
    return activities.slice(start, start + RECORDS_PAGE_SIZE);
  }, [activities, recordsPage]);

  const totalStoriesPages = Math.ceil(stories.length / STORIES_PAGE_SIZE) || 1;
  const paginatedStories = useMemo(() => {
    const start = (storiesPage - 1) * STORIES_PAGE_SIZE;
    return stories.slice(start, start + STORIES_PAGE_SIZE);
  }, [stories, storiesPage]);

  const totalBadgesPages = Math.ceil(badges.length / BADGES_PAGE_SIZE) || 1;
  const paginatedBadges = useMemo(() => {
    const start = (badgesPage - 1) * BADGES_PAGE_SIZE;
    return badges.slice(start, start + BADGES_PAGE_SIZE);
  }, [badges, badgesPage]);

  return (
    <div>
      {/* Top Back Navigation */}
      <div className="mb-4">
        <BackButton onClick={() => navigate(-1)} label="Back to Previous Page" size={20} />
      </div>

      {loading ? (
        <StudentProfileSkeleton />
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4 py-2">
        <div className="flex items-center gap-5">
          <Avatar name={student.name} src={student.profileImage || student.profile_image || student.avatarUrl || student.avatar} size={96} className="text-2xl" />
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-xs font-semibold text-ink/70">Full name</p>
                <p className="text-xl font-bold text-ink">{student.name}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs font-semibold text-ink/70">Grade Level</p>
                <p className="text-base font-bold text-ink">{student.grade ? formatGrade(student.grade) : 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink/70">Section</p>
                <p className="text-base font-bold text-ink">{student.section || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink/70">LRN</p>
                <p className="text-base font-bold text-ink">{student.lrn}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={generateStudentReport}
          disabled={!canGenerateReport}
          title={canGenerateReport ? 'Open a printable individual Phil-IRI report' : 'A reviewed oral adaptive profile is required before generating a report'}
          className="flex shrink-0 items-center gap-2.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Icon icon="ph:article" className="size-5" />
          Generate report
        </button>
      </div>

      <div className="mt-10 flex flex-col gap-6 xl:flex-row">
        <div className="flex w-full flex-col gap-3 xl:max-w-[540px]">
          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-ink">Oral Reading Adaptive Profile</p>
                <p className="text-[11px] text-ink/55">Final diagnostic boundaries and their assessment basis</p>
              </div>
              <div className="flex gap-1.5">
                <select value={profilePeriod} onChange={(event) => setProfilePeriod(event.target.value)} className="rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-[11px] font-semibold text-ink outline-none">
                  <option value="pre_test">Pre-Test</option><option value="post_test">Post-Test</option>
                </select>
                <select value={profileLanguage} onChange={(event) => setProfileLanguage(event.target.value)} className="rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-[11px] font-semibold text-ink outline-none">
                  <option value="fil">Filipino</option><option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-ink/10">
              <div className="grid grid-cols-[1.1fr_.8fr_1.35fr] gap-2 bg-ink/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-ink/55"><span>Result</span><span>Grade</span><span>Assessment basis</span></div>
              {diagnosticEvidence.map((boundary) => (
                <div key={boundary.label} className="grid grid-cols-[1.1fr_.8fr_1.35fr] items-center gap-2 border-t border-ink/10 px-3 py-2.5 text-xs">
                  <span className={`w-fit rounded-md px-2 py-1 text-[10px] font-bold ${boundary.style}`}>{boundary.label}</span>
                  <span className="font-bold text-ink">{formatGrade(boundary.level)}</span>
                  {boundary.evidence ? <div className="min-w-0"><p className="truncate font-semibold text-ink">{boundary.evidence.passageTitle || boundary.evidence.passageSet}</p><p className="text-[10px] text-ink/60">{boundary.evidence.passageSet} · {boundary.evidence.accuracyScore}% Acc · {boundary.evidence.comprehensionScore}% Comp</p></div> : <span className="text-[10px] text-ink/50">No reviewed result yet</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(() => {
              const accVal = evidenceAverage('accuracyScore');
              const compVal = evidenceAverage('comprehensionScore');
              const spdVal = evidenceAverage('readingSpeed');
              const accInfo = getAccuracyInterpretation(accVal);
              const compInfo = getComprehensionInterpretation(compVal);
              const spdInfo = getReadingSpeedInterpretation(spdVal);

              return (
                <>
                  <StatCard
                    value={accVal}
                    unit="%"
                    label={'Average\nAccuracy'}
                    iconName="ph:target"
                    iconBg="bg-[#DBEAFE] text-[#2563EB]"
                    badge={accInfo.badge}
                    badgeColor={accInfo.color}
                    scale={accInfo.scale}
                    description={accInfo.description}
                  />
                  <StatCard
                    value={compVal}
                    unit="%"
                    label={'Average\nComprehension'}
                    iconName="ph:lightbulb"
                    iconBg="bg-[#D1FAE5] text-[#059669]"
                    badge={compInfo.badge}
                    badgeColor={compInfo.color}
                    scale={compInfo.scale}
                    description={compInfo.description}
                  />
                  <StatCard
                    value={spdVal}
                    unit=" WPS"
                    label={'Average\nReading Speed'}
                    iconName="ph:gauge"
                    iconBg="bg-[#FEF3C7] text-[#D97706]"
                    badge={spdInfo.badge}
                    badgeColor={spdInfo.color}
                    scale={spdInfo.scale}
                    description={spdInfo.description}
                  />
                </>
              );
            })()}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <Icon icon="ph:trophy" className="size-7 text-brand-red" />
            <h2 className="text-xl font-bold text-ink">Phil-IRI Records & Student Progress</h2>
          </div>

          <div className="mt-4 flex items-center gap-2 border-b border-ink/10">
            {ACHIEVEMENT_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === tab ? 'border-brand-red text-brand-red font-bold' : 'border-transparent text-ink/70 hover:bg-ink/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <div key={activeTab} className="animate-fadeIn">
              {activeTab === 'Phil-IRI Records' && (
                <div>
                  {activities.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3">
                        {paginatedActivities.map((activity) => (
                          <AchievementActivityRow key={activity.id} activity={activity} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 text-xs text-ink/60 border-t border-ink/5 mt-3">
                        <span>
                          Showing {(recordsPage - 1) * RECORDS_PAGE_SIZE + 1} to {Math.min(recordsPage * RECORDS_PAGE_SIZE, activities.length)} of {activities.length} records
                        </span>
                        {totalRecordsPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={recordsPage === 1}
                              onClick={() => setRecordsPage((p) => Math.max(p - 1, 1))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              <CaretLeft size={14} /> Previous
                            </button>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalRecordsPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                  key={pg}
                                  type="button"
                                  onClick={() => setRecordsPage(pg)}
                                  className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    recordsPage === pg
                                      ? 'bg-brand-blue text-white shadow-xs'
                                      : 'bg-white border border-ink/10 text-ink/70 hover:bg-ink/5'
                                  }`}
                                >
                                  {pg}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              disabled={recordsPage === totalRecordsPages}
                              onClick={() => setRecordsPage((p) => Math.min(p + 1, totalRecordsPages))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              Next <CaretRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-ink/10 bg-cream p-8 text-center text-ink/50 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <Clock size={32} className="text-ink/30 mb-1" />
                        <span className="text-xs font-bold text-ink">No Assessment Records Yet</span>
                        <span className="text-[11px] text-ink/60 max-w-sm leading-relaxed">
                          This student has not taken any Phil-IRI reading assessment tests yet.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Badges' && (
                <div>
                  {badges.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                        {paginatedBadges.map((badge, idx) => (
                          <BadgeCard key={badge.id ?? idx} badge={badge} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 text-xs text-ink/60 border-t border-ink/5 mt-3">
                        <span>
                          Showing {(badgesPage - 1) * BADGES_PAGE_SIZE + 1} to {Math.min(badgesPage * BADGES_PAGE_SIZE, badges.length)} of {badges.length} badges
                        </span>
                        {totalBadgesPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={badgesPage === 1}
                              onClick={() => setBadgesPage((p) => Math.max(p - 1, 1))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              <CaretLeft size={14} /> Previous
                            </button>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalBadgesPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                  key={pg}
                                  type="button"
                                  onClick={() => setBadgesPage(pg)}
                                  className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    badgesPage === pg
                                      ? 'bg-brand-blue text-white shadow-xs'
                                      : 'bg-white border border-ink/10 text-ink/70 hover:bg-ink/5'
                                  }`}
                                >
                                  {pg}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              disabled={badgesPage === totalBadgesPages}
                              onClick={() => setBadgesPage((p) => Math.min(p + 1, totalBadgesPages))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              Next <CaretRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-ink/10 bg-cream p-8 text-center text-ink/50 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <Icon icon="ph:medal-bold" className="size-8 text-ink/30 mb-1" />
                        <span className="text-xs font-bold text-ink">No Badges Unlocked Yet</span>
                        <span className="text-[11px] text-ink/60 max-w-sm leading-relaxed">
                          This student has not unlocked any achievement badges yet.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Stories' && (
                <div>
                  {stories.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                        {paginatedStories.map((story) => (
                          <StoryRow key={story.id} story={story} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 text-xs text-ink/60 border-t border-ink/5 mt-3">
                        <span>
                          Showing {(storiesPage - 1) * STORIES_PAGE_SIZE + 1} to {Math.min(storiesPage * STORIES_PAGE_SIZE, stories.length)} of {stories.length} stories
                        </span>
                        {totalStoriesPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={storiesPage === 1}
                              onClick={() => setStoriesPage((p) => Math.max(p - 1, 1))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              <CaretLeft size={14} /> Previous
                            </button>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalStoriesPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                  key={pg}
                                  type="button"
                                  onClick={() => setStoriesPage(pg)}
                                  className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    storiesPage === pg
                                      ? 'bg-brand-blue text-white shadow-xs'
                                      : 'bg-white border border-ink/10 text-ink/70 hover:bg-ink/5'
                                  }`}
                                >
                                  {pg}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              disabled={storiesPage === totalStoriesPages}
                              onClick={() => setStoriesPage((p) => Math.min(p + 1, totalStoriesPages))}
                              className="flex items-center gap-1 rounded-2xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                            >
                              Next <CaretRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-ink/10 bg-cream p-8 text-center text-ink/50 shadow-[0px_5px_5px_0px_rgba(26,24,22,0.06)]">
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <Icon icon="ph:book-open-bold" className="size-8 text-ink/30 mb-1" />
                        <span className="text-xs font-bold text-ink">No Completed Stories Yet</span>
                        <span className="text-[11px] text-ink/60 max-w-sm leading-relaxed">
                          This student has not completed any reading stories yet.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 4. ACTIONABLE INSIGHTS TAB ── */}
              {activeTab === 'Actionable Insights' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-ink uppercase tracking-wider">
                          Actionable Pedagogical Insights
                        </h3>
                        <p className="text-xs text-ink/60 mt-0.5">
                          Target remedial strategies and classroom interventions based on student reading performance.
                        </p>
                      </div>

                      <div className="rounded-lg bg-ink/[0.04] px-2.5 py-1 text-xs font-semibold text-ink/75 border border-ink/10">
                        <span>{pedagogicalInsights.periodLabel} · {pedagogicalInsights.langLabel}</span>
                      </div>
                    </div>

                    {/* Section 1: Primary Diagnosis */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-ink/70">
                        Primary Diagnosis
                      </p>
                      <div className="rounded-xl border border-amber-300/80 bg-amber-50/70 p-3.5 space-y-1">
                        <div className="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
                          <Icon icon="ph:warning-circle-bold" className="size-4 text-amber-600 shrink-0" />
                          <span>{pedagogicalInsights.diagnosisTitle}</span>
                        </div>
                        <p className="text-xs text-amber-900/90 leading-relaxed pl-6">
                          {pedagogicalInsights.diagnosisText}
                        </p>
                      </div>
                    </div>

                    {/* Section 2: Recommended Interventions */}
                    {pedagogicalInsights.hasData && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-ink/70">
                          Targeted Pedagogical & Remedial Interventions
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Column 1: Phonics & Decoding */}
                          <div className="rounded-xl border border-ink/10 bg-cream/40 p-4 space-y-2 hover:bg-cream/70 transition-colors">
                            <div className="flex items-center gap-2 border-b border-ink/10 pb-2">
                              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                <Icon icon="ph:text-t-bold" className="size-4" />
                              </div>
                              <h4 className="text-xs font-bold text-ink">Phonics & Decoding</h4>
                            </div>
                            <ul className="space-y-2 text-xs text-ink/80 pt-1">
                              {pedagogicalInsights.phonicsItems.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-brand-blue font-bold mt-0.5">•</span>
                                  <div>
                                    <span className="font-semibold text-ink">{item.title}: </span>
                                    <span>{item.desc}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Column 2: Guided Oral Reading */}
                          <div className="rounded-xl border border-ink/10 bg-cream/40 p-4 space-y-2 hover:bg-cream/70 transition-colors">
                            <div className="flex items-center gap-2 border-b border-ink/10 pb-2">
                              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                <Icon icon="ph:book-open-text-bold" className="size-4" />
                              </div>
                              <h4 className="text-xs font-bold text-ink">Guided Oral Reading</h4>
                            </div>
                            <ul className="space-y-2 text-xs text-ink/80 pt-1">
                              {pedagogicalInsights.guidedItems.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-emerald-700 font-bold mt-0.5">•</span>
                                  <div>
                                    <span className="font-semibold text-ink">{item.title}: </span>
                                    <span>{item.desc}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Column 3: Comprehension Focus */}
                          <div className="rounded-xl border border-ink/10 bg-cream/40 p-4 space-y-2 hover:bg-cream/70 transition-colors">
                            <div className="flex items-center gap-2 border-b border-ink/10 pb-2">
                              <div className="flex size-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                                <Icon icon="ph:brain-bold" className="size-4" />
                              </div>
                              <h4 className="text-xs font-bold text-ink">Comprehension Focus</h4>
                            </div>
                            <ul className="space-y-2 text-xs text-ink/80 pt-1">
                              {pedagogicalInsights.compItems.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-purple-700 font-bold mt-0.5">•</span>
                                  <div>
                                    <span className="font-semibold text-ink">{item.title}: </span>
                                    <span>{item.desc}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
