/**
 * SalinTinig — Pronunciation Challenge Seed Script
 *
 * Seeds the `pronunciation_items` table with curated Filipino and English
 * vocabulary words appropriate for Grades 4–6. Each word includes a
 * child-friendly definition, syllable breakdown, example sentence,
 * and generates a cached Edge-TTS reference audio via Cloudinary.
 *
 * Usage:
 *   node scripts/seed_pronunciation.js
 *
 * Options:
 *   --skip-audio   Seed word data only, skip Edge-TTS audio generation
 *   --clear        Clear existing pronunciation_items before seeding
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SKIP_AUDIO = process.argv.includes('--skip-audio');
const CLEAR_FIRST = process.argv.includes('--clear');

// ---------------------------------------------------------------------------
// CURATED VOCABULARY LIST (Grade 4-6 Appropriate)
// ---------------------------------------------------------------------------
// Filipino (tl) and English (en) words for the Pronunciation Challenge.
// Syllable arrays are verified against KWF (Komisyon sa Wikang Filipino)
// phonetic rules for Filipino and standard CMU rules for English.
// ---------------------------------------------------------------------------

const pronunciationItems = [
  // -------------------------------------------------------------------------
  // FILIPINO WORDS (language: 'tl')
  // -------------------------------------------------------------------------
  {
    language: 'fil',
    word: 'Bahaghari',
    translation: 'Rainbow',
    definition: 'Makulay na arko sa kalangitan na lilitaw pagkatapos ng ulan.',
    example_sentence: 'Nakita namin ang magandang bahaghari pagkatapos ng ulan.',
    syllables: ['Ba', 'hag', 'ha', 'ri'],
  },
  {
    language: 'fil',
    word: 'Kaibigan',
    translation: 'Friend',
    definition: 'Isang tao na maaari mong pagkatiwalaan at makasama sa lahat ng oras.',
    example_sentence: 'Si Maria ang aking pinakamatalik na kaibigan.',
    syllables: ['Ka', 'i', 'bi', 'gan'],
  },
  {
    language: 'fil',
    word: 'Bulaklak',
    translation: 'Flower',
    definition: 'Magandang bahagi ng halaman na may iba\'t ibang kulay at amoy.',
    example_sentence: 'Nag-alaga siya ng bulaklak sa hardin.',
    syllables: ['Bu', 'lak', 'lak'],
  },
  {
    language: 'fil',
    word: 'Kalayaan',
    translation: 'Freedom',
    definition: 'Ang karapatang gawin ang nais mo nang walang pagpipigil.',
    example_sentence: 'Ipinagdiriwang natin ang ating kalayaan tuwing ika-12 ng Hunyo.',
    syllables: ['Ka', 'la', 'ya', 'an'],
  },
  {
    language: 'fil',
    word: 'Pagmamahal',
    translation: 'Love',
    definition: 'Malalim na mabuting pakiramdam para sa isang tao o bagay.',
    example_sentence: 'Ipinakita niya ang kanyang pagmamahal sa pamamagitan ng tulong.',
    syllables: ['Pag', 'ma', 'ma', 'hal'],
  },
  {
    language: 'fil',
    word: 'Kalikasan',
    translation: 'Nature',
    definition: 'Ang mundo ng mga halaman, hayop, at lahat ng bagay sa paligid natin.',
    example_sentence: 'Kailangan nating pangalagaan ang ating kalikasan.',
    syllables: ['Ka', 'li', 'ka', 'san'],
  },
  {
    language: 'fil',
    word: 'Paaralan',
    translation: 'School',
    definition: 'Lugar kung saan nag-aaral ang mga bata at nagtuturo ang mga guro.',
    example_sentence: 'Masaya akong pumunta sa aming paaralan araw-araw.',
    syllables: ['Pa', 'a', 'ra', 'lan'],
  },
  {
    language: 'fil',
    word: 'Halaman',
    translation: 'Plant',
    definition: 'Buhay na nilalang na tumutubo sa lupa at kailangan ng tubig at sikat ng araw.',
    example_sentence: 'Binibigyan niya ng tubig ang kanyang mga halaman.',
    syllables: ['Ha', 'la', 'man'],
  },
  {
    language: 'fil',
    word: 'Kapakanan',
    translation: 'Welfare',
    definition: 'Ang kagalingan at kabutihan ng isang tao o grupo.',
    example_sentence: 'Lagi niyang inuuna ang kapakanan ng kanyang pamilya.',
    syllables: ['Ka', 'pa', 'ka', 'nan'],
  },
  {
    language: 'fil',
    word: 'Kaalaman',
    translation: 'Knowledge',
    definition: 'Mga bagay na natutunan at naiintindihan ng isang tao.',
    example_sentence: 'Ang pagbabasa ay nagbibigay ng kaalaman sa atin.',
    syllables: ['Ka', 'a', 'la', 'man'],
  },
  {
    language: 'fil',
    word: 'Pamayanan',
    translation: 'Community',
    definition: 'Isang grupo ng mga tao na naninirahan at nagtutulung-tulong sa iisang lugar.',
    example_sentence: 'Sama-sama tayong nagtatrabaho para sa ating pamayanan.',
    syllables: ['Pa', 'ma', 'ya', 'nan'],
  },
  {
    language: 'fil',
    word: 'Katapatan',
    translation: 'Loyalty',
    definition: 'Tapat at matibay na pagtangkilik sa isang tao o prinsipyo.',
    example_sentence: 'Ipinakita niya ang kanyang katapatan sa kanyang bansa.',
    syllables: ['Ka', 'ta', 'pa', 'tan'],
  },
  {
    language: 'fil',
    word: 'Bangka',
    translation: 'Boat',
    definition: 'Maliit na sasakyang-dagat na ginagamit sa ilog o dagat.',
    example_sentence: 'Sumakay sila sa bangka para tumawid sa ilog.',
    syllables: ['Bang', 'ka'],
  },
  {
    language: 'fil',
    word: 'Langit',
    translation: 'Sky',
    definition: 'Ang malawak na espasyong makikita sa itaas natin kapag tumingin tayo sa taas.',
    example_sentence: 'Malinaw at asul ang langit ngayong umaga.',
    syllables: ['La', 'ngit'],
  },
  {
    language: 'fil',
    word: 'Karagatan',
    translation: 'Ocean',
    definition: 'Napakalawak na katawan ng tubig-alat na sumasaklaw sa malaking bahagi ng mundo.',
    example_sentence: 'Libu-libong isda ang naninirahan sa karagatan.',
    syllables: ['Ka', 'ra', 'ga', 'tan'],
  },
  {
    language: 'fil',
    word: 'Katahimikan',
    translation: 'Silence',
    definition: 'Kalagayan ng pagiging tahimik at walang ingay.',
    example_sentence: 'Gusto niya ang katahimikan ng umaga.',
    syllables: ['Ka', 'ta', 'hi', 'mi', 'kan'],
  },
  {
    language: 'fil',
    word: 'Sipnayan',
    translation: 'Mathematics',
    definition: 'Asignatura na tungkol sa mga numero, pagkalkula, at sukat.',
    example_sentence: 'Mahilig siya sa sipnayan lalo na sa pagdadagdag.',
    syllables: ['Sip', 'na', 'yan'],
  },
  {
    language: 'fil',
    word: 'Agham',
    translation: 'Science',
    definition: 'Pag-aaral ng mundo sa pamamagitan ng pagmamasid at eksperimento.',
    example_sentence: 'Natuto kami tungkol sa mga planeta sa aming klase ng agham.',
    syllables: ['Ag', 'ham'],
  },
  {
    language: 'fil',
    word: 'Pagkakaisa',
    translation: 'Unity',
    definition: 'Ang pagtutulungan at pagiging iisa ng isang grupo ng mga tao.',
    example_sentence: 'Sa pagkakaisa, kaya nating harapin ang lahat ng hamon.',
    syllables: ['Pag', 'ka', 'ka', 'i', 'sa'],
  },
  {
    language: 'fil',
    word: 'Kapaligiran',
    translation: 'Environment',
    definition: 'Ang lahat ng bagay na nakapalibot sa atin tulad ng hangin, tubig, at lupa.',
    example_sentence: 'Responsibilidad nating pangalagaan ang ating kapaligiran.',
    syllables: ['Ka', 'pa', 'li', 'gi', 'ran'],
  },
  {
    language: 'fil',
    word: 'Talino',
    translation: 'Intelligence',
    definition: 'Kakayahang matuto, umunawa, at magsagawa ng mga bagay nang mahusay.',
    example_sentence: 'Ipinakita niya ang kanyang talino sa paligsahan.',
    syllables: ['Ta', 'li', 'no'],
  },
  {
    language: 'fil',
    word: 'Magiting',
    translation: 'Brave',
    definition: 'May tapang at lakas ng loob na harapin ang panganib.',
    example_sentence: 'Ang aming mga bayani ay magiting na nagdepensa ng bansa.',
    syllables: ['Ma', 'gi', 'ting'],
  },
  {
    language: 'fil',
    word: 'Mapagkumbaba',
    translation: 'Humble',
    definition: 'Hindi nagmamalaki at palaging gumagalang sa iba.',
    example_sentence: 'Kahit siya ang pinakamatalino, siya ay mapagkumbaba pa rin.',
    syllables: ['Ma', 'pag', 'kum', 'ba', 'ba'],
  },
  {
    language: 'fil',
    word: 'Kagandahan',
    translation: 'Beauty',
    definition: 'Ang katangiang nagbibigay ng kasiyahan sa ating mga mata at puso.',
    example_sentence: 'Ang kagandahan ng kalikasan ay nagbibigay inspirasyon sa atin.',
    syllables: ['Ka', 'gan', 'da', 'han'],
  },
  {
    language: 'fil',
    word: 'Disiplina',
    translation: 'Discipline',
    definition: 'Pagsunod sa mga tama at wastong gawi upang makamit ang mga layunin.',
    example_sentence: 'Ang disiplina ay mahalaga sa tagumpay ng isang bata.',
    syllables: ['Di', 'sip', 'li', 'na'],
  },
  {
    language: 'fil',
    word: 'Katotohanan',
    translation: 'Truth',
    definition: 'Ang mga bagay na totoo at tumpak ayon sa katunayan.',
    example_sentence: 'Lagi nating sabihin ang katotohanan kahit mahirap.',
    syllables: ['Ka', 'to', 'to', 'ha', 'nan'],
  },
  {
    language: 'fil',
    word: 'Pananaw',
    translation: 'Vision',
    definition: 'Ang paraan ng pagtingin o pag-unawa sa isang bagay.',
    example_sentence: 'Malawak ang kanyang pananaw sa hinaharap ng aming bayan.',
    syllables: ['Pa', 'na', 'naw'],
  },
  {
    language: 'fil',
    word: 'Likas',
    translation: 'Natural',
    definition: 'Hindi artipisyal; nagmumula sa kalikasan.',
    example_sentence: 'Likas na maganda ang aming probinsya.',
    syllables: ['Li', 'kas'],
  },
  {
    language: 'fil',
    word: 'Mapanuri',
    translation: 'Critical Thinker',
    definition: 'Maingat at malalim ang pag-iisip bago kumilos o humusga.',
    example_sentence: 'Ang isang mapanuring mag-aaral ay nagtatanong ng maraming tanong.',
    syllables: ['Ma', 'pa', 'nu', 'ri'],
  },
  {
    language: 'fil',
    word: 'Kasaysayan',
    translation: 'History',
    definition: 'Ang talaan ng mga nakaraang pangyayari at karanasan ng mga tao.',
    example_sentence: 'Pag-aralan natin ang kasaysayan ng ating bansa.',
    syllables: ['Ka', 'say', 'sa', 'yan'],
  },
  {
    language: 'fil',
    word: 'Maunlad',
    translation: 'Developed / Progressive',
    definition: 'May pag-unlad at kalakasan sa lahat ng larangan ng buhay.',
    example_sentence: 'Pangarap nating maging isang maunlad na bansa.',
    syllables: ['Ma', 'un', 'lad'],
  },
  // -------------------------------------------------------------------------
  // ENGLISH WORDS (language: 'en')
  // -------------------------------------------------------------------------
  {
    language: 'en',
    word: 'Environment',
    translation: 'Kapaligiran',
    definition: 'The surroundings where people, animals, and plants live.',
    example_sentence: 'We must protect our environment for future generations.',
    syllables: ['en', 'vi', 'ron', 'ment'],
  },
  {
    language: 'en',
    word: 'Beautiful',
    translation: 'Maganda',
    definition: 'Very pleasing to look at or listen to.',
    example_sentence: 'The sunrise over the mountains was beautiful.',
    syllables: ['beau', 'ti', 'ful'],
  },
  {
    language: 'en',
    word: 'Community',
    translation: 'Pamayanan',
    definition: 'A group of people living in the same area and working together.',
    example_sentence: 'Everyone in the community helped clean up the park.',
    syllables: ['com', 'mu', 'ni', 'ty'],
  },
  {
    language: 'en',
    word: 'Courageous',
    translation: 'Matapang',
    definition: 'Having or showing the ability to do something even when it is scary.',
    example_sentence: 'The courageous firefighter saved the family from the burning house.',
    syllables: ['cou', 'ra', 'geous'],
  },
  {
    language: 'en',
    word: 'Knowledge',
    translation: 'Kaalaman',
    definition: 'Facts and information that a person has learned.',
    example_sentence: 'Reading books helps build your knowledge.',
    syllables: ['know', 'ledge'],
  },
  {
    language: 'en',
    word: 'Responsible',
    translation: 'Responsable',
    definition: 'Being trusted to do what is right and expected of you.',
    example_sentence: 'A responsible student always submits homework on time.',
    syllables: ['re', 'spon', 'si', 'ble'],
  },
  {
    language: 'en',
    word: 'Friendship',
    translation: 'Pagkakaibigan',
    definition: 'The relationship between people who like and trust each other.',
    example_sentence: 'Their friendship grew stronger through years of helping each other.',
    syllables: ['friend', 'ship'],
  },
  {
    language: 'en',
    word: 'Volcano',
    translation: 'Bulkan',
    definition: 'A mountain with an opening at the top that can release hot lava and ash.',
    example_sentence: 'The volcano erupted and sent ash high into the sky.',
    syllables: ['vol', 'ca', 'no'],
  },
  {
    language: 'en',
    word: 'Electricity',
    translation: 'Kuryente',
    definition: 'A form of energy that powers lights, machines, and electronic devices.',
    example_sentence: 'We use electricity to power our phones and computers.',
    syllables: ['e', 'lec', 'tri', 'ci', 'ty'],
  },
  {
    language: 'en',
    word: 'Imagination',
    translation: 'Imahinasyon',
    definition: 'The ability to think of new ideas or form pictures in your mind.',
    example_sentence: 'Her imagination helped her write a wonderful story.',
    syllables: ['i', 'mag', 'i', 'na', 'tion'],
  },
  {
    language: 'en',
    word: 'Discovery',
    translation: 'Pagtuklas',
    definition: 'Finding or learning about something for the first time.',
    example_sentence: 'The discovery of fire changed the way early humans lived.',
    syllables: ['dis', 'cov', 'er', 'y'],
  },
  {
    language: 'en',
    word: 'Pollution',
    translation: 'Polusyon',
    definition: 'Harmful waste or chemicals that make the air, water, or land dirty.',
    example_sentence: 'Pollution from factories is harming our rivers.',
    syllables: ['pol', 'lu', 'tion'],
  },
  {
    language: 'en',
    word: 'Celebrate',
    translation: 'Ipagdiwang',
    definition: 'To do something special because of a happy occasion or event.',
    example_sentence: 'We celebrate Independence Day every year with parades.',
    syllables: ['cel', 'e', 'brate'],
  },
  {
    language: 'en',
    word: 'Compassion',
    translation: 'Habag',
    definition: 'Feeling care and concern for people who are suffering.',
    example_sentence: 'She showed compassion by helping the homeless people.',
    syllables: ['com', 'pas', 'sion'],
  },
  {
    language: 'en',
    word: 'Technology',
    translation: 'Teknolohiya',
    definition: 'Tools, machines, and devices created by science to solve problems.',
    example_sentence: 'Technology has made it easier for us to communicate with others.',
    syllables: ['tech', 'nol', 'o', 'gy'],
  },
  {
    language: 'en',
    word: 'Perseverance',
    translation: 'Tiyaga',
    definition: 'Continuing to try even when things are difficult.',
    example_sentence: 'Through perseverance, he finally learned how to read.',
    syllables: ['per', 'se', 'ver', 'ance'],
  },
  {
    language: 'en',
    word: 'Nutrition',
    translation: 'Nutrisyon',
    definition: 'Eating the right foods to keep your body strong and healthy.',
    example_sentence: 'Good nutrition is important for growing children.',
    syllables: ['nu', 'tri', 'tion'],
  },
  {
    language: 'en',
    word: 'Patriotism',
    translation: 'Pagmamahal sa Bayan',
    definition: 'Love and pride for your own country.',
    example_sentence: 'Patriotism means doing your part to make your country better.',
    syllables: ['pa', 'tri', 'ot', 'ism'],
  },
  {
    language: 'en',
    word: 'Earthquake',
    translation: 'Lindol',
    definition: 'A sudden shaking of the ground caused by movement under the Earth\'s surface.',
    example_sentence: 'The earthquake shook the buildings for about thirty seconds.',
    syllables: ['earth', 'quake'],
  },
  {
    language: 'en',
    word: 'Photosynthesis',
    translation: 'Photosynthesis',
    definition: 'The process where plants use sunlight to make their own food.',
    example_sentence: 'Plants use photosynthesis to turn sunlight into energy.',
    syllables: ['pho', 'to', 'syn', 'the', 'sis'],
  },
  {
    language: 'en',
    word: 'Cooperation',
    translation: 'Kooperasyon',
    definition: 'Working together with others to achieve something.',
    example_sentence: 'Cooperation between students helped them finish the project faster.',
    syllables: ['co', 'op', 'er', 'a', 'tion'],
  },
  {
    language: 'en',
    word: 'Archipelago',
    translation: 'Kapuluan',
    definition: 'A group of many islands close together in a body of water.',
    example_sentence: 'The Philippines is a beautiful archipelago of over 7,000 islands.',
    syllables: ['ar', 'chi', 'pel', 'a', 'go'],
  },
  {
    language: 'en',
    word: 'Investigate',
    translation: 'Imbestigahan',
    definition: 'To look carefully into something to find out the facts.',
    example_sentence: 'Students investigate how plants grow during science class.',
    syllables: ['in', 'ves', 'ti', 'gate'],
  },
  {
    language: 'en',
    word: 'Summarize',
    translation: 'Ibuod',
    definition: 'To give a short description of the main points of something.',
    example_sentence: 'Can you summarize the story we just read?',
    syllables: ['sum', 'ma', 'rize'],
  },
  {
    language: 'en',
    word: 'Communicate',
    translation: 'Makipag-usap',
    definition: 'To share information, thoughts, or feelings with others.',
    example_sentence: 'It is important to communicate clearly with your classmates.',
    syllables: ['com', 'mu', 'ni', 'cate'],
  },
  {
    language: 'en',
    word: 'Responsibility',
    translation: 'Responsibilidad',
    definition: 'The duty to take care of someone or something.',
    example_sentence: 'It is our responsibility to keep our classroom clean.',
    syllables: ['re', 'spon', 'si', 'bil', 'i', 'ty'],
  },
  {
    language: 'en',
    word: 'Atmosphere',
    translation: 'Atmospera',
    definition: 'The layer of gases surrounding the Earth that we breathe.',
    example_sentence: 'The atmosphere protects us from harmful rays of the sun.',
    syllables: ['at', 'mos', 'phere'],
  },
  {
    language: 'en',
    word: 'Biodiversity',
    translation: 'Biodibersidad',
    definition: 'The variety of different plants, animals, and other living things in an area.',
    example_sentence: 'The forest is full of biodiversity with hundreds of species.',
    syllables: ['bi', 'o', 'di', 'ver', 'si', 'ty'],
  },
  {
    language: 'en',
    word: 'Independence',
    translation: 'Kalayaan',
    definition: 'The state of being free from the control of others.',
    example_sentence: 'The Philippines gained independence on June 12, 1898.',
    syllables: ['in', 'de', 'pen', 'dence'],
  },
  {
    language: 'en',
    word: 'Transparent',
    translation: 'Maliwanag / Transparent',
    definition: 'Something you can see through clearly, like glass.',
    example_sentence: 'The water in the river was so clean and transparent.',
    syllables: ['trans', 'par', 'ent'],
  },
  {
    language: 'en',
    word: 'Evaporation',
    translation: 'Evaporasyon',
    definition: 'When liquid turns into vapor or gas due to heat.',
    example_sentence: 'Evaporation happens when puddles disappear after the sun comes out.',
    syllables: ['e', 'vap', 'o', 'ra', 'tion'],
  },
];

// ---------------------------------------------------------------------------
// AUDIO GENERATION
// ---------------------------------------------------------------------------

async function generateAudioForWord(word, language) {
  if (SKIP_AUDIO) return null;

  try {
    const { synthesizeTextToAudio } = require('../src/services/ttsService.js');
    const langKey = (language === 'en' || language === 'eng') ? 'en' : 'fil';
    const wordFolder = langKey === 'en' ? 'salintinig/pronunciation/words/eng' : 'salintinig/pronunciation/words/fil';

    const result = await synthesizeTextToAudio(word, langKey, '0%', null, wordFolder);
    return result?.audioUrl || null;

  } catch (err) {
    console.warn(`  [audio] Could not generate audio for "${word}": ${err.message}`);
    return null;
  }
}


// ---------------------------------------------------------------------------
// SEEDING
// ---------------------------------------------------------------------------

async function seedPronunciationItems() {
  const client = await pool.connect();

  try {
    console.log('\n SalinTinig Pronunciation Challenge Seed\n');

    if (CLEAR_FIRST) {
      await client.query('DELETE FROM pronunciation_items');
      console.log('Cleared existing pronunciation_items.\n');
    }

    let inserted = 0;
    let skipped = 0;

    for (const item of pronunciationItems) {
      // Idempotent: skip if this word + language already exists
      const existing = await client.query(
        `SELECT item_id FROM pronunciation_items WHERE LOWER(word) = LOWER($1) AND language = $2 LIMIT 1`,
        [item.word, item.language]
      );

      if (existing.rows.length > 0) {
        console.log(`  Skipping duplicate: [${item.language.toUpperCase()}] ${item.word}`);
        skipped++;
        continue;
      }

      console.log(`  Generating audio: [${item.language.toUpperCase()}] ${item.word}...`);
      const audioUrl = await generateAudioForWord(item.word, item.language);

      // Generate syllable audio URLs (with deduplicated reuse)
      const { synthesizeTextToAudio } = require('../src/services/ttsService.js');
      const langKey = (item.language === 'en' || item.language === 'eng') ? 'en' : 'fil';
      const langFolder = langKey === 'en' ? 'salintinig/pronunciation/syllables/eng' : 'salintinig/pronunciation/syllables/fil';
      const syllableAudioList = [];

      for (const syl of item.syllables) {
        try {
          // Check if this exact syllable for the SAME language group already exists in DB
          const existingSyl = await client.query(
            `SELECT elem->>'audioUrl' as audio_url
             FROM pronunciation_items,
                  jsonb_array_elements(syllable_audio_urls) as elem
             WHERE (
               CASE 
                 WHEN LOWER(language) IN ('en', 'eng') THEN 'en' 
                 ELSE 'fil' 
               END
             ) = $1
               AND LOWER(elem->>'syllable') = LOWER($2)
               AND elem->>'audioUrl' IS NOT NULL
             LIMIT 1`,
            [langKey, syl]
          );

          let sylUrl = existingSyl.rows[0]?.audio_url;

          if (!sylUrl) {
            const res = await synthesizeTextToAudio(syl, langKey, '-12%', null, langFolder);
            sylUrl = res?.audioUrl || null;
          } else {
            console.log(`    ♻️ Reusing existing ${langKey.toUpperCase()} audio for syllable "${syl}"`);
          }

          syllableAudioList.push({ syllable: syl, audioUrl: sylUrl });
        } catch (e) {
          syllableAudioList.push({ syllable: syl, audioUrl: null });
        }
      }

      await client.query(
        `INSERT INTO pronunciation_items
          (language, word, translation, definition, example_sentence, syllables, audio_url, syllable_audio_urls, source, content_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          item.language,
          item.word,
          item.translation,
          item.definition,
          item.example_sentence || null,
          JSON.stringify(item.syllables),
          audioUrl || null,
          JSON.stringify(syllableAudioList),
          'system',
          'validated',
        ]
      );

      console.log(`  Inserted: [${item.language.toUpperCase()}] ${item.word} — ${item.syllables.join(' - ')}`);
      inserted++;
    }

    const { rows: totals } = await client.query(
      `SELECT language, COUNT(*) AS count FROM pronunciation_items GROUP BY language ORDER BY language`
    );

    console.log('\n-------------------------------------------');
    console.log(`Done! Inserted: ${inserted} | Skipped (duplicates): ${skipped}`);
    console.log('\npronunciation_items by language:');
    console.table(totals);

    if (SKIP_AUDIO) {
      console.log('Audio generation was skipped (--skip-audio flag).');
      console.log('Run without --skip-audio to generate Edge-TTS reference audio.');
    }

    process.exit(0);
  } catch (err) {
    console.error('\nSeeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedPronunciationItems();
