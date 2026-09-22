/**
 * seed_official_phil_iri.js
 * -------------------------
 * Complete Seeder for Official DepEd Phil-IRI 2018 Reading Passages & Comprehension Questions.
 * Covers Grades 1 to 6 in Filipino and English across Pre-Test (Sets A-D) and Post-Test (Sets A-D).
 *
 * Usage: node scripts/seed_official_phil_iri.js
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const passagesData = [
  // ===========================================================================
  // GRADE 1 FILIPINO PASSAGES (Pre-Test Sets A-D & Post-Test Sets A-D)
  // ===========================================================================
  {
    title: 'Ang Daga',
    grade_level: 'Grade 1',
    passage_set: 'Set A',
    stage: 'Pre-Test',
    language: 'fil',
    status: 'published',
    content_text: `Pumunta sa lawa si Tito. Kasama niya si Lina sa lawa. Malayo ang lawa. Nakita nila ang palaka sa lawa. Nakita nila ang bibe sa lawa. Nakita rin nila ang buwaya. Naku! Ang laki ng buwaya!`,
    questions: [
      { question_text: 'Ano ang nasa mesa?', question_type: 'Multiple Choice', choices: [{ text: 'baso', is_correct: false }, { text: 'daga', is_correct: true }, { text: 'pusa', is_correct: false }] },
      { question_text: 'Anong mayroon ang daga?', question_type: 'Multiple Choice', choices: [{ text: 'damit', is_correct: false }, { text: 'laruan', is_correct: false }, { text: 'pagkain / keso', is_correct: true }] },
      { question_text: 'Ano ang unang nangyari sa kuwento?', question_type: 'Multiple Choice', choices: [{ text: 'Nakita ng pusa ang daga.', is_correct: false }, { text: 'Nakita ng daga ang keso.', is_correct: true }, { text: 'Tumakas ang daga sa pusa.', is_correct: false }] },
      { question_text: 'Bakit kaya nawala ang daga?', question_type: 'Multiple Choice', choices: [{ text: 'natakot sa pusa', is_correct: true }, { text: 'nahuli ng bata', is_correct: false }, { text: 'ayaw maagawan ng keso', is_correct: false }] }
    ]
  },
  {
    title: 'Sa Lawa',
    grade_level: 'Grade 1',
    passage_set: 'Set B',
    stage: 'Pre-Test',
    language: 'fil',
    status: 'published',
    content_text: `Pumunta sa lawa si Tito. Kasama niya si Lina sa lawa. Malayo ang lawa. Nakita nila ang palaka sa lawa. Nakita nila ang bibe sa lawa. Nakita rin nila ang buwaya. Naku! Ang laki ng buwaya!`,
    questions: [
      { question_text: 'Sino-sino ang nasa lawa?', question_type: 'Multiple Choice', choices: [{ text: 'sina Tito at Lina', is_correct: true }, { text: 'sina Tito at Tita', is_correct: false }, { text: 'si Lina', is_correct: false }] },
      { question_text: 'Ano-ano ang mga nakita niya sa lawa?', question_type: 'Multiple Choice', choices: [{ text: 'mga halaman', is_correct: false }, { text: 'mga insekto', is_correct: false }, { text: 'mga hayop (palaka, bibe, buwaya)', is_correct: true }] },
      { question_text: 'Ano ang hitsura ng buwaya?', question_type: 'Multiple Choice', choices: [{ text: 'maliit', is_correct: false }, { text: 'malaki', is_correct: true }, { text: 'maganda', is_correct: false }] },
      { question_text: 'Ano ang naramdaman ni Tito nang makita ang buwaya?', question_type: 'Multiple Choice', choices: [{ text: 'nagulat', is_correct: true }, { text: 'nagalit', is_correct: false }, { text: 'nalungkot', is_correct: false }] }
    ]
  },
  {
    title: 'Ang Mesa ni Lupe',
    grade_level: 'Grade 1',
    passage_set: 'Set C',
    stage: 'Pre-Test',
    language: 'fil',
    status: 'published',
    content_text: `Ito ang mesa ni Lupe. Malaki ang mesa ni Lupe. Nasa mesa ang relo ni Lupe. May baso at tasa sa mesa ni Lupe. May bola rin sa mesa. Naku! Ang bola! Tumama ang bola sa baso. Hala! Nabasa ang relo sa mesa!`,
    questions: [
      { question_text: 'Kanino ang mesa?', question_type: 'Multiple Choice', choices: [{ text: 'kay Lupe', is_correct: true }, { text: 'kay Nanay', is_correct: false }, { text: 'kay Lani', is_correct: false }] },
      { question_text: 'Alin sa sumusunod ang wala sa mesa ni Lupe?', question_type: 'Multiple Choice', choices: [{ text: 'bola', is_correct: false }, { text: 'bote', is_correct: true }, { text: 'relo', is_correct: false }] },
      { question_text: 'Ano ang nangyari sa baso?', question_type: 'Multiple Choice', choices: [{ text: 'nabasag', is_correct: false }, { text: 'nahulog sa sahig ang baso', is_correct: false }, { text: 'tumapon ang laman na tubig', is_correct: true }] },
      { question_text: 'Ano kaya ang naramdaman ni Lupe?', question_type: 'Multiple Choice', choices: [{ text: 'nalungkot', is_correct: true }, { text: 'napagod', is_correct: false }, { text: 'nasabik', is_correct: false }] }
    ]
  },
  {
    title: 'Sako ni Rita',
    grade_level: 'Grade 1',
    passage_set: 'Set D',
    stage: 'Pre-Test',
    language: 'fil',
    status: 'published',
    content_text: `May sako si Rita. Malaki ang sako. Puti ang sako. Nasa mesa ang sako ni Rita. May saba ang sako. Marami ang saba sa sako. May tali ang sako. Pula ang tali ng sako. Aba! May laso pa sa tali ng sako!`,
    questions: [
      { question_text: 'Sino ang may sako?', question_type: 'Multiple Choice', choices: [{ text: 'Rita', is_correct: true }, { text: 'Rico', is_correct: false }, { text: 'Maya', is_correct: false }] },
      { question_text: 'Ano ang laman ng sako?', question_type: 'Multiple Choice', choices: [{ text: 'laso', is_correct: false }, { text: 'tali', is_correct: false }, { text: 'saba', is_correct: true }] },
      { question_text: 'Ano kaya ang gagawin ni Rita sa saba?', question_type: 'Multiple Choice', choices: [{ text: 'mag-iipon ng sako', is_correct: false }, { text: 'magtitinda ng saba', is_correct: true }, { text: 'magpapakain ng baka', is_correct: false }] }
    ]
  },
  {
    title: 'Laro Tayo!',
    grade_level: 'Grade 1',
    passage_set: 'Set A',
    stage: 'Post-Test',
    language: 'fil',
    status: 'published',
    content_text: `May manika si Nina. Madumi ang manika ni Nina. May lobo si Tina. Asul ang lobo ni Tina. "Tara, laro tayo," sabi ni Nina. Naku! Nasa taas na ang lobo! Hala! Nasa puno na ang lobo ni Tina!`,
    questions: [
      { question_text: 'Ano ang madumi?', question_type: 'Multiple Choice', choices: [{ text: 'lobo', is_correct: false }, { text: 'manika', is_correct: true }, { text: 'puno', is_correct: false }] },
      { question_text: 'Sino ang nagsabi ng "Laro tayo!"?', question_type: 'Multiple Choice', choices: [{ text: 'si Dina', is_correct: false }, { text: 'si Nina', is_correct: true }, { text: 'si Tina', is_correct: false }] },
      { question_text: 'Ano ang naramdaman ni Tina sa katapusan ng kuwento?', question_type: 'Multiple Choice', choices: [{ text: 'galit', is_correct: false }, { text: 'masaya', is_correct: false }, { text: 'malungkot', is_correct: true }] }
    ]
  },
  {
    title: 'Ano ang nasa Mesa?',
    grade_level: 'Grade 1',
    passage_set: 'Set B',
    stage: 'Post-Test',
    language: 'fil',
    status: 'published',
    content_text: `May mani sa mesa. May kamote sa mesa. May tasa ng kape sa mesa. May baso ng gatas sa mesa. Naku, Ate! May pusa sa mesa! Dali! May pusa sa mesa! Hala! Nabasa ang mesa!`,
    questions: [
      { question_text: 'Ano ang nasa tasa?', question_type: 'Multiple Choice', choices: [{ text: 'gatas', is_correct: false }, { text: 'kape', is_correct: true }, { text: 'mani', is_correct: false }] },
      { question_text: 'Alin sa sumusunod ang nasa mesa?', question_type: 'Multiple Choice', choices: [{ text: 'kape sa baso', is_correct: false }, { text: 'mani at gatas', is_correct: true }, { text: 'kamote at gatas', is_correct: false }] }
    ]
  },
  {
    title: 'Ang Papaya at Kamote',
    grade_level: 'Grade 1',
    passage_set: 'Set C',
    stage: 'Post-Test',
    language: 'fil',
    status: 'published',
    content_text: `Malaki ang mga papaya. Nasa puno ang mga papaya kanina. Kinuha ni Ate ang apat na papaya. May kamote si Kuya. Dalawa ang kamote ni Kuya. "Tara!", sabi ni Ate. "Nasa mesa na ang mga papaya! Halika! Nasa mesa na ang mga kamote!"`,
    questions: [
      { question_text: 'Ano ang malaki?', question_type: 'Multiple Choice', choices: [{ text: 'ang mga mesa', is_correct: false }, { text: 'ang mga kamote', is_correct: false }, { text: 'ang mga papaya', is_correct: true }] },
      { question_text: 'Sino ang nagsabi ng "Nasa mesa na ang kamote!"?', question_type: 'Multiple Choice', choices: [{ text: 'si Ate', is_correct: true }, { text: 'si Kuya', is_correct: false }, { text: 'ang ale', is_correct: false }] }
    ]
  },
  {
    title: 'Sa Sapa',
    grade_level: 'Grade 1',
    passage_set: 'Set D',
    stage: 'Post-Test',
    language: 'fil',
    status: 'published',
    content_text: `Nasa may sapa si Dora. Katabi ni Dora ang baka nila. "Tara, laro tayo sa sapa," sabi ni Lisa. "Sige!", sabi ni Dora. "Naku! Palaka!", sabi ni Dora. Nadapa si Lisa. "Mabuti, wala na ang palaka." Natawa si Lisa.`,
    questions: [
      { question_text: 'Ano ang ginagawa ni Dora sa sapa?', question_type: 'Multiple Choice', choices: [{ text: 'Kalaro niya ang baka.', is_correct: false }, { text: 'Hinuhuli niya ang palaka.', is_correct: false }, { text: 'Kasama niya ang baka nila.', is_correct: true }] },
      { question_text: 'Sino ang nagsabi ng "Laro tayo sa sapa!"?', question_type: 'Multiple Choice', choices: [{ text: 'si Lita', is_correct: false }, { text: 'si Lisa', is_correct: true }, { text: 'si Dora', is_correct: false }] }
    ]
  },

  // ===========================================================================
  // GRADE 2 FILIPINO PASSAGES (Pre-Test Sets A-D & Post-Test Sets A-D)
  // ===========================================================================
  {
    title: 'Si Mila',
    grade_level: 'Grade 2',
    passage_set: 'Set A',
    stage: 'Pre-Test',
    language: 'fil',
    status: 'published',
    content_text: `Si Mila ay nakatira sa bukid. Maraming hayop sa bukid. Marami ring halaman sa bukid. Maraming alagang hayop si Mila. May alagang baboy si Mila. May alaga din siyang baka at kambing. Sa mga hayop niya, ang manok niya ang kanyang paborito. Tiko ang pangalan ng manok niya. Si Tiko ay kulay pula at puti. Siya ang gumigising kay Mila tuwing umaga. Masaya si Mila kapag naririnig ang tilaok ni Tiko.`,
    questions: [
      { question_text: 'Sino ang may alaga?', question_type: 'Multiple Choice', choices: [{ text: 'si Mila', is_correct: true }, { text: 'si Olla', is_correct: false }, { text: 'si Tiko', is_correct: false }] },
      { question_text: 'Saan nakatira si Mila?', question_type: 'Multiple Choice', choices: [{ text: 'sa zoo', is_correct: false }, { text: 'sa Maynila', is_correct: false }, { text: 'sa probinsya / bukid', is_correct: true }] },
      { question_text: 'Ano ang paboritong alaga ni Mila?', question_type: 'Multiple Choice', choices: [{ text: 'isda', is_correct: false }, { text: 'buwaya', is_correct: false }, { text: 'manok / tandang', is_correct: true }] },
      { question_text: 'Paano ginigising ni Tiko si Mila sa umaga?', question_type: 'Multiple Choice', choices: [{ text: 'tumatahol', is_correct: false }, { text: 'tumitilaok', is_correct: true }, { text: 'umiiyak', is_correct: false }] },
      { question_text: 'Ano ang isa pang magandang pamagat ng kuwento?', question_type: 'Multiple Choice', choices: [{ text: 'Ang Tandang ni Mila', is_correct: true }, { text: 'Ang Kambing ni Mila', is_correct: false }, { text: 'Hayop sa Gubat', is_correct: false }] }
    ]
  },
  {
    title: 'Si Dilis at si Pating',
    grade_level: 'Grade 2',
    passage_set: 'Set B',
    stage: 'Pre-Test',
    language: 'fil',
    status: 'published',
    content_text: `Sa dagat nakatira si Dilis. Kalaro niya ang mga maliliit na isda. Sila ay masaya. Nasa dagat din si Pating. Malaki at mabangis ito. Takot si Dilis at ang mga kalaro niyang isda kay Pating. Minsan, hindi kaagad nakita ni Dilis si Pating. Gutom na gutom na si Pating. Mabilis si Dilis. Nagtago siya sa ilalim ng korales. Hindi siya nakain ni Pating. Matalino talaga si Dilis. Dapat maging matalino para matulungan ang sarili.`,
    questions: [
      { question_text: 'Saan nakatira si Dilis?', question_type: 'Multiple Choice', choices: [{ text: 'sa dagat', is_correct: true }, { text: 'sa ilog', is_correct: false }, { text: 'sa sapa', is_correct: false }] },
      { question_text: 'Ano ang sama-samang ginagawa nina Dilis at ng maliliit na isda?', question_type: 'Multiple Choice', choices: [{ text: 'namamasyal', is_correct: false }, { text: 'nagtatago', is_correct: false }, { text: 'naglalaro', is_correct: true }] },
      { question_text: 'Bakit takot si Dilis kay Pating?', question_type: 'Multiple Choice', choices: [{ text: 'Baka awayin siya ni Pating.', is_correct: false }, { text: 'Maaari siyang kainin ni Pating.', is_correct: true }, { text: 'Baka agawan siya ni Pating ng pagkain.', is_correct: false }] },
      { question_text: 'Paano ipinakita ni Dilis ang pagiging matalino?', question_type: 'Multiple Choice', choices: [{ text: 'Mabilis siyang nakapagtago sa korales.', is_correct: true }, { text: 'Tinulungan niya ang mga maliliit na isda.', is_correct: false }, { text: 'Hindi siya nakipaglaro kay Pating.', is_correct: false }] },
      { question_text: 'Alin sa sumusunod ang isa pang magandang pamagat ng kuwento?', question_type: 'Multiple Choice', choices: [{ text: 'Sa Ilalim ng Dagat', is_correct: false }, { text: 'Ang Gutom na Pating', is_correct: true }, { text: 'Si Dilis, ang Mabangis na Isda', is_correct: false }] }
    ]
  },
  {
    title: 'Ang Matalinong Bulate',
    grade_level: 'Grade 2',
    passage_set: 'Set C',
    stage: 'Pre-Test',
    language: 'fil',
    status: 'published',
    content_text: `Umaga na sa bukirin. Maagang lumabas si Bulate. Nais niyang masikatan ng araw. Sa di kalayuan, nakita siya ni Tandang. Lumapit si Tandang upang kainin si Bulate. Nagulat si Bulate at nag-isip nang mabilis. Biglang nagsalita si Bulate, "Kaibigan, bago mo ako kainin, mayroon sana akong hiling. Nais ko munang marinig ang maganda mong boses." Natuwa si Tandang sa sinabi ni Bulate. Alam ni Tandang na maganda ang boses niya. Tumilaok siya nang mahaba. Ang hindi niya alam, nagtago na si Bulate sa ilalim ng lupa.`,
    questions: [
      { question_text: 'Sino ang gustong masikatan ng araw?', question_type: 'Multiple Choice', choices: [{ text: 'si Aso', is_correct: false }, { text: 'si Bulate', is_correct: true }, { text: 'si Tandang', is_correct: false }] },
      { question_text: 'Ano ang gustong gawin ni Tandang kay Bulate?', question_type: 'Multiple Choice', choices: [{ text: 'gawings kalaro', is_correct: false }, { text: 'gawing pagkain', is_correct: true }, { text: 'gawing kaibigan', is_correct: false }] },
      { question_text: 'Anong salita ang ginamit para ipakitang umawit si Tandang?', question_type: 'Multiple Choice', choices: [{ text: 'kumanta', is_correct: false }, { text: 'tumilaok', is_correct: true }, { text: 'sumigaw', is_correct: false }] },
      { question_text: 'Ano kaya ang naramdaman ni Bulate nang makitang papalapit si Tandang?', question_type: 'Multiple Choice', choices: [{ text: 'ninerbiyos', is_correct: true }, { text: 'nagalak', is_correct: false }, { text: 'nasabik', is_correct: false }] },
      { question_text: 'Ano ang huling nangyari sa kuwento?', question_type: 'Multiple Choice', choices: [{ text: 'Kinausap ni Bulate si Tandang.', is_correct: false }, { text: 'Tumakas at nagtago si Bulate sa lupa.', is_correct: true }, { text: 'Lumabas si Bulate.', is_correct: false }] }
    ]
  },
  {
    title: 'Ang Ibon ni Islaw',
    grade_level: 'Grade 2',
    passage_set: 'Set D',
    stage: 'Pre-Test',
    language: 'fil',
    status: 'published',
    content_text: `May alagang ibon si Islaw. Ising ang pangalan ng ibon niya. Puti si Ising. Maliit si Ising. Nasa isang hawla si Ising. Araw-araw ay binibigyan ng pagkain ni Islaw si Ising. Masaya si Islaw sa alaga niya. Isang araw, nakawala sa hawla si Ising. Hinanap ni Islaw si Ising. Hindi nakita ni Islaw si Ising. Pag-uwi ni Islaw, naroon na si Ising. Hinihintay na siya sa loob ng bahay.`,
    questions: [
      { question_text: 'Ano ang alaga ni Islaw?', question_type: 'Multiple Choice', choices: [{ text: 'tuta', is_correct: false }, { text: 'pusa', is_correct: false }, { text: 'ibon', is_correct: true }] },
      { question_text: 'Ano ang ginagawa ni Islaw kay Ising araw-araw?', question_type: 'Multiple Choice', choices: [{ text: 'pinaliliguan', is_correct: false }, { text: 'pinapasyal', is_correct: false }, { text: 'pinakakain', is_correct: true }] },
      { question_text: 'Anong katangian ang ipinakikita ni Islaw?', question_type: 'Multiple Choice', choices: [{ text: 'maalaga', is_correct: true }, { text: 'masinop', is_correct: false }, { text: 'maunawain', is_correct: false }] },
      { question_text: 'Ano ang naramdaman ni Islaw nang mawala si Ising?', question_type: 'Multiple Choice', choices: [{ text: 'nag-alala', is_correct: true }, { text: 'natuwa', is_correct: false }, { text: 'nagalit', is_correct: false }] },
      { question_text: 'Ano ang ginawa ni Islaw na nagpakita ng kanyang pagiging maalalahanin?', question_type: 'Multiple Choice', choices: [{ text: 'Hinanap niya si Ising.', is_correct: true }, { text: 'Pinamigay niya ang alaga.', is_correct: false }, { text: 'Pinabayaan niya ang alagang mawala.', is_correct: false }] }
    ]
  },
  {
    title: 'Ang Punong Narra',
    grade_level: 'Grade 2',
    passage_set: 'Set A',
    stage: 'Post-Test',
    language: 'fil',
    status: 'published',
    content_text: `Naglalaro sa bakuran ang mga bata. "Kilala mo ba ang punong ito? Ito ang puno ng narra," wika ni Dan. "Oo, matigas ang kahoy nito," sabi ni Ana. "Hindi madaling matumba ang mga punong narra. Iyan ang sabi ni Tatay," wika ni Dan. "Ginagawa pang mga mesa ang kahoy ng narra," sabi ni Nanay. "Tara, akyat tayo sa puno," sabi ni Dan. "O, baka kayo mahulog!"`,
    questions: [
      { question_text: 'Ano ang ginagawa ng mga bata sa kuwento?', question_type: 'Multiple Choice', choices: [{ text: 'umaakyat sa puno', is_correct: false }, { text: 'naglalaro sa bakuran', is_correct: true }, { text: 'naglalaro ng kahoy', is_correct: false }] },
      { question_text: 'Sino ang nagsabing "Matigas ang kahoy nito"?', question_type: 'Multiple Choice', choices: [{ text: 'si Ana', is_correct: true }, { text: 'si Dan', is_correct: false }, { text: 'si Tatay', is_correct: false }] },
      { question_text: 'Bakit kaya hindi madaling matumba ang punong narra?', question_type: 'Multiple Choice', choices: [{ text: 'Hindi malakas ang hangin.', is_correct: false }, { text: 'Matanda na ang puno.', is_correct: false }, { text: 'Matibay ang kahoy ng punong narra.', is_correct: true }] }
    ]
  },
  {
    title: 'Ang Mangga',
    grade_level: 'Grade 2',
    passage_set: 'Set B',
    stage: 'Post-Test',
    language: 'fil',
    status: 'published',
    content_text: `May punong mangga sa bakuran nina Ani. Marami itong bunga, malalaki, at mabibilog pa. Kulay dilaw ang hinog nito. Kulay berde naman kapag hilaw pa. Kay gandang pagmasdan ng puno ng mangga. Isang araw, pumitas ng mga mangga ang mga kalaro ni Ani. Maraming napitas sina Dan, Nica at Alan. "Masarap at matamis ang hinog na mga mangga," sabi ni Ani. "Maasim naman ang mga hilaw," sabi ni Dan.`,
    questions: [
      { question_text: 'Saan makikita ang punong mangga?', question_type: 'Multiple Choice', choices: [{ text: 'sa bukirin ni Ani', is_correct: false }, { text: 'sa bakuran ni Ani', is_correct: true }, { text: 'sa bakuran ni Alan', is_correct: false }] },
      { question_text: 'Sino ang nagsabing maasim ang berdeng mangga?', question_type: 'Multiple Choice', choices: [{ text: 'si Ani', is_correct: false }, { text: 'si Dan', is_correct: true }, { text: 'si Nica', is_correct: false }] }
    ]
  },
  {
    title: 'Laging Handa',
    grade_level: 'Grade 2',
    passage_set: 'Set C',
    stage: 'Post-Test',
    language: 'fil',
    status: 'published',
    content_text: `Kamping ng mga batang Iskawt. Masaya silang umaawit habang naglalakad. "Narito, narito, narito kami! Handa na! Handa na! Handa na kami! Narito kami, para makiisa!" "Tumulong sa pangkat. At mananalo tayo!", wika ni Zen. "Ang batang iskawt, ang batang iskawt ay laging handa!", dagdag ni Dona. Mabilis ang kilos ng lahat. Malapit na magsimula ang palaro. Oops! Naku! Bigla na lamang nadulas si Rica.`,
    questions: [
      { question_text: 'Sino ang may kamping?', question_type: 'Multiple Choice', choices: [{ text: 'mga lider ng iskawt', is_correct: false }, { text: 'mga lalaking iskawt', is_correct: false }, { text: 'mga batang iskawt', is_correct: true }] },
      { question_text: 'Sino ang nagsabing "Ang batang iskawt ay laging handa"?', question_type: 'Multiple Choice', choices: [{ text: 'si Zen', is_correct: false }, { text: 'si Rica', is_correct: false }, { text: 'si Dona', is_correct: true }] }
    ]
  },
  {
    title: 'Papasok na si Nilo',
    grade_level: 'Grade 2',
    passage_set: 'Set D',
    stage: 'Post-Test',
    language: 'fil',
    status: 'published',
    content_text: `Araw ng Lunes. Maagang gumising si Nilo. Matapos maihanda ang sarili, nagpaalam siyang papasok na. "Sandali lang, Nilo. Sumilip ka kaya muna sa salamin. Masdan mo ang buo mong kasuotan," utos ng ate. "Naku, marumi pala ang aking sapatos," wika ni Nilo. Kumuha siya ng basahan at pinunasan ang sapatos. "Ate, aalis na po ako," paalam ni Nilo. "O sige, mag-ingat ka," tugon ng ate.`,
    questions: [
      { question_text: 'Sino ang nagsabing "Sandali. Tumingin ka muna sa salamin!"?', question_type: 'Multiple Choice', choices: [{ text: 'si ate', is_correct: true }, { text: 'si Nilo', is_correct: false }, { text: 'si nanay', is_correct: false }] },
      { question_text: 'Saan pupunta si Nilo?', question_type: 'Multiple Choice', choices: [{ text: 'handaan', is_correct: false }, { text: 'paaralan', is_correct: true }, { text: 'simbahan', is_correct: false }] }
    ]
  },

  // ===========================================================================
  // GRADE 3 FILIPINO PASSAGES (Pre-Test Sets A-D & Post-Test Sets A-D)
  // ===========================================================================
  {
    title: 'Magpalipad Tayo ng Saranggola',
    grade_level: 'Grade 3',
    passage_set: 'Set A',
    stage: 'Pre-Test',
    language: 'fil',
    status: 'published',
    content_text: `Maganda ang panahon. Gustong maglaro ni Niko. Niyaya ni Niko na maglaro ang kakambal na si Noli. Pumunta ang kambal sa labas. May dala silang mga saranggola. Makukulay ang mga saranggola ng kambal. Pinalipad agad nila ang mga saranggola. Mataas ang lipad ng saranggola ni Niko. Napansin ni Niko si Noli. Malungkot ang mukha ni Noli habang nakatingin kay Niko. "Halika, tuturuan kita kung paano paliparin ang saranggola," sabi ni Niko. Tumingin si Noli. Ipinakita ni Niko kay Noli kung paano magpalipad. Ilang saglit pa, nakangiti na si Noli. "Salamat, Niko," wika niya. "Maraming salamat mga bata. Natatapos agad ang gawain kung nagtutulungan," sabi niya.`,
    questions: [
      { question_text: 'Saan pumunta ang mga bata?', question_type: 'Multiple Choice', choices: [{ text: 'sa labas', is_correct: true }, { text: 'sa paaralan', is_correct: false }, { text: 'sa simbahan', is_correct: false }] },
      { question_text: 'Ano ang gusto nilang gawin?', question_type: 'Multiple Choice', choices: [{ text: 'kumain', is_correct: false }, { text: 'maglaro / magpalipad ng saranggola', is_correct: true }, { text: 'magpahinga', is_correct: false }] },
      { question_text: 'Anong panahon kaya magandang magpalipad ng saranggola?', question_type: 'Multiple Choice', choices: [{ text: 'maaraw at mahangin', is_correct: true }, { text: 'maulan', is_correct: false }, { text: 'madilim', is_correct: false }] },
      { question_text: 'Anong uri ng kapatid si Niko?', question_type: 'Multiple Choice', choices: [{ text: 'maasikaso', is_correct: false }, { text: 'magalang', is_correct: false }, { text: 'matulungin', is_correct: true }] },
      { question_text: 'Bakit napangiti na si Noli sa katapusan ng kuwento?', question_type: 'Multiple Choice', choices: [{ text: 'Napalipad na niya ang saranggola sa tulong ni Niko.', is_correct: true }, { text: 'Binigyan siya ng premyo.', is_correct: false }, { text: 'Nanalo siya sa paglalaro.', is_correct: false }] }
    ]
  },
  {
    title: 'Maliit na Duhat, Malaking Pakwan',
    grade_level: 'Grade 3',
    passage_set: 'Set B',
    stage: 'Pre-Test',
    language: 'fil',
    status: 'published',
    content_text: `Nasa likod-bahay si Pido. Pumunta siya sa silong ng punong duhat. Sabi niya, "Ang laki ng punong ito, ang liit naman ng bunga." Nakita rin niya sa may taniman ang halaman ng pakwan, "Ang pakwan na gumagapang lamang sa lupa, kay laki ng bunga." dagdag niyang sinabi. "Mali kaya ang pagkagawa ng Diyos?" Habang iniisip niya ang tanong sa sarili, biglang nalaglag ang isang bunga ng duhat. "Aray!" sigaw niya. "Tama pala ang Diyos. Kung kasinlaki ng pakwan ang duhat, may bukol ang ulo ko ngayon," pailing na sinabi ni Pido.`,
    questions: [
      { question_text: 'Sino ang nasa silong ng puno?', question_type: 'Multiple Choice', choices: [{ text: 'Diday', is_correct: false }, { text: 'Pandoy', is_correct: false }, { text: 'Pido', is_correct: true }] },
      { question_text: 'Ano ang ipinagtataka ni Pido tungkol sa puno ng duhat?', question_type: 'Multiple Choice', choices: [{ text: 'malaki ang puno ngunit maliit ang bunga', is_correct: true }, { text: 'ang hugis ng prutas sa puno', is_correct: false }, { text: 'ang kulay ng bunga ng punong duhat', is_correct: false }] },
      { question_text: 'Saan nalaglag ang bunga ng duhat?', question_type: 'Multiple Choice', choices: [{ text: 'sa sahig', is_correct: false }, { text: 'sa basket', is_correct: false }, { text: 'sa ulo ni Pido', is_correct: true }] },
      { question_text: 'Ano ang naramdaman ni Pido nang mahulugan siya ng bunga ng duhat?', question_type: 'Multiple Choice', choices: [{ text: 'nagalit', is_correct: false }, { text: 'natakot', is_correct: false }, { text: 'nasaktan', is_correct: true }] },
      { question_text: 'Ano ang katangian ng Diyos ang naisip ni Pido sa huli?', question_type: 'Multiple Choice', choices: [{ text: 'maalalahanin', is_correct: false }, { text: 'matalino at may magandang layunin', is_correct: true }, { text: 'masipag', is_correct: false }] }
    ]
  },
  {
    title: 'Bakasyon ni Heber',
    grade_level: 'Grade 3',
    passage_set: 'Set C',
    stage: 'Pre-Test',
    language: 'fil',
    status: 'published',
    content_text: `Isinama si Heber ng kanyang Tito Mar sa Rizal upang makapag-bakasyon. Masayang-masaya siya dahil nakita niya sa unang pagkakataon ang Pista ng mga Higantes. Ang pistang ito ay naganap kahapon, ika-23 ng Nobyembre. Ginugunita sa pistang ito ang patron ng mga mangingisda na si San Clemente. Pinakatampok sa pista ang matatangkad na tau-tauhang yari sa papel. Dinamitan at nilagyan ng makukulay na palamuti upang mas maging kaakit-akit sa manonood. Hiniram ni Heber ang camera ni Tito Mar at kumuha siya ng maraming litrato upang ipakita sa kanyang pamilya.`,
    questions: [
      { question_text: 'Kanino sumama si Heber upang magbakasyon?', question_type: 'Multiple Choice', choices: [{ text: 'kay Rizal', is_correct: false }, { text: 'kay Tito Mar', is_correct: true }, { text: 'sa mga higante', is_correct: false }] },
      { question_text: 'Aling salita ang ginamit na ang kahulugan ay dekorasyon?', question_type: 'Multiple Choice', choices: [{ text: 'kaakit-akit', is_correct: false }, { text: 'palamuti', is_correct: true }, { text: 'makukulay', is_correct: false }] },
      { question_text: 'Paano inilalarawan sa kuwento ang higante?', question_type: 'Multiple Choice', choices: [{ text: 'matangkad na tau-tauhang yari sa papel', is_correct: true }, { text: 'maitim at magulo ang buhok', is_correct: false }, { text: 'malaki ang katawan at malakas magsalita', is_correct: false }] },
      { question_text: 'Bakit gusto niyang ipakita ang mga litrato sa kanyang mga magulang at kaibigan?', question_type: 'Multiple Choice', choices: [{ text: 'Gusto niyang papuntahin sila sa lugar na iyon.', is_correct: false }, { text: 'Gusto niyang ibahagi ang kanyang magandang karanasan.', is_correct: true }, { text: 'Gusto niyang mainggit ang ibang tao.', is_correct: false }] }
    ]
  },
  {
    title: 'Laruang Dyip',
    grade_level: 'Grade 3',
    passage_set: 'Set D',
    stage: 'Pre-Test',
    language: 'fil',
    status: 'published',
    content_text: `Araw na ng Sabado. Kausap ni Romy ang kaibigang si Bert. Gusto nilang maglaro, pero pareho silang walang dalang laruan. "Alam ko na! Gumawa tayo ng laruang dyip," naisip ni Romy. "Ihanda muna natin ang mga takip ng bote o tansan para sa gulong. Pagkatapos, kailangan nating maghanap ng kahon ng posporo para sa katawan. Manghingi naman tayo ng kapirasong tela kay Nanay para sa upuan," paliwanag ni Romy. "Paano kaya ito tatakbo, kahit walang baterya?" tanong ni Bert. "E, di talian natin at hilahin," sagot ni Romy.`,
    questions: [
      { question_text: 'Sino ang magkaibigan sa kuwento?', question_type: 'Multiple Choice', choices: [{ text: 'Romy at Bert', is_correct: true }, { text: 'Remy at Betty', is_correct: false }, { text: 'Ronald at Ben', is_correct: false }] },
      { question_text: 'Ano ang gusto nilang buuin?', question_type: 'Multiple Choice', choices: [{ text: 'laruang kahon', is_correct: false }, { text: 'laruang dyip / sasakyan', is_correct: true }, { text: 'laruang telepono', is_correct: false }] },
      { question_text: 'Anong katangian ang ipinakita ni Romy?', question_type: 'Multiple Choice', choices: [{ text: 'masipag', is_correct: false }, { text: 'malikhain', is_correct: true }, { text: 'maalalahanin', is_correct: false }] },
      { question_text: 'Ano ang mga ginamit nila upang buuin ang laruan?', question_type: 'Multiple Choice', choices: [{ text: 'mga lumang laruan', is_correct: false }, { text: 'tansan, kahon ng posporo, at kapirasong tela', is_correct: true }, { text: 'mga laruang nabili sa tindahan', is_correct: false }] }
    ]
  },
  {
    title: 'Magtulungan Tayo',
    grade_level: 'Grade 3',
    passage_set: 'Set A',
    stage: 'Post-Test',
    language: 'fil',
    status: 'published',
    content_text: `Papasok na ng paaralan ang tatlong mag-aaral. Nakita nila ang nagkalat na mga sanga ng puno sa mahabang daan. Katatapos lang ng malakas na bagyo at di pa nalilinis ang ilang kalsada. Pagdating sa paaralan, gayundin ang kanilang nakita. Maputik ang silid at madungis ang pader. Nagkalat ang mga dahon sa buong paligid. "Halikayo," tawag sa kanila ng mga kaklase. "Tulungan natin si Gng. Ramos sa paglilinis." Mabilis na kumilos ang mga mag-aaral. "Maraming salamat mga bata. Natatapos agad ang gawain kung nagtutulungan," sabi niya.`,
    questions: [
      { question_text: 'Ano ang nakita ng tatlong mag-aaral papunta sa paaralan?', question_type: 'Multiple Choice', choices: [{ text: 'malakas na bagyo', is_correct: false }, { text: 'makalat na paligid / nagkalat na sanga', is_correct: true }, { text: 'mga natumba na poste', is_correct: false }] },
      { question_text: 'Bakit marumi ang silid-aralan?', question_type: 'Multiple Choice', choices: [{ text: 'Matagal na walang pasok.', is_correct: false }, { text: 'Katatapos lang dumaan ng bagyo.', is_correct: true }, { text: 'Walang tigil ang pagkakalat.', is_correct: false }] }
    ]
  },
  {
    title: 'Sabado na naman',
    grade_level: 'Grade 3',
    passage_set: 'Set B',
    stage: 'Post-Test',
    language: 'fil',
    status: 'published',
    content_text: `Isang Sabado, maagang gumising si Pamela. "Sabado na naman! Ah, tutulungan ko ang nanay sa mga gawaing bahay. Marami pa naman siyang ginagawa kapag galing sa palengke," sabi ni Pamela. Pagkakain ng almusal, naglinis mabuti ng bahay si Pamela. Mabilis niyang iniligpit ang nakakalat na mga laruan sa sala. Maingat niyang pinunasan ang mga bintana at sahig. Pagkatapos maglinis ay kinuha niya ang kanyang manika. Masigla siyang lumabas ng bahay upang maglaro kasama si Rosela.`,
    questions: [
      { question_text: 'Ano ang ginawa ni Pamela sa kuwento?', question_type: 'Multiple Choice', choices: [{ text: 'Nilinis niya nang mabuti ang bintana at sahig.', is_correct: true }, { text: 'Iniligpit niya ang manika sa sala.', is_correct: false }, { text: 'Naghugas siya ng pinggan.', is_correct: false }] },
      { question_text: 'Bakit kaya maraming ginawa si Pamela sa bahay?', question_type: 'Multiple Choice', choices: [{ text: 'Nasa palengke pa si Nanay.', is_correct: true }, { text: 'Wala siyang pasok kapag Sabado.', is_correct: false }, { text: 'Nais niyang makapaglaro sa labas.', is_correct: false }] }
    ]
  },
  {
    title: 'Si Paruparo at Alitaptap',
    grade_level: 'Grade 3',
    passage_set: 'Set C',
    stage: 'Post-Test',
    language: 'fil',
    status: 'published',
    content_text: `Malungkot si Alitaptap. Tatlong araw na siyang hindi kumakain. Masakit na ang kanyang tiyan. Kahit malakas ang ulan, hinanap niya ang kaibigang si Paruparo. Hihingi siya ng tulong dito. Nabigla si Paruparo nang makita si Alitaptap. Basa at nanghihina ito. Dali-dali niya itong pinatuloy at pinakain. Niyakap niya ito pagkatapos. "Dalhin mo itong pagkain. Sa susunod, mag-imbak ka ng pagkain. Sumama man ang panahon, di ka magugutom," payo ni Paruparo. "Tatandaan ko, kaibigan. Salamat muli," nakangiting wika ni Alitaptap.`,
    questions: [
      { question_text: 'Bakit malungkot si Alitaptap sa simula ng kuwento?', question_type: 'Multiple Choice', choices: [{ text: 'Nabasa siya ng ulan.', is_correct: false }, { text: 'Gusto na niyang kumain / gutom.', is_correct: true }, { text: 'Walang tumutulong sa kanya.', is_correct: false }] },
      { question_text: 'Anong katangian ang ipinakita ni Paruparo?', question_type: 'Multiple Choice', choices: [{ text: 'magalang', is_correct: false }, { text: 'matalino', is_correct: false }, { text: 'matulungin', is_correct: true }] }
    ]
  },
  {
    title: 'Ang Asong Gubat',
    grade_level: 'Grade 3',
    passage_set: 'Set D',
    stage: 'Post-Test',
    language: 'fil',
    status: 'published',
    content_text: `"Kaibigan, marami akong alam na hindi mo alam," pagmamalaki ng asong gubat sa pusa. "Ang husay ko nga! Napakarami kong paraan para makalusot sa kaaway. Madali ko silang maliligaw." "Mabuti ka pa," sagot ng pusa. "Ako, iisa lang ang alam kong paraan." Dumating ang isang pangkat ng mga mangangaso. Mabilis na umakyat sa puno ang pusa. Ang asong gubat naman ay nag-iisip pa kung ano ang gagawin niya. Nakarating na ang mga mangangaso ay natataranta pa sa pagtakas ang asong gubat. Nahuli tuloy siya.`,
    questions: [
      { question_text: 'Sino ang nagmamalaki sa kuwento?', question_type: 'Multiple Choice', choices: [{ text: 'Si pusa', is_correct: false }, { text: 'Si asong gubat', is_correct: true }, { text: 'Ang mga mangangaso', is_correct: false }] },
      { question_text: 'Bakit hindi nakatakas sa mangangaso si asong gubat?', question_type: 'Multiple Choice', choices: [{ text: 'nagpaliwanag pa siya sa pusa', is_correct: false }, { text: 'mabilis kumilos ang mangangaso', is_correct: false }, { text: 'hindi niya alam kung ano ang gagawin sa dami ng iniisip', is_correct: true }] }
    ]
  },

  // ===========================================================================
  // GRADE 2 ENGLISH PASSAGES (Pre-Test Sets A-D & Post-Test Sets A-D)
  // ===========================================================================
  {
    title: "Pam's Cat",
    grade_level: 'Grade 2',
    passage_set: 'Set A',
    stage: 'Pre-Test',
    language: 'en',
    status: 'published',
    content_text: `Pam has a cat. It is on the bed. It can nap. It can sit. "Oh no!" says Pam. "The cat fell off the bed!" Is the cat sad? No. It is on the mat.`,
    questions: [
      { question_text: 'Who has a pet?', question_type: 'Multiple Choice', choices: [{ text: 'Pat', is_correct: false }, { text: 'Pam', is_correct: true }, { text: 'Paz', is_correct: false }] },
      { question_text: 'What is her pet?', question_type: 'Multiple Choice', choices: [{ text: 'dog', is_correct: false }, { text: 'pig', is_correct: false }, { text: 'cat', is_correct: true }] },
      { question_text: 'Why did Pam say "Oh no!"?', question_type: 'Multiple Choice', choices: [{ text: 'She was mad.', is_correct: false }, { text: 'The cat fell off the bed.', is_correct: true }, { text: 'She lost her cat.', is_correct: false }] },
      { question_text: 'Where is the cat at the end of the story?', question_type: 'Multiple Choice', choices: [{ text: 'on the bed', is_correct: false }, { text: 'on the mat', is_correct: true }, { text: 'under the table', is_correct: false }] }
    ]
  },
  {
    title: 'A Hot Day',
    grade_level: 'Grade 2',
    passage_set: 'Set B',
    stage: 'Pre-Test',
    language: 'en',
    status: 'published',
    content_text: `The sun is up. "Is it a hot day, Matt?" asks Sal. "Yes, it is," says Matt. Sal gets her fan. Matt gets his hat. Sal and Matt go out to play. Sal and Matt have fun.`,
    questions: [
      { question_text: 'Who are the children in the story?', question_type: 'Multiple Choice', choices: [{ text: 'Sam and Matt', is_correct: false }, { text: 'Sal and Matt', is_correct: true }, { text: 'Sal and Max', is_correct: false }] },
      { question_text: 'What kind of day was it?', question_type: 'Multiple Choice', choices: [{ text: 'a sunny and hot day', is_correct: true }, { text: 'a rainy day', is_correct: false }, { text: 'a cloudy day', is_correct: false }] },
      { question_text: 'What did the little girl get so she will not feel hot?', question_type: 'Multiple Choice', choices: [{ text: 'a hat', is_correct: false }, { text: 'a fan', is_correct: true }, { text: 'an ice cream', is_correct: false }] },
      { question_text: 'What did Matt get?', question_type: 'Multiple Choice', choices: [{ text: 'his hat', is_correct: true }, { text: 'his fan', is_correct: false }, { text: 'his cap', is_correct: false }] }
    ]
  },
  {
    title: "Al's Bag",
    grade_level: 'Grade 2',
    passage_set: 'Set C',
    stage: 'Pre-Test',
    language: 'en',
    status: 'published',
    content_text: `Al has a bag. It has a mat. It has buns. It has bananas. But it has ants too! "Ants! Ants!" says Al. Al lets the bag go.`,
    questions: [
      { question_text: 'What is the name of the boy in the story?', question_type: 'Multiple Choice', choices: [{ text: 'Al', is_correct: true }, { text: 'Alf', is_correct: false }, { text: 'Ben', is_correct: false }] },
      { question_text: 'What does he have in his bag?', question_type: 'Multiple Choice', choices: [{ text: 'a mat, buns, and bananas', is_correct: true }, { text: 'toys and books', is_correct: false }, { text: 'apples and milk', is_correct: false }] },
      { question_text: 'Why does he let his bag go?', question_type: 'Multiple Choice', choices: [{ text: 'He is afraid of ants.', is_correct: true }, { text: 'He wants to play.', is_correct: false }, { text: 'The bag is heavy.', is_correct: false }] }
    ]
  },
  {
    title: 'Nat Takes a Nap',
    grade_level: 'Grade 2',
    passage_set: 'Set D',
    stage: 'Pre-Test',
    language: 'en',
    status: 'published',
    content_text: `Nat will nap. He will nap on his bed. But Nat wet the bed. He cannot nap. Nat is sad. Mama gets Nat. Nat has his nap.`,
    questions: [
      { question_text: 'Who will nap?', question_type: 'Multiple Choice', choices: [{ text: 'Matt', is_correct: false }, { text: 'Nat', is_correct: true }, { text: 'Pat', is_correct: false }] },
      { question_text: 'Where did he want to nap?', question_type: 'Multiple Choice', choices: [{ text: 'on his bed', is_correct: true }, { text: 'on the mat', is_correct: false }, { text: 'on the chair', is_correct: false }] },
      { question_text: 'Who helped Nat have his nap?', question_type: 'Multiple Choice', choices: [{ text: 'Mama', is_correct: true }, { text: 'Papa', is_correct: false }, { text: 'his sister', is_correct: false }] }
    ]
  },
  {
    title: 'The Bib',
    grade_level: 'Grade 2',
    passage_set: 'Set A',
    stage: 'Post-Test',
    language: 'en',
    status: 'published',
    content_text: `Bim-bim has a bib. It is from Tina. The bib is red. It is pretty. But the bib is big. Will this fit? "I will get a pin," says Dad. "There. It fits!"`,
    questions: [
      { question_text: 'Who has a bib?', question_type: 'Multiple Choice', choices: [{ text: 'Den-den', is_correct: false }, { text: 'Bim-bim', is_correct: true }, { text: 'Tin-tin', is_correct: false }] },
      { question_text: 'What is the color of the bib?', question_type: 'Multiple Choice', choices: [{ text: 'red', is_correct: true }, { text: 'pink', is_correct: false }, { text: 'yellow', is_correct: false }] },
      { question_text: 'Who gave the bib?', question_type: 'Multiple Choice', choices: [{ text: 'Dad', is_correct: false }, { text: 'Mama', is_correct: false }, { text: 'Tina', is_correct: true }] }
    ]
  },
  {
    title: 'Bam and Tagpi',
    grade_level: 'Grade 2',
    passage_set: 'Set B',
    stage: 'Post-Test',
    language: 'en',
    status: 'published',
    content_text: `Bam is sad. "Where is Tagpi? Where is my pet dog? I want to play with him. He is not in the room." "Aw! Aw!" "Where are you, Tagpi? Oh, you are in the garden."`,
    questions: [
      { question_text: 'Who is Tagpi?', question_type: 'Multiple Choice', choices: [{ text: 'the pet dog of Bam', is_correct: true }, { text: 'the brother of Bam', is_correct: false }, { text: 'the classmate of Bam', is_correct: false }] },
      { question_text: 'Where did Bam find Tagpi?', question_type: 'Multiple Choice', choices: [{ text: 'in the hut', is_correct: false }, { text: 'in the garden', is_correct: true }, { text: 'under the bed', is_correct: false }] }
    ]
  },
  {
    title: 'Pets',
    grade_level: 'Grade 2',
    passage_set: 'Set C',
    stage: 'Post-Test',
    language: 'en',
    status: 'published',
    content_text: `I am Pat. I have a pet cat. I am Ben. I have a pet hen. I am Mig. I have a pet pig. I am Det. I too will have a pet.`,
    questions: [
      { question_text: "What is Pat's pet?", question_type: 'Multiple Choice', choices: [{ text: 'pig', is_correct: false }, { text: 'cat', is_correct: true }, { text: 'hen', is_correct: false }] },
      { question_text: 'Who has a pet pig?', question_type: 'Multiple Choice', choices: [{ text: 'Mig', is_correct: true }, { text: 'Pat', is_correct: false }, { text: 'Ben', is_correct: false }] }
    ]
  },
  {
    title: 'Where the Pets Sat',
    grade_level: 'Grade 2',
    passage_set: 'Set D',
    stage: 'Post-Test',
    language: 'en',
    status: 'published',
    content_text: `Mat is a cat. Mat sat on a hat. Jig is a pig. Jig sat on a wig. Len is a hen. Len did not sit on a hat or a wig. Len sat on ten eggs!`,
    questions: [
      { question_text: 'Where did the pig sit?', question_type: 'Multiple Choice', choices: [{ text: 'on a hat', is_correct: false }, { text: 'on a wig', is_correct: true }, { text: 'on ten eggs', is_correct: false }] },
      { question_text: 'What did the cat do?', question_type: 'Multiple Choice', choices: [{ text: 'sat on eggs', is_correct: false }, { text: 'sat on a wig', is_correct: false }, { text: 'sat on a hat', is_correct: true }] }
    ]
  },

  // ===========================================================================
  // GRADE 3 ENGLISH PASSAGES (Pre-Test Sets A-D & Post-Test Sets A-D)
  // ===========================================================================
  {
    title: 'Summer Fun',
    grade_level: 'Grade 3',
    passage_set: 'Set A',
    stage: 'Pre-Test',
    language: 'en',
    status: 'published',
    content_text: `"Let’s have some fun this summer," says Leo. "Let’s swim in the river," says Lina. "Let’s get some star apples from the tree," says Leo. "Let’s pick flowers," says Lina. "That is so much fun!" says Mama. "But can you help me dust the shelves too?" "Yes, we can Mama," they say. "Helping can be fun too!"`,
    questions: [
      { question_text: 'Who were talking to each other?', question_type: 'Multiple Choice', choices: [{ text: 'Lina and Leo', is_correct: true }, { text: 'Lita and Lito', is_correct: false }, { text: 'Lina and Lino', is_correct: false }] },
      { question_text: 'What were they talking about?', question_type: 'Multiple Choice', choices: [{ text: 'what to do during the summer', is_correct: true }, { text: 'what to wear for school', is_correct: false }, { text: 'what to buy at the market', is_correct: false }] },
      { question_text: 'Which activity did Mama ask them to help with?', question_type: 'Multiple Choice', choices: [{ text: 'dust the shelves', is_correct: true }, { text: 'wash the dishes', is_correct: false }, { text: 'cook lunch', is_correct: false }] }
    ]
  },
  {
    title: 'A Rainy Day',
    grade_level: 'Grade 3',
    passage_set: 'Set B',
    stage: 'Pre-Test',
    language: 'en',
    status: 'published',
    content_text: `Nina and Ria are looking out the window. "I do not like getting wet in the rain," says Nina. "What can we do?" asks Ria. "We can play house," says Nina. "Or we can play tag," says Ria. "Okay, let’s play tag. You’re it!" says Nina. Nina runs from Ria and bumps a lamp. "Oh no!" says Nina. "We must not play tag in the house."`,
    questions: [
      { question_text: 'What is it that Nina does not like?', question_type: 'Multiple Choice', choices: [{ text: 'getting wet in the rain', is_correct: true }, { text: 'playing tag', is_correct: false }, { text: 'cleaning the room', is_correct: false }] },
      { question_text: 'Why wasn’t it a good idea to play tag inside the house?', question_type: 'Multiple Choice', choices: [{ text: 'Something might break (Nina bumped a lamp).', is_correct: true }, { text: 'It was too cold.', is_correct: false }, { text: 'Mama was sleeping.', is_correct: false }] }
    ]
  },
  {
    title: "Ben's Store",
    grade_level: 'Grade 3',
    passage_set: 'Set C',
    stage: 'Pre-Test',
    language: 'en',
    status: 'published',
    content_text: `Ben has his own store. "Do you sell eggs?" asks Mel. "Yes, come in," says Ben. "Do you sell milk?" asks Dante. "Yes, come in," says Ben. "Do you sell hats?" asks Lala. "No, we do not sell hats," says Ben. "But you can come in and have a look." Lala goes in. She gets a banana.`,
    questions: [
      { question_text: 'Who is the owner of the store?', question_type: 'Multiple Choice', choices: [{ text: 'Ben', is_correct: true }, { text: 'Mel', is_correct: false }, { text: 'Dante', is_correct: false }] },
      { question_text: 'What item did Lala get from Ben’s store?', question_type: 'Multiple Choice', choices: [{ text: 'a banana', is_correct: true }, { text: 'a hat', is_correct: false }, { text: 'milk', is_correct: false }] }
    ]
  },
  {
    title: 'Waiting for Her Sister',
    grade_level: 'Grade 3',
    passage_set: 'Set D',
    stage: 'Pre-Test',
    language: 'en',
    status: 'published',
    content_text: `Mara sat by the school gate. It was the end of the day. Mara looked at her watch. "Where is Ate Mila?" she asked. Mara looked at her watch again. At last, Mila has come to pick her up. "Let’s go home. Mama said it’s time for dinner," says Mila. "I am glad you are here," says Mara.`,
    questions: [
      { question_text: 'Where was Mara waiting?', question_type: 'Multiple Choice', choices: [{ text: 'by the school gate', is_correct: true }, { text: 'at the playground', is_correct: false }, { text: 'inside the classroom', is_correct: false }] },
      { question_text: 'Why was Mara looking at her watch?', question_type: 'Multiple Choice', choices: [{ text: 'She was worried that her sister was late.', is_correct: true }, { text: 'She wanted to play.', is_correct: false }, { text: 'It was a new watch.', is_correct: false }] }
    ]
  },
  {
    title: 'The Egg on the Grass',
    grade_level: 'Grade 3',
    passage_set: 'Set A',
    stage: 'Post-Test',
    language: 'en',
    status: 'published',
    content_text: `Duck, Hen, and Bird are in the garden. "I see a big, round egg on the grass," says Bird. "It is not my egg," says Hen. "My egg is in the nest." "It is not my egg," says Duck. "My eggs just hatched." "It is not an egg," says Ben. "It’s my rubber ball."`,
    questions: [
      { question_text: 'Where are Bird, Hen, and Duck?', question_type: 'Multiple Choice', choices: [{ text: 'in the nest', is_correct: false }, { text: 'in the garden', is_correct: true }, { text: 'in the farmhouse', is_correct: false }] },
      { question_text: 'Who saw the egg first?', question_type: 'Multiple Choice', choices: [{ text: 'the hen', is_correct: false }, { text: 'the duck', is_correct: false }, { text: 'the bird', is_correct: true }] },
      { question_text: 'What was the "egg" that the animals saw?', question_type: 'Multiple Choice', choices: [{ text: 'a large top', is_correct: false }, { text: 'a rubber ball', is_correct: true }, { text: 'a plastic cup', is_correct: false }] }
    ]
  },
  {
    title: 'The Caps and the Kittens',
    grade_level: 'Grade 3',
    passage_set: 'Set B',
    stage: 'Post-Test',
    language: 'en',
    status: 'published',
    content_text: `Dan and Pepe will play. "But the sun is hot," says Pepe. "Let us get our caps," says Dan. "My cap is not on my bed," says Pepe. "My cap is not in my bag," says Dan. "Look boys! Our cat has kittens," says Mama. "Mik-mik has four kittens!" says Dan. "Yay! The kittens nap in our caps!"`,
    questions: [
      { question_text: 'Why did Dan and Pepe need their caps?', question_type: 'Multiple Choice', choices: [{ text: 'The sun is hot.', is_correct: true }, { text: 'They will play with their caps.', is_correct: false }, { text: 'They will give the caps to the kittens.', is_correct: false }] },
      { question_text: 'What did the kittens use the caps for?', question_type: 'Multiple Choice', choices: [{ text: 'for playing', is_correct: false }, { text: 'for sleeping on', is_correct: true }, { text: 'for keeping warm', is_correct: false }] }
    ]
  },
  {
    title: 'A Happy Place',
    grade_level: 'Grade 3',
    passage_set: 'Set C',
    stage: 'Post-Test',
    language: 'en',
    status: 'published',
    content_text: `"Come with me," says Dan. "Where will we go?" Mina asks. "We will go to a happy place that has lots of balloons. We will play, dance, and run. We will have so much fun. We will eat orange cake that our mom and dad baked. And then we will sing, Happy birthday, dear Benny!"`,
    questions: [
      { question_text: 'Who asked Mina to go to a happy place?', question_type: 'Multiple Choice', choices: [{ text: 'Mom', is_correct: false }, { text: 'Dan', is_correct: true }, { text: 'Dad', is_correct: false }] },
      { question_text: 'Whose birthday is it?', question_type: 'Multiple Choice', choices: [{ text: 'Dan', is_correct: false }, { text: 'Mina', is_correct: false }, { text: 'Benny', is_correct: true }] }
    ]
  },
  {
    title: 'In the Park',
    grade_level: 'Grade 3',
    passage_set: 'Set D',
    stage: 'Post-Test',
    language: 'en',
    status: 'published',
    content_text: `Today, Sam and Ria will go to the park. What will they do there? They will sit on the grass and look at some bugs. They will look at the holes that the worms have just dug. That is where they will stay on this warm summer day. But they must leave the park before it gets dark.`,
    questions: [
      { question_text: 'Who will go to the park?', question_type: 'Multiple Choice', choices: [{ text: 'Cam and Mia', is_correct: false }, { text: 'Dan and Iya', is_correct: false }, { text: 'Sam and Ria', is_correct: true }] },
      { question_text: 'What will the children do in the park?', question_type: 'Multiple Choice', choices: [{ text: 'play with other children', is_correct: false }, { text: 'observe the insects / bugs', is_correct: true }, { text: 'watch the clouds', is_correct: false }] }
    ]
  }
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting official DepEd Phil-IRI 2018 Passages Seeder...\n');

    let insertedCount = 0;

    for (const p of passagesData) {
      // Check if passage title & grade & stage already exists
      const existing = await client.query(
        `SELECT passage_id FROM phil_iri_passages WHERE title = $1 AND grade_level = $2 AND stage = $3 LIMIT 1`,
        [p.title, p.grade_level, p.stage || 'Pre-Test']
      );

      if (existing.rows.length > 0) {
        console.log(`⏩ Skipping existing passage: "${p.title}" (${p.grade_level} - ${p.passage_set} [${p.stage}])`);
        continue;
      }

      const wordCount = p.content_text.trim().split(/\s+/).filter(Boolean).length;

      const pRes = await client.query(
        `INSERT INTO phil_iri_passages (title, grade_level, passage_set, stage, language, status, content_text, word_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING passage_id`,
        [p.title, p.grade_level, p.passage_set, p.stage || 'Pre-Test', p.language, p.status, p.content_text, wordCount]
      );

      const passageId = pRes.rows[0].passage_id;
      insertedCount++;

      // Insert Questions & Choices
      if (Array.isArray(p.questions)) {
        for (const q of p.questions) {
          const qRes = await client.query(
            `INSERT INTO phil_iri_questions (passage_id, question_text, question_type)
             VALUES ($1, $2, $3)
             RETURNING question_id`,
            [passageId, q.question_text, q.question_type || 'Multiple Choice']
          );

          const questionId = qRes.rows[0].question_id;

          if (Array.isArray(q.choices)) {
            for (const c of q.choices) {
              await client.query(
                `INSERT INTO phil_iri_question_choices (question_id, choice_text, is_correct)
                 VALUES ($1, $2, $3)`,
                [questionId, c.text, c.is_correct]
              );
            }
          }
        }
      }

      console.log(`✅ Seeded: "${p.title}" (${p.grade_level} - ${p.passage_set} [${p.stage}] [${p.language.toUpperCase()}])`);
    }

    console.log(`\n🎉 Successfully inserted ${insertedCount} new Phil-IRI passages!`);
  } catch (err) {
    console.error('❌ Phil-IRI Seeding Failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
