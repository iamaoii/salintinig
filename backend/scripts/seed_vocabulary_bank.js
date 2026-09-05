/**
 * SalinTinig — Unified Vocabulary Bank Seeder Script
 *
 * Single source of truth for both:
 * 1. Pronunciation Challenge (syllables, definitions, example sentences, TTS audio)
 * 2. Vocabulary Matching (English <-> Filipino translation pairs, difficulty tiers)
 *
 * Usage:
 *   node scripts/seed_vocabulary_bank.js
 *
 * Options:
 *   --skip-audio   Seed word data without making Edge-TTS / Cloudinary network requests
 *   --clear        Delete existing vocabulary_bank records before seeding
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE CURATED WORD REPOSITORY (DepEd Grade-Appropriate)
// ─────────────────────────────────────────────────────────────────────────────
const vocabularyBankData = [
  // ===========================================================================
  // 1. FILIPINO WORDS — EASY (Kinder - Grade 2: Family, Animals, Body, Objects)
  // ===========================================================================
  {
    language: 'fil',
    word: 'Nanay',
    translation: 'Mother',
    definition: 'Ang babaeng nagluwal o nag-aaruga sa mga anak sa tahanan.',
    example_sentence: 'Mabait at mapagmahal ang aking nanay.',
    syllables: ['Na', 'nay'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Tatay',
    translation: 'Father',
    definition: 'Ang lalaking tumatayong haligi ng tahanan at ama ng mga anak.',
    example_sentence: 'Nagtatrabaho si tatay para sa aming pamilya.',
    syllables: ['Ta', 'tay'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Kapatid',
    translation: 'Sibling',
    definition: 'Kasama sa pamilya na may iisang mga magulang.',
    example_sentence: 'Naglalaro kami ng aking kapatid tuwing hapon.',
    syllables: ['Ka', 'pa', 'tid'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Lapis',
    translation: 'Pencil',
    definition: 'Kagamitan sa pagsusulat na may grapayt sa loob.',
    example_sentence: 'Ginamit ko ang aking lapis sa pagguhit ng bahay.',
    syllables: ['La', 'pis'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Aklat',
    translation: 'Book',
    definition: 'Tipon ng mga nakalimbag na pahina para basahin at matuto.',
    example_sentence: 'Nagbabasa ako ng aklat bago matulog sa gabi.',
    syllables: ['Ak', 'lat'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Mesa',
    translation: 'Table',
    definition: 'Kagamitang may patag na ibabaw at mga paa kung saan kumakain o nag-aaral.',
    example_sentence: 'Inilagay ni nanay ang masarap na pagkain sa ibabaw ng mesa.',
    syllables: ['Me', 'sa'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Upuan',
    translation: 'Chair',
    definition: 'Kagamitan na ginagamit upang maupuan.',
    example_sentence: 'Umupo ang mag-aaral sa malinis na upuan.',
    syllables: ['U', 'pu', 'an'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Pintuan',
    translation: 'Door',
    definition: 'Lagusan para sa pagpasok at paglabas ng silid o bahay.',
    example_sentence: 'Kumatok muna siya bago binuksan ang pintuan.',
    syllables: ['Pin', 'tu', 'an'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Bintana',
    translation: 'Window',
    definition: 'Bukas sa dingding kung saan pumapasok ang sariwang hangin at sikat ng araw.',
    example_sentence: 'Tanaw namin ang magandang bundok mula sa bintana.',
    syllables: ['Bin', 'ta', 'na'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Dahon',
    translation: 'Leaf',
    definition: 'Berdeng bahagi ng halaman na gumagawa ng pagkain sa pamamagitan ng sikat ng araw.',
    example_sentence: 'Nahulog ang tuyong dahon mula sa puno.',
    syllables: ['Da', 'hon'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Kamay',
    translation: 'Hand',
    definition: 'Bahagi ng katawan sa dulo ng braso na may mga daliri.',
    example_sentence: 'Hugasan ang mga kamay gamit ang sabon at malinis na tubig.',
    syllables: ['Ka', 'may'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Mata',
    translation: 'Eye',
    definition: 'Bahagi ng mukha na ginagamit upang makakita.',
    example_sentence: 'Malinaw ang paningin ng kanyang mga mata.',
    syllables: ['Ma', 'ta'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Bibig',
    translation: 'Mouth',
    definition: 'Bahagi ng mukha na ginagamit sa pagkain at pagsasalita.',
    example_sentence: 'Ngumiti siya nang magiliw gamit ang kanyang bibig.',
    syllables: ['Bi', 'big'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Ilong',
    translation: 'Nose',
    definition: 'Bahagi ng mukha na ginagamit sa pag-amoy at paghinga.',
    example_sentence: 'Mabangong bulaklak ang naamoy ng aking ilong.',
    syllables: ['I', 'long'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Tenga',
    translation: 'Ear',
    definition: 'Bahagi ng katawan na ginagamit sa pakikinig ng mga tunog.',
    example_sentence: 'Makinig nang mabuti gamit ang iyong mga tenga sa guro.',
    syllables: ['Te', 'nga'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Gabi',
    translation: 'Night',
    definition: 'Panahon ng kadiliman sa pagitan ng paglubog at pagsikat ng araw.',
    example_sentence: 'Maliwanag ang mga bituin sa langit ngayong gabi.',
    syllables: ['Ga', 'bi'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Tubig',
    translation: 'Water',
    definition: 'Malinaw na likidong kailangan sa buhay ng tao, hayop, at halaman.',
    example_sentence: 'Uminom ng maraming tubig upang manatiling malusog.',
    syllables: ['Tu', 'big'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Araw',
    translation: 'Sun',
    definition: 'Bituin sa gitna ng sistemang solar na nagbibigay ng liwanag at init.',
    example_sentence: 'Maliwanag ang sikat ng araw sa maagang umaga.',
    syllables: ['A', 'raw'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Ibon',
    translation: 'Bird',
    definition: 'Hayop na may balahibo at pakpak na karaniwang lumilipad sa himpapawid.',
    example_sentence: 'Umaawit ang maliit na ibon sa sanga ng mangga.',
    syllables: ['I', 'bon'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Isda',
    translation: 'Fish',
    definition: 'Hayop na may palikpik at hasang na lumalangoy sa tubig.',
    example_sentence: 'Lumalangoy ang makulay na isda sa malinis na sapa.',
    syllables: ['Is', 'da'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Aso',
    translation: 'Dog',
    definition: 'Matalik na kaibigang hayop ng tao na tumatahol at nagbabantay ng bahay.',
    example_sentence: 'Matiyagang nagbabantay ng bakuran ang aming aso.',
    syllables: ['A', 'so'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Pusa',
    translation: 'Cat',
    definition: 'Maamong alagang hayop na ngumingiyaw at humuhuli ng daga.',
    example_sentence: 'Natutulog ang maputing pusa sa ilalim ng sofa.',
    syllables: ['Pu', 'sa'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Bahay',
    translation: 'House',
    definition: 'Tirahan ng pamilya na nagbibigay ng proteksyon sa init at ulan.',
    example_sentence: 'Masayang nagsasalo ang pamilya sa loob ng bahay.',
    syllables: ['Ba', 'hay'],
    difficulty: 'easy',
  },
  {
    language: 'fil',
    word: 'Gatas',
    translation: 'Milk',
    definition: 'Puting masustansyang inuming nagpapatibay ng buto at ngipin.',
    example_sentence: 'Uminom siya ng mainit na gatas bago matulog.',
    syllables: ['Ga', 'tas'],
    difficulty: 'easy',
  },

  // ===========================================================================
  // 2. FILIPINO WORDS — MEDIUM (Grade 3 - 4: School, Nature, Feelings, Community)
  // ===========================================================================
  {
    language: 'fil',
    word: 'Guro',
    translation: 'Teacher',
    definition: 'Taong nagtuturo at gumagabay sa mga mag-aaral sa paaralan.',
    example_sentence: 'Matiyagang nagpapaliwanag ng aralin ang aming guro.',
    syllables: ['Gu', 'ro'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Mag-aaral',
    translation: 'Student',
    definition: 'Batang pumapasok sa eskuwelahan upang matuto at magbasa.',
    example_sentence: 'Masipag gumawa ng takdang-aralin ang mag-aaral.',
    syllables: ['Mag', 'a', 'a', 'ral'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Masaya',
    translation: 'Happy',
    definition: 'Damdamin ng kagalakan, tuwa, at kasiyahan sa puso.',
    example_sentence: 'Masaya kaming nagdiwang ng pista sa aming baryo.',
    syllables: ['Ma', 'sa', 'ya'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Malungkot',
    translation: 'Sad',
    definition: 'Damdamin ng pighati o kawalan ng sigla at ligaya.',
    example_sentence: 'Huwag kang malungkot, nariyan ang iyong mga kaibigan.',
    syllables: ['Ma', 'lung', 'kot'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Mabilis',
    translation: 'Fast',
    definition: 'May angking bilis o tulin sa paggalaw o pagkilos.',
    example_sentence: 'Mabilis tumakbo ang usa upang makatawid sa parang.',
    syllables: ['Ma', 'bi', 'lis'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Mabagal',
    translation: 'Slow',
    definition: 'Kakaunti ang tulin at dahan-dahang kumikilos.',
    example_sentence: 'Mabagal man maglakad ang pagong, narating pa rin niya ang dulo.',
    syllables: ['Ma', 'ba', 'gal'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Palengke',
    translation: 'Market',
    definition: 'Pook kung saan nabibili ang sariwang gulay, isda, at prutas.',
    example_sentence: 'Namili si nanay ng sariwang gulay sa palengke kaninang umaga.',
    syllables: ['Pa', 'leng', 'ke'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Simbahan',
    translation: 'Church',
    definition: 'Gusaling banal kung saan nagdarasal at sumasamba ang mga tao.',
    example_sentence: 'Sama-samang nagsimba ang buong mag-anak sa simbahan.',
    syllables: ['Sim', 'ba', 'han'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Kalsada',
    translation: 'Road',
    definition: 'Daanang ginagamit ng mga sasakyan at mga naglalakad.',
    example_sentence: 'Ligtas na tumawid sa tamang tawiran sa kalsada.',
    syllables: ['Kal', 'sa', 'da'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Liwanag',
    translation: 'Light',
    definition: 'Kaningningan na nagpapalinaw at nagtataboy ng kadiliman.',
    example_sentence: 'Naghatid ng liwanag ang parola sa mga bangka sa dagat.',
    syllables: ['Li', 'wa', 'nag'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Dilim',
    translation: 'Darkness',
    definition: 'Kawalan o kakulangan ng liwanag sa paligid.',
    example_sentence: 'Nawala ang takot sa dilim nang sumindi ang lampara.',
    syllables: ['Di', 'lim'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Ulan',
    translation: 'Rain',
    definition: 'Patak ng tubig na bumabagsak mula sa mga ulap sa himpapawid.',
    example_sentence: 'Nagdala siya ng payong dahil sa malalaking patak ng ulan.',
    syllables: ['U', 'lan'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Hangin',
    translation: 'Wind',
    definition: 'Likas na hanging umiihip at nagpapagalaw sa mga puno.',
    example_sentence: 'Sariwa at malamig ang ihip ng hangin sa bukid.',
    syllables: ['Ha', 'ngin'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Dagat',
    translation: 'Sea',
    definition: 'Malawak na anyong-tubig na maalat kung saan may mga barko.',
    example_sentence: 'Nangingisda ang mga mamamayan sa bughaw na dagat.',
    syllables: ['Da', 'gat'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Ilog',
    translation: 'River',
    definition: 'Mahabang anyong-tubig na umaagos patungo sa lawa o dagat.',
    example_sentence: 'Malinaw ang tubig sa ilog kung saan lumalangoy ang mga bata.',
    syllables: ['I', 'log'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Puno',
    translation: 'Tree',
    definition: 'Mataas na halaman na may makahoy na katawan at mga sanga.',
    example_sentence: 'Malamig ang lilim sa ilalim ng malaking puno ng akasya.',
    syllables: ['Pu', 'no'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Bulaklak',
    translation: 'Flower',
    definition: 'Makulay at mabangong bahagi ng halaman.',
    example_sentence: 'Pumitas si Ana ng magandang bulaklak para sa kanyang ina.',
    syllables: ['Bu', 'lak', 'lak'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Halaman',
    translation: 'Plant',
    definition: 'Nilalang na tumutubo sa lupa at gumagawa ng sariling pagkain.',
    example_sentence: 'Didiligan ko ang mga halaman sa hardin araw-araw.',
    syllables: ['Ha', 'la', 'man'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Bangka',
    translation: 'Boat',
    definition: 'Maliit na sasakyang-pantubig na sinasagwan o de-motor.',
    example_sentence: 'Sumakay kami sa bangka upang marating ang kabilang isla.',
    syllables: ['Bang', 'ka'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Langit',
    translation: 'Sky',
    definition: 'Ang malawak na asul na espasyo sa ibabaw ng daigdig.',
    example_sentence: 'Puti at malalambot ang mga ulap sa bughaw na langit.',
    syllables: ['La', 'ngit'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Kaibigan',
    translation: 'Friend',
    definition: 'Taong may tapat na malasakit at pagmamahal sa iyo.',
    example_sentence: 'Maaasahan ko ang aking kaibigan sa oras ng pangangailangan.',
    syllables: ['Ka', 'i', 'bi', 'gan'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Paaralan',
    translation: 'School',
    definition: 'Pook kung saan sama-samang nag-aaral ang mga kabataan.',
    example_sentence: 'Marami akong natutunang magagandang aral sa aming paaralan.',
    syllables: ['Pa', 'a', 'ra', 'lan'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Talino',
    translation: 'Intelligence',
    definition: 'Kakayahan ng isip na umunawa, lumikha, at magpasya nang wasto.',
    example_sentence: 'Ginamit niya ang kanyang talino upang makatulong sa kapwa.',
    syllables: ['Ta', 'li', 'no'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Magiting',
    translation: 'Brave',
    definition: 'Nagtataglay ng tapang at kabayanihan sa pagharap sa pagsubok.',
    example_sentence: 'Ang mga manggagamot ay magiting na naglingkod sa mamamayan.',
    syllables: ['Ma', 'gi', 'ting'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Kagandahan',
    translation: 'Beauty',
    definition: 'Katangiang nagbibigay-kasiyahan sa paningin at puso.',
    example_sentence: 'Kahali-halina ang kagandahan ng mga tanawin sa Pilipinas.',
    syllables: ['Ka', 'gan', 'da', 'han'],
    difficulty: 'medium',
  },
  {
    language: 'fil',
    word: 'Disiplina',
    translation: 'Discipline',
    definition: 'Pagsunod sa mga panuntunan at tamang pag-uugali.',
    example_sentence: 'Mahalaga ang sariling disiplina upang makatapos sa pag-aaral.',
    syllables: ['Di', 'sip', 'li', 'na'],
    difficulty: 'medium',
  },

  // ===========================================================================
  // 3. FILIPINO WORDS — HARD (Grade 5 - 6: Values, Society, Abstract Concepts)
  // ===========================================================================
  {
    language: 'fil',
    word: 'Bahaghari',
    translation: 'Rainbow',
    definition: 'Makulay na arko sa langit na sumisikat pagkatapos ng ulan.',
    example_sentence: 'May pitong matingkad na kulay ang magandang bahaghari.',
    syllables: ['Ba', 'hag', 'ha', 'ri'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Kalayaan',
    translation: 'Freedom',
    definition: 'Karapatang mamuhay nang walang pang-aapi at may kasarinlan.',
    example_sentence: 'Ipinaglaban ng ating mga ninuno ang kalayaan ng inang bayan.',
    syllables: ['Ka', 'la', 'ya', 'an'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Pagmamahal',
    translation: 'Love',
    definition: 'Wagas at dakilang damdamin ng malasakit at pag-aaruga sa iba.',
    example_sentence: 'Walang kapantay ang pagmamahal ng magulang sa kanyang anak.',
    syllables: ['Pag', 'ma', 'ma', 'hal'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Kalikasan',
    translation: 'Nature',
    definition: 'Ang likas na mundo ng mga halaman, hayop, hangin, at karagatan.',
    example_sentence: 'Tungkulin ng bawat isa na igalang at protektahan ang kalikasan.',
    syllables: ['Ka', 'li', 'ka', 'san'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Kapakanan',
    translation: 'Welfare',
    definition: 'Kabutihan, kalusugan, at kaligtasan ng isang indibidwal o grupo.',
    example_sentence: 'Isinaalang-alang ng lider ang kapakanan ng lahat ng tao.',
    syllables: ['Ka', 'pa', 'ka', 'nan'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Kaalaman',
    translation: 'Knowledge',
    definition: 'Mga aral, impormasyon, at karunungang nakukuha sa pag-aaral.',
    example_sentence: 'Ang kaalaman ay kayamanang hindi mananakaw ninuman.',
    syllables: ['Ka', 'a', 'la', 'man'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Pamayanan',
    translation: 'Community',
    definition: 'Samahan ng mga pamilya at mamamayang naninirahan sa iisang pook.',
    example_sentence: 'Nagtutulungan ang buong pamayanan sa panahon ng bagyo.',
    syllables: ['Pa', 'ma', 'ya', 'nan'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Karagatan',
    translation: 'Ocean',
    definition: 'Pinakamalawak na katawan ng tubig-alat na sumasaklaw sa mundo.',
    example_sentence: 'Sarisaring nilalang ang namumuhay sa ilalim ng malalim na karagatan.',
    syllables: ['Ka', 'ra', 'ga', 'tan'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Katahimikan',
    translation: 'Silence',
    definition: 'Kalagayan ng kapayapaan, kawalan ng ingay, at katiwasayan.',
    example_sentence: 'Niyakap niya ang payapang katahimikan sa tuktok ng bundok.',
    syllables: ['Ka', 'ta', 'hi', 'mi', 'kan'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Pagkakaisa',
    translation: 'Unity',
    definition: 'Pagsasama-sama ng damdamin at lakas tungo sa iisang mithiin.',
    example_sentence: 'Bunga ng pagkakaisa ang mabilis na pagbangon ng komunidad.',
    syllables: ['Pag', 'ka', 'ka', 'i', 'sa'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Kapaligiran',
    translation: 'Environment',
    definition: 'Ang lahat ng bagay na pumapalibot sa tao, may buhay man o wala.',
    example_sentence: 'Panatilihing malinis ang ating kapaligiran upang makaiwas sa sakit.',
    syllables: ['Ka', 'pa', 'li', 'gi', 'ran'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Mapagkumbaba',
    translation: 'Humble',
    definition: 'Hindi nagmamataas at may bukas na pusong handang matuto.',
    example_sentence: 'Kahit nagkamit ng parangal, nanatili siyang mapagkumbaba.',
    syllables: ['Ma', 'pag', 'kum', 'ba', 'ba'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Katotohanan',
    translation: 'Truth',
    definition: 'Ang tunay na nangyari at walang bahid ng kasinungalingan.',
    example_sentence: 'Ang katotohanan ang magpapalaya sa ating kaisipan.',
    syllables: ['Ka', 'to', 'to', 'ha', 'nan'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Kasaysayan',
    translation: 'History',
    definition: 'Talaan ng mga nakaraang pangyayari na humubog sa ating bansa.',
    example_sentence: 'Mahalagang balikan ang kasaysayan upang maunawaan ang kasalukuyan.',
    syllables: ['Ka', 'say', 'sa', 'yan'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Kapayapaan',
    translation: 'Peace',
    definition: 'Ugnayang walang sigalot, digmaan, o kaguluhan.',
    example_sentence: 'Ipinapanalangin natin ang kapayapaan sa buong daigdig.',
    syllables: ['Ka', 'pa', 'ya', 'pa', 'an'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Karunungan',
    translation: 'Wisdom',
    definition: 'Lalim ng pag-unawa at wastong paggamit ng kaalaman sa buhay.',
    example_sentence: 'Ang karunungan ng matatanda ay gabay sa ating landas.',
    syllables: ['Ka', 'ru', 'nu', 'ngan'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Katarungan',
    translation: 'Justice',
    definition: 'Pagiging patas at pagbibigay sa bawat tao ng nararapat sa kanya.',
    example_sentence: 'Patas na katarungan ang sigaw ng mga biktima ng karahasan.',
    syllables: ['Ka', 'ta', 'ru', 'ngan'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Katapatan',
    translation: 'Honesty',
    definition: 'Pagsasabi ng totoo at pagiging tapat sa salita at sa gawa.',
    example_sentence: 'Ipinakita niya ang katapatan sa pamamagitan ng pagsasauli ng pitaka.',
    syllables: ['Ka', 'ta', 'pa', 'tan'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Pag-asa',
    translation: 'Hope',
    definition: 'Mapanalig na pagtitiwala na magiging maganda ang bukas.',
    example_sentence: 'May pag-asa sa bawat pagsikat ng bagong araw.',
    syllables: ['Pag', 'a', 'sa'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Tagumpay',
    translation: 'Success',
    definition: 'Pagkamit ng pinagsumikapang mithiin o layunin.',
    example_sentence: 'Bunga ng kanyang sipag ang natamong tagumpay sa pagtatapos.',
    syllables: ['Ta', 'gum', 'pay'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Pangarap',
    translation: 'Dream',
    definition: 'Mithiing inaasam na marating o maging sa hinaharap.',
    example_sentence: 'Pangarap niyang maging isang mahusay na guro balang araw.',
    syllables: ['Pa', 'nga', 'rap'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Tapang',
    translation: 'Courage',
    definition: 'Lakas ng loob na harapin ang takot o panganib para sa kabutihan.',
    example_sentence: 'Ipinamalas ng mga bayani ang tapang sa pagtatanggol ng bansa.',
    syllables: ['Ta', 'pang'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Sipag',
    translation: 'Diligence',
    definition: 'Kasigasigan at tiyaga sa pagtupad ng mga gawain.',
    example_sentence: 'Dahil sa kanyang sipag, nakapagpatayo siya ng sariling negosyo.',
    syllables: ['Si', 'pag'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Tiwala',
    translation: 'Trust',
    definition: 'Kumpiyansa at pananalig sa integridad at kakayahan ng iba.',
    example_sentence: 'Huwag sirain ang tiwala na ipinagkaloob sa iyo ng kapwa.',
    syllables: ['Ti', 'wa', 'la'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Biyaya',
    translation: 'Blessing',
    definition: 'Kaloob, tulong, o kabutihang tinanggap mula sa itaas o kapwa.',
    example_sentence: 'Isang malaking biyaya ang magkaroon ng malusog na pamilya.',
    syllables: ['Bi', 'ya', 'ya'],
    difficulty: 'hard',
  },
  {
    language: 'fil',
    word: 'Kaugalian',
    translation: 'Tradition',
    definition: 'Mga nakagawian at kulturang ipinamana ng mga ninuno.',
    example_sentence: 'Magandang kaugalian ang paggalang at pagmamano sa matatanda.',
    syllables: ['Ka', 'u', 'ga', 'li', 'an'],
    difficulty: 'hard',
  },

  // ===========================================================================
  // 4. ENGLISH WORDS — EASY (Kinder - Grade 2: Basic Words)
  // ===========================================================================
  {
    language: 'en',
    word: 'Sun',
    translation: 'Araw',
    definition: 'The bright star in the center of the solar system that gives us light.',
    example_sentence: 'The sun rises in the east and warms the earth.',
    syllables: ['sun'],
    difficulty: 'easy',
  },
  {
    language: 'en',
    word: 'Water',
    translation: 'Tubig',
    definition: 'The clear liquid that all living things need to drink and survive.',
    example_sentence: 'Drink plenty of clean water every single day.',
    syllables: ['wa', 'ter'],
    difficulty: 'easy',
  },
  {
    language: 'en',
    word: 'Cat',
    translation: 'Pusa',
    definition: 'A small furry domestic animal that meows and catches mice.',
    example_sentence: 'The little cat is sleeping softly on the rug.',
    syllables: ['cat'],
    difficulty: 'easy',
  },
  {
    language: 'en',
    word: 'Dog',
    translation: 'Aso',
    definition: 'A friendly pet animal known as man\'s best friend that barks.',
    example_sentence: 'The loyal dog wags its tail when its owner arrives.',
    syllables: ['dog'],
    difficulty: 'easy',
  },
  {
    language: 'en',
    word: 'Book',
    translation: 'Aklat',
    definition: 'A set of printed pages bound together with stories and lessons.',
    example_sentence: 'She opened her favorite book and started to read.',
    syllables: ['book'],
    difficulty: 'easy',
  },
  {
    language: 'en',
    word: 'Pencil',
    translation: 'Lapis',
    definition: 'A wooden instrument used for writing and drawing with graphite.',
    example_sentence: 'He sharpened his pencil before drawing the picture.',
    syllables: ['pen', 'cil'],
    difficulty: 'easy',
  },
  {
    language: 'en',
    word: 'Tree',
    translation: 'Puno',
    definition: 'A tall woody plant with a single trunk, branches, and leaves.',
    example_sentence: 'Birds built a cozy nest high up in the tree.',
    syllables: ['tree'],
    difficulty: 'easy',
  },
  {
    language: 'en',
    word: 'Flower',
    translation: 'Bulaklak',
    definition: 'The colorful blossom of a plant that attracts bees and butterflies.',
    example_sentence: 'The yellow flower blooms brightly in the garden.',
    syllables: ['flow', 'er'],
    difficulty: 'easy',
  },
  {
    language: 'en',
    word: 'Bird',
    translation: 'Ibon',
    definition: 'A feathered creature with wings that can fly high in the air.',
    example_sentence: 'The blue bird chirps a happy tune in the morning.',
    syllables: ['bird'],
    difficulty: 'easy',
  },
  {
    language: 'en',
    word: 'Fish',
    translation: 'Isda',
    definition: 'A water animal with fins, gills, and scales that swims.',
    example_sentence: 'A tiny orange fish swims quickly in the aquarium.',
    syllables: ['fish'],
    difficulty: 'easy',
  },
  {
    language: 'en',
    word: 'Milk',
    translation: 'Gatas',
    definition: 'A nutritious white liquid drink that helps children grow strong.',
    example_sentence: 'Drinking milk helps build strong bones and teeth.',
    syllables: ['milk'],
    difficulty: 'easy',
  },
  {
    language: 'en',
    word: 'House',
    translation: 'Bahay',
    definition: 'A building where people and families live safely together.',
    example_sentence: 'Our house is warm and welcoming to visitors.',
    syllables: ['house'],
    difficulty: 'easy',
  },
  {
    language: 'en',
    word: 'Hand',
    translation: 'Kamay',
    definition: 'The part of the body at the end of the arm with five fingers.',
    example_sentence: 'Raise your hand if you know the correct answer.',
    syllables: ['hand'],
    difficulty: 'easy',
  },
  {
    language: 'en',
    word: 'Eye',
    translation: 'Mata',
    definition: 'The organ of the body used for seeing colors, shapes, and light.',
    example_sentence: 'Close your eyes and make a birthday wish.',
    syllables: ['eye'],
    difficulty: 'easy',
  },

  // ===========================================================================
  // 5. ENGLISH WORDS — MEDIUM (Grade 3 - 4: Intermediate Vocabulary)
  // ===========================================================================
  {
    language: 'en',
    word: 'Beautiful',
    translation: 'Maganda',
    definition: 'Pleasing to the senses, charming, and delightful to see or hear.',
    example_sentence: 'The colorful rainbow in the sky was so beautiful.',
    syllables: ['beau', 'ti', 'ful'],
    difficulty: 'medium',
  },
  {
    language: 'en',
    word: 'Community',
    translation: 'Pamayanan',
    definition: 'A group of people living together in the same neighborhood or town.',
    example_sentence: 'Our community works together to keep our park clean.',
    syllables: ['com', 'mu', 'ni', 'ty'],
    difficulty: 'medium',
  },
  {
    language: 'en',
    word: 'Courageous',
    translation: 'Matapang',
    definition: 'Brave and willing to face danger or difficulty without giving up.',
    example_sentence: 'The courageous doctor helped patients during the storm.',
    syllables: ['cou', 'ra', 'geous'],
    difficulty: 'medium',
  },
  {
    language: 'en',
    word: 'Friendship',
    translation: 'Pagkakaibigan',
    definition: 'A caring and loyal bond between people who trust one another.',
    example_sentence: 'True friendship lasts even when you are far apart.',
    syllables: ['friend', 'ship'],
    difficulty: 'medium',
  },
  {
    language: 'en',
    word: 'Volcano',
    translation: 'Bulkan',
    definition: 'A mountain with an opening that can erupt with hot lava and ash.',
    example_sentence: 'Mayon Volcano is famous for its almost perfect cone shape.',
    syllables: ['vol', 'ca', 'no'],
    difficulty: 'medium',
  },
  {
    language: 'en',
    word: 'Celebrate',
    translation: 'Ipagdiwang',
    definition: 'To observe a joyful occasion with festivities, food, and smiles.',
    example_sentence: 'We celebrate our school anniversary with songs and dances.',
    syllables: ['cel', 'e', 'brate'],
    difficulty: 'medium',
  },
  {
    language: 'en',
    word: 'Compassion',
    translation: 'Habag',
    definition: 'Deep sympathy and a desire to help someone who is suffering.',
    example_sentence: 'She showed great compassion by feeding hungry stray animals.',
    syllables: ['com', 'pas', 'sion'],
    difficulty: 'medium',
  },
  {
    language: 'en',
    word: 'Nutrition',
    translation: 'Nutrisyon',
    definition: 'The process of taking in good food necessary for health and growth.',
    example_sentence: 'Fruits and vegetables provide excellent nutrition for children.',
    syllables: ['nu', 'tri', 'tion'],
    difficulty: 'medium',
  },
  {
    language: 'en',
    word: 'Earthquake',
    translation: 'Lindol',
    definition: 'A sudden vibration or shaking of the earth\'s crust.',
    example_sentence: 'Remember the duck, cover, and hold rule during an earthquake.',
    syllables: ['earth', 'quake'],
    difficulty: 'medium',
  },
  {
    language: 'en',
    word: 'Summarize',
    translation: 'Ibuod',
    definition: 'To state briefly the main points or summary of a longer story.',
    example_sentence: 'The student was able to summarize the whole chapter in three sentences.',
    syllables: ['sum', 'ma', 'rize'],
    difficulty: 'medium',
  },
  {
    language: 'en',
    word: 'Discovery',
    translation: 'Pagtuklas',
    definition: 'Finding or learning about something previously unknown.',
    example_sentence: 'The discovery of electricity transformed human history.',
    syllables: ['dis', 'cov', 'er', 'y'],
    difficulty: 'medium',
  },
  {
    language: 'en',
    word: 'Environment',
    translation: 'Kapaligiran',
    definition: 'The natural world including the air, water, land, plants, and animals.',
    example_sentence: 'Planting trees helps protect our environment from pollution.',
    syllables: ['en', 'vi', 'ron', 'ment'],
    difficulty: 'medium',
  },
  {
    language: 'en',
    word: 'Imagination',
    translation: 'Imahinasyon',
    definition: 'The creative ability to form mental pictures and new ideas.',
    example_sentence: 'Reading fantasy books sparks the imagination of young learners.',
    syllables: ['i', 'mag', 'i', 'na', 'tion'],
    difficulty: 'medium',
  },
  {
    language: 'en',
    word: 'Technology',
    translation: 'Teknolohiya',
    definition: 'The practical use of scientific knowledge to create useful tools and machines.',
    example_sentence: 'Modern technology helps students learn lessons anywhere.',
    syllables: ['tech', 'nol', 'o', 'gy'],
    difficulty: 'medium',
  },

  // ===========================================================================
  // 6. ENGLISH WORDS — HARD (Grade 5 - 6: Advanced Vocabulary & Concepts)
  // ===========================================================================
  {
    language: 'en',
    word: 'Responsible',
    translation: 'Responsable',
    definition: 'Having an obligation to do something, or having control over someone.',
    example_sentence: 'A responsible pupil takes care of his classroom materials.',
    syllables: ['re', 'spon', 'si', 'ble'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Electricity',
    translation: 'Kuryente',
    definition: 'A fundamental form of energy used to power lights and machinery.',
    example_sentence: 'Solar panels generate clean electricity from the sun.',
    syllables: ['e', 'lec', 'tri', 'ci', 'ty'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Pollution',
    translation: 'Polusyon',
    definition: 'The presence of harmful or poisonous substances in the environment.',
    example_sentence: 'Reducing plastic waste helps decrease ocean pollution.',
    syllables: ['pol', 'lu', 'tion'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Perseverance',
    translation: 'Tiyaga',
    definition: 'Steadfast persistence in doing something despite difficulty or delay.',
    example_sentence: 'Through perseverance, the young athlete won the gold medal.',
    syllables: ['per', 'se', 'ver', 'ance'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Patriotism',
    translation: 'Makabayan',
    definition: 'Devotion to and vigorous support for one\'s country.',
    example_sentence: 'Standing with honor during the national anthem is a sign of patriotism.',
    syllables: ['pa', 'tri', 'ot', 'ism'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Photosynthesis',
    translation: 'Potosintesis',
    definition: 'The biological process by which green plants make food using sunlight.',
    example_sentence: 'Chlorophyll in leaves is essential for photosynthesis to take place.',
    syllables: ['pho', 'to', 'syn', 'the', 'sis'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Cooperation',
    translation: 'Kooperasyon',
    definition: 'The act of working together for a common purpose or mutual benefit.',
    example_sentence: 'Great teamwork requires patience and active cooperation.',
    syllables: ['co', 'op', 'er', 'a', 'tion'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Archipelago',
    translation: 'Kapuluan',
    definition: 'A sea or stretch of water containing numerous islands.',
    example_sentence: 'The Philippines is an archipelago composed of more than seven thousand islands.',
    syllables: ['ar', 'chi', 'pel', 'a', 'go'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Investigate',
    translation: 'Imbestigahan',
    definition: 'To carry out a systematic or formal inquiry to discover and examine facts.',
    example_sentence: 'The young scientists investigate how different soils affect plant growth.',
    syllables: ['in', 'ves', 'ti', 'gate'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Communicate',
    translation: 'Makipag-usap',
    definition: 'To share or exchange information, news, or ideas clearly.',
    example_sentence: 'Learning new languages allows people to communicate across borders.',
    syllables: ['com', 'mu', 'ni', 'cate'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Responsibility',
    translation: 'Responsibilidad',
    definition: 'The state or fact of having a duty to deal with something or of having control.',
    example_sentence: 'Taking care of household pets is an important family responsibility.',
    syllables: ['re', 'spon', 'si', 'bil', 'i', 'ty'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Atmosphere',
    translation: 'Atmospera',
    definition: 'The envelope of gases surrounding the earth or another planet.',
    example_sentence: 'The ozone layer within the atmosphere shields life from ultraviolet radiation.',
    syllables: ['at', 'mos', 'phere'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Biodiversity',
    translation: 'Biodibersidad',
    definition: 'The variety of plant and animal life in the world or in a particular habitat.',
    example_sentence: 'Tropical rainforests contain the richest biodiversity on Earth.',
    syllables: ['bi', 'o', 'di', 'ver', 'si', 'ty'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Independence',
    translation: 'Kasarinlan',
    definition: 'The fact or state of being independent, free from foreign rule.',
    example_sentence: 'The Declaration of Independence was a pivotal moment in Philippine history.',
    syllables: ['in', 'de', 'pen', 'dence'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Transparent',
    translation: 'Naaaninag',
    definition: 'Allowing light to pass through so that objects behind can be distinctly seen.',
    example_sentence: 'Clean glass and clear spring water are completely transparent.',
    syllables: ['trans', 'par', 'ent'],
    difficulty: 'hard',
  },
  {
    language: 'en',
    word: 'Evaporation',
    translation: 'Evaporasyon',
    definition: 'The physical process of turning from liquid into vapor upon heating.',
    example_sentence: 'Water evaporation is a vital part of the continuous rain cycle.',
    syllables: ['e', 'vap', 'o', 'ra', 'tion'],
    difficulty: 'hard',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO GENERATION HELPER
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN UNIFIED SEED RUNNER
// ─────────────────────────────────────────────────────────────────────────────
async function seedVocabularyBank() {
  const client = await pool.connect();

  try {
    console.log('\n🎙️ SalinTinig Unified Vocabulary Bank Seed\n');
    console.log('Mode:', SKIP_AUDIO ? 'Fast Seed (--skip-audio)' : 'Full Seed (with Edge-TTS & Cloudinary Audio)');

    if (CLEAR_FIRST) {
      console.log('⚠️ Clearing existing vocabulary_bank records (--clear flag detected)...');
      await client.query('DELETE FROM vocabulary_bank');
      console.log('Cleared existing vocabulary_bank.\n');
    }

    let inserted = 0;
    let updated = 0;
    let preserved = 0;

    for (const item of vocabularyBankData) {
      // Check if word already exists in this exact language
      const existingRes = await client.query(
        `SELECT item_id, audio_url, syllable_audio_urls, difficulty, translation 
         FROM vocabulary_bank 
         WHERE LOWER(word) = LOWER($1) AND language = $2 
         LIMIT 1`,
        [item.word, item.language]
      );

      if (existingRes.rows && existingRes.rows.length > 0) {
        const existingRow = existingRes.rows[0];

        // Safely update attributes to align difficulty and translation without breaking audio or IDs
        await client.query(
          `UPDATE vocabulary_bank 
           SET translation = $1,
               definition = $2,
               example_sentence = $3,
               syllables = $4,
               difficulty = $5,
               content_status = 'validated',
               is_active = true,
               updated_at = NOW()
           WHERE item_id = $6`,
          [
            item.translation,
            item.definition,
            item.example_sentence,
            JSON.stringify(item.syllables),
            item.difficulty,
            existingRow.item_id,
          ]
        );

        updated++;
        continue;
      }

      // New word: generate audio if requested
      let audioUrl = null;
      let syllableAudioList = [];

      if (!SKIP_AUDIO) {
        audioUrl = await generateAudioForWord(item.word, item.language);

        // Deduplicate syllable audio across the same language group
        const { synthesizeTextToAudio } = require('../src/services/ttsService.js');
        const langKey = (item.language === 'en' || item.language === 'eng') ? 'en' : 'fil';
        const langFolder = langKey === 'en' ? 'salintinig/pronunciation/syllables/eng' : 'salintinig/pronunciation/syllables/fil';

        for (const syl of item.syllables) {
          try {
            const existingSyl = await client.query(
              `SELECT elem->>'audioUrl' as audio_url
               FROM vocabulary_bank,
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
            }
            syllableAudioList.push({ syllable: syl, audioUrl: sylUrl });
          } catch (_) {
            syllableAudioList.push({ syllable: syl, audioUrl: null });
          }
        }
      }

      await client.query(
        `INSERT INTO vocabulary_bank
          (language, word, translation, definition, example_sentence, syllables, audio_url, syllable_audio_urls, difficulty, source, content_status, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'educational_material', 'validated', true)`,
        [
          item.language,
          item.word,
          item.translation,
          item.definition,
          item.example_sentence,
          JSON.stringify(item.syllables),
          audioUrl,
          JSON.stringify(syllableAudioList),
          item.difficulty,
        ]
      );

      inserted++;
      console.log(`  + Inserted [${item.language.toUpperCase()} - ${item.difficulty.toUpperCase()}]: ${item.word} <-> ${item.translation}`);
    }

    console.log('\n-------------------------------------------');
    console.log(`✅ Finished seeding vocabulary_bank:`);
    console.log(`   New words inserted: ${inserted}`);
    console.log(`   Existing words synced/updated: ${updated}`);

    // Summary table of the whole unified database
    const { rows: totals } = await client.query(
      `SELECT language, difficulty, COUNT(*) AS count 
       FROM vocabulary_bank 
       WHERE is_active = true 
       GROUP BY language, difficulty 
       ORDER BY language, difficulty`
    );

    console.log('\n📊 Unified Vocabulary Bank Word Distribution:');
    console.table(totals);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedVocabularyBank();
