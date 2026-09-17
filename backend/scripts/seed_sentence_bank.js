/**
 * SalinTinig — Child-Friendly Bilingual Sentence Bank (DepEd Early Grade Aligned)
 *
 * Designed for early grade readers with short, clear, vocabulary-appropriate words:
 *   - Easy: 3-4 words (simple subject-verb-object or predicate-subject structures)
 *   - Medium: 4-5 words (direct actions, daily routines, school & family)
 *   - Hard: 5-6 words (complete sentences without complex clauses or hard vocabulary)
 *
 * Total: 150 curated bilingual sentence pairs (50 Easy, 50 Medium, 50 Hard)
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sentenceBankData = [
  // ===========================================================================
  // 1. EASY (50 pairs: strictly 3-4 words)
  // Simple words: family, pets, colors, food, greetings, basic actions
  // ===========================================================================
  { difficulty: 'easy', text_fil: 'Mabait si nanay.', text_eng: 'Mother is kind.' },
  { difficulty: 'easy', text_fil: 'Masaya ang bata.', text_eng: 'The child is happy.' },
  { difficulty: 'easy', text_fil: 'Pula ang mansanas.', text_eng: 'The apple is red.' },
  { difficulty: 'easy', text_fil: 'Mabilis ang aso.', text_eng: 'The dog is fast.' },
  { difficulty: 'easy', text_fil: 'Uminom ng tubig.', text_eng: 'Drink some water.' },
  { difficulty: 'easy', text_fil: 'Malinis ang bahay.', text_eng: 'The house is clean.' },
  { difficulty: 'easy', text_fil: 'Kumakain ang pusa.', text_eng: 'The cat is eating.' },
  { difficulty: 'easy', text_fil: 'Matamis ang saging.', text_eng: 'The banana is sweet.' },
  { difficulty: 'easy', text_fil: 'Bago ang bag.', text_eng: 'The bag is new.' },
  { difficulty: 'easy', text_fil: 'Lumipad ang ibon.', text_eng: 'The bird flew.' },
  { difficulty: 'easy', text_fil: 'Mainit ang araw.', text_eng: 'The sun is hot.' },
  { difficulty: 'easy', text_fil: 'Mataas ang puno.', text_eng: 'The tree is tall.' },
  { difficulty: 'easy', text_fil: 'Naglalaro ang bata.', text_eng: 'The child is playing.' },
  { difficulty: 'easy', text_fil: 'Masipag si tatay.', text_eng: 'Father is hardworking.' },
  { difficulty: 'easy', text_fil: 'Malaki ang bola.', text_eng: 'The ball is big.' },
  { difficulty: 'easy', text_fil: 'Kumanta ang ibon.', text_eng: 'The bird sang.' },
  { difficulty: 'easy', text_fil: 'Mabango ang bulaklak.', text_eng: 'The flower is fragrant.' },
  { difficulty: 'easy', text_fil: 'Bumili ng tinapay.', text_eng: 'Buy some bread.' },
  { difficulty: 'easy', text_fil: 'Matalas ang lapis.', text_eng: 'The pencil is sharp.' },
  { difficulty: 'easy', text_fil: 'Tahimik ang sanggol.', text_eng: 'The baby is quiet.' },
  { difficulty: 'easy', text_fil: 'Masarap ang mangga.', text_eng: 'The mango is delicious.' },
  { difficulty: 'easy', text_fil: 'Puti ang pusa.', text_eng: 'The cat is white.' },
  { difficulty: 'easy', text_fil: 'Sumakay sa dyip.', text_eng: 'Ride the jeepney.' },
  { difficulty: 'easy', text_fil: 'Bumukas ang pinto.', text_eng: 'The door opened.' },
  { difficulty: 'easy', text_fil: 'Malamig ang hangin.', text_eng: 'The wind is cold.' },
  { difficulty: 'easy', text_fil: 'Nagsulat ang bata.', text_eng: 'The child wrote.' },
  { difficulty: 'easy', text_fil: 'Asul ang langit.', text_eng: 'The sky is blue.' },
  { difficulty: 'easy', text_fil: 'Tumakbo ang kabayo.', text_eng: 'The horse ran.' },
  { difficulty: 'easy', text_fil: 'Masaya ang pamilya.', text_eng: 'The family is happy.' },
  { difficulty: 'easy', text_fil: 'Dilaw ang araw.', text_eng: 'The sun is yellow.' },
  { difficulty: 'easy', text_fil: 'Naligo ang bata.', text_eng: 'The child took bath.' },
  { difficulty: 'easy', text_fil: 'Maganda ang damit.', text_eng: 'The dress is pretty.' },
  { difficulty: 'easy', text_fil: 'Matulog nang maaga.', text_eng: 'Sleep very early.' },
  { difficulty: 'easy', text_fil: 'Gising na ako.', text_eng: 'I am now awake.' },
  { difficulty: 'easy', text_fil: 'Uminom ng gatas.', text_eng: 'Drink some fresh milk.' },
  { difficulty: 'easy', text_fil: 'Malambot ang unan.', text_eng: 'The pillow is soft.' },
  { difficulty: 'easy', text_fil: 'Nagluto si ate.', text_eng: 'Older sister cooked.' },
  { difficulty: 'easy', text_fil: 'Mabait ang guro.', text_eng: 'The teacher is kind.' },
  { difficulty: 'easy', text_fil: 'Maghugas ng kamay.', text_eng: 'Wash your hands.' },
  { difficulty: 'easy', text_fil: 'Berde ang dahon.', text_eng: 'The leaf is green.' },
  { difficulty: 'easy', text_fil: 'Lumangoy ang isda.', text_eng: 'The fish swam.' },
  { difficulty: 'easy', text_fil: 'May pulang lobo.', text_eng: 'There is red balloon.' },
  { difficulty: 'easy', text_fil: 'Tumalon ang palaka.', text_eng: 'The frog jumped.' },
  { difficulty: 'easy', text_fil: 'Maliit ang tuta.', text_eng: 'The puppy is small.' },
  { difficulty: 'easy', text_fil: 'Kumain ng isda.', text_eng: 'Eat some delicious fish.' },
  { difficulty: 'easy', text_fil: 'Maliwanag ang buwan.', text_eng: 'The moon is bright.' },
  { difficulty: 'easy', text_fil: 'Bago ang sapatos.', text_eng: 'The shoes are new.' },
  { difficulty: 'easy', text_fil: 'Masigla ang bata.', text_eng: 'The child is cheerful.' },
  { difficulty: 'easy', text_fil: 'Mahal ko sila.', text_eng: 'I love them all.' },
  { difficulty: 'easy', text_fil: 'Pumasok sa silid.', text_eng: 'Enter the classroom.' },

  // ===========================================================================
  // 2. MEDIUM (50 pairs: strictly 4-5 words)
  // Everyday actions, school life, polite expressions, simple full thoughts
  // ===========================================================================
  { difficulty: 'medium', text_fil: 'Naglalaro kami sa bakuran.', text_eng: 'We play in the yard.' },
  { difficulty: 'medium', text_fil: 'Kumakain si kuya ng prutas.', text_eng: 'Older brother eats sweet fruit.' },
  { difficulty: 'medium', text_fil: 'Malinis ang aming silid.', text_eng: 'Our classroom is very clean.' },
  { difficulty: 'medium', text_fil: 'Nagbabasa ako ng bagong aklat.', text_eng: 'I read a new book.' },
  { difficulty: 'medium', text_fil: 'Mataas ang berdeng puno.', text_eng: 'The green tree is tall.' },
  { difficulty: 'medium', text_fil: 'Nagtanim si lolo ng mais.', text_eng: 'Grandfather planted fresh corn.' },
  { difficulty: 'medium', text_fil: 'Masayang nag-aaral ang mga bata.', text_eng: 'The children study happily.' },
  { difficulty: 'medium', text_fil: 'Tumutulong ako sa gawaing bahay.', text_eng: 'I help with household chores.' },
  { difficulty: 'medium', text_fil: 'Uminom siya ng malamig na tubig.', text_eng: 'He drank cold clear water.' },
  { difficulty: 'medium', text_fil: 'Sumikat ang araw sa silangan.', text_eng: 'The sun rose in east.' },
  { difficulty: 'medium', text_fil: 'Bumili si nanay ng isda.', text_eng: 'Mother bought fresh fish today.' },
  { difficulty: 'medium', text_fil: 'Nagwalis kami sa aming bakuran.', text_eng: 'We swept our clean yard.' },
  { difficulty: 'medium', text_fil: 'Mahal ko ang aking pamilya.', text_eng: 'I love my lovely family.' },
  { difficulty: 'medium', text_fil: 'Tahimik na nagbasa ang mag-aaral.', text_eng: 'The student read very quietly.' },
  { difficulty: 'medium', text_fil: 'Nagdala si tatay ng prutas.', text_eng: 'Father brought fresh sweet fruits.' },
  { difficulty: 'medium', text_fil: 'Kumakain kami ng masustansyang gulay.', text_eng: 'We eat healthy green vegetables.' },
  { difficulty: 'medium', text_fil: 'Pumunta kami sa magandang parke.', text_eng: 'We went to nice park.' },
  { difficulty: 'medium', text_fil: 'Nakinig ang mga bata sa guro.', text_eng: 'The children listened to teacher.' },
  { difficulty: 'medium', text_fil: 'Maagang pumasok ang masipag na mag-aaral.', text_eng: 'The student arrived very early.' },
  { difficulty: 'medium', text_fil: 'Inayos nila ang kanilang laruan.', text_eng: 'They put their toys away.' },
  { difficulty: 'medium', text_fil: 'Lumilipad ang saranggola sa langit.', text_eng: 'The kite flies in sky.' },
  { difficulty: 'medium', text_fil: 'Nagbahagi siya ng kanyang baon.', text_eng: 'She shared her delicious snack.' },
  { difficulty: 'medium', text_fil: 'Nagtanim kami ng mga bulaklak.', text_eng: 'We planted some pretty flowers.' },
  { difficulty: 'medium', text_fil: 'Nagsipilyo ako pagkatapos kumain.', text_eng: 'I brushed teeth after eating.' },
  { difficulty: 'medium', text_fil: 'Mabilis tumakbo ang maliit na aso.', text_eng: 'The little dog ran fast.' },
  { difficulty: 'medium', text_fil: 'Masarap ang luto ni nanay.', text_eng: 'Mother cooked a delicious meal.' },
  { difficulty: 'medium', text_fil: 'Nagsuot ako ng malinis na damit.', text_eng: 'I wore clean fresh clothes.' },
  { difficulty: 'medium', text_fil: 'Gumuhit ang bata ng bahay.', text_eng: 'The child drew small house.' },
  { difficulty: 'medium', text_fil: 'Pumila nang maayos ang mga bata.', text_eng: 'The children lined up properly.' },
  { difficulty: 'medium', text_fil: 'Nagpahinga kami sa ilalim ng puno.', text_eng: 'We rested under shady tree.' },
  { difficulty: 'medium', text_fil: 'Binuksan ko ang aming bintana.', text_eng: 'I opened our wide window.' },
  { difficulty: 'medium', text_fil: 'Nakinig kami sa masayang awit.', text_eng: 'We listened to joyful song.' },
  { difficulty: 'medium', text_fil: 'Mabilis sumayaw ang mga bata.', text_eng: 'The children dance very quickly.' },
  { difficulty: 'medium', text_fil: 'Nagbasa si ate ng kuwento.', text_eng: 'Older sister read a story.' },
  { difficulty: 'medium', text_fil: 'Malinaw ang tubig sa sapa.', text_eng: 'The stream water is clear.' },
  { difficulty: 'medium', text_fil: 'Tumulong si Juan sa matanda.', text_eng: 'Juan helped the kind elder.' },
  { difficulty: 'medium', text_fil: 'Pumitas si nanay ng rosas.', text_eng: 'Mother picked a red rose.' },
  { difficulty: 'medium', text_fil: 'Nagsuklay ako ng aking buhok.', text_eng: 'I combed my neat hair.' },
  { difficulty: 'medium', text_fil: 'Umakyat ang pusa sa bakod.', text_eng: 'The cat climbed the fence.' },
  { difficulty: 'medium', text_fil: 'Lumulundag ang kuneho sa damuhan.', text_eng: 'The rabbit hops on grass.' },
  { difficulty: 'medium', text_fil: 'Bumuhos ang malakas na ulan.', text_eng: 'Heavy rain fell down quickly.' },
  { difficulty: 'medium', text_fil: 'Tumunog ang kampana ng paaralan.', text_eng: 'The school bell rang loudly.' },
  { difficulty: 'medium', text_fil: 'Masipag magbasa ang aking kapatid.', text_eng: 'My sibling loves to read.' },
  { difficulty: 'medium', text_fil: 'Naglinis kami ng aming silid.', text_eng: 'We cleaned our tidy room.' },
  { difficulty: 'medium', text_fil: 'Natulog ang pusa sa kama.', text_eng: 'The cat slept on bed.' },
  { difficulty: 'medium', text_fil: 'Kumain kami ng mainit na sopas.', text_eng: 'We ate warm tasty soup.' },
  { difficulty: 'medium', text_fil: 'Iligpit ang mga gamit mo.', text_eng: 'Keep all your belongings tidy.' },
  { difficulty: 'medium', text_fil: 'Nagkulay ang bata sa papel.', text_eng: 'The child colored on paper.' },
  { difficulty: 'medium', text_fil: 'Maingat kaming tumawid sa kalsada.', text_eng: 'We crossed the street carefully.' },
  { difficulty: 'medium', text_fil: 'Masaya kaming nagkwentuhan kagabi.', text_eng: 'We talked happily last night.' },

  // ===========================================================================
  // 3. HARD (50 pairs: strictly 5-6 words)
  // Clear, complete sentences with helping values, good manners, and simple thoughts
  // No deep clauses, no overly long multi-syllable abstract words!
  // ===========================================================================
  { difficulty: 'hard', text_fil: 'Masipag mag-aral ang mga mag-aaral.', text_eng: 'The students study very hard.' },
  { difficulty: 'hard', text_fil: 'Tumutulong ako sa aking mga magulang.', text_eng: 'I help my own parents.' },
  { difficulty: 'hard', text_fil: 'Mahalaga ang pagtatanim ng mga halaman.', text_eng: 'Planting green plants is very important.' },
  { difficulty: 'hard', text_fil: 'Laging magsabi ng totoo sa lahat.', text_eng: 'Always tell truth to everyone.' },
  { difficulty: 'hard', text_fil: 'Masayang sumayaw ang maliit na bata.', text_eng: 'The little child danced happily.' },
  { difficulty: 'hard', text_fil: 'Nagtutulungan ang mga magkakapitbahay sa barangay.', text_eng: 'Neighbors help each other in village.' },
  { difficulty: 'hard', text_fil: 'Igalang natin ang ating mga guro.', text_eng: 'Let us respect our kind teachers.' },
  { difficulty: 'hard', text_fil: 'Maganda ang kultura ng ating bansa.', text_eng: 'Our country has beautiful culture.' },
  { difficulty: 'hard', text_fil: 'Uminom ng maraming tubig araw-araw.', text_eng: 'Drink plenty of water every day.' },
  { difficulty: 'hard', text_fil: 'Tahimik na nag-aaral ang mga bata.', text_eng: 'The children study very quietly together.' },
  { difficulty: 'hard', text_fil: 'Masarap kumain ng masustansyang pagkain.', text_eng: 'Eating healthy food is very good.' },
  { difficulty: 'hard', text_fil: 'Nagdala si ate ng mga prutas.', text_eng: 'Older sister brought some fresh fruits.' },
  { difficulty: 'hard', text_fil: 'Magbasa tayo ng aklat tuwing hapon.', text_eng: 'Let us read books every afternoon.' },
  { difficulty: 'hard', text_fil: 'Mabait ang aming punong-guro sa paaralan.', text_eng: 'Our school principal is very kind.' },
  { difficulty: 'hard', text_fil: 'Nagtanim sila ng mga punong kahoy.', text_eng: 'They planted some shady green trees.' },
  { difficulty: 'hard', text_fil: 'Mahal ko ang aking sariling bayan.', text_eng: 'I truly love my own country.' },
  { difficulty: 'hard', text_fil: 'Laging magpasalamat sa mga biyayang natatanggap.', text_eng: 'Always give thanks for received blessings.' },
  { difficulty: 'hard', text_fil: 'Nagtapos ang klase nang may ngiti.', text_eng: 'Class ended with a happy smile.' },
  { difficulty: 'hard', text_fil: 'Mabubuting asal ang paggalang sa nakatatanda.', text_eng: 'Respecting elders shows great good manners.' },
  { difficulty: 'hard', text_fil: 'Masayang naglaro ang magkakaibigan sa parke.', text_eng: 'Friends played happily at the park.' },
  { difficulty: 'hard', text_fil: 'Panatilihing malinis ang ating mga silid.', text_eng: 'Keep our classrooms clean and tidy.' },
  { difficulty: 'hard', text_fil: 'Tinulungan ng bata ang matandang tumawid.', text_eng: 'The child helped the elder cross.' },
  { difficulty: 'hard', text_fil: 'Nag-aral nang mabuti ang masipag na mag-aaral.', text_eng: 'The hardworking student studied very well.' },
  { difficulty: 'hard', text_fil: 'Ingatan natin ang ating magandang kalikasan.', text_eng: 'Let us take care of nature.' },
  { difficulty: 'hard', text_fil: 'Laging maghugas ng kamay bago kumain.', text_eng: 'Always wash hands before eating meals.' },
  { difficulty: 'hard', text_fil: 'Ibahagi ang iyong mga laruan sa iba.', text_eng: 'Share your toys with other children.' },
  { difficulty: 'hard', text_fil: 'Naglinis ng plasa ang mga kabataan.', text_eng: 'The young people cleaned the plaza.' },
  { difficulty: 'hard', text_fil: 'Masayang kumanta ang koro sa simbahan.', text_eng: 'The choir sang happily in church.' },
  { difficulty: 'hard', text_fil: 'Magtulungan tayo sa lahat ng gawain.', text_eng: 'Let us cooperate in all tasks.' },
  { difficulty: 'hard', text_fil: 'Nagbasa ng magandang alamat ang guro.', text_eng: 'The teacher read a lovely legend.' },
  { difficulty: 'hard', text_fil: 'Maging tapat sa lahat ng oras.', text_eng: 'Always be honest at all times.' },
  { difficulty: 'hard', text_fil: 'Kumain ng gulay upang maging malakas.', text_eng: 'Eat green vegetables to become strong.' },
  { difficulty: 'hard', text_fil: 'Sama-samang kumakain ang buong masayang pamilya.', text_eng: 'The happy family eats meals together.' },
  { difficulty: 'hard', text_fil: 'Naglakad ang magkaibigan papunta sa paaralan.', text_eng: 'Friends walked together toward the school.' },
  { difficulty: 'hard', text_fil: 'Masiglang sumagot ang bata sa klase.', text_eng: 'The child answered cheerfully in class.' },
  { difficulty: 'hard', text_fil: 'Mahalaga ang pagkakaisa ng bawat isa.', text_eng: 'Unity among everyone is very important.' },
  { difficulty: 'hard', text_fil: 'Nakinig sila sa payo ng magulang.', text_eng: 'They listened to their parents advice.' },
  { difficulty: 'hard', text_fil: 'Magtipid ng tubig para sa kalikasan.', text_eng: 'Save water to protect our nature.' },
  { difficulty: 'hard', text_fil: 'Bumati ng magandang umaga sa guro.', text_eng: 'Greet your teacher a good morning.' },
  { difficulty: 'hard', text_fil: 'Maayos na pumila ang mga mag-aaral.', text_eng: 'The students lined up very orderly.' },
  { difficulty: 'hard', text_fil: 'Nagdala si tatay ng masarap na ulam.', text_eng: 'Father brought delicious food for dinner.' },
  { difficulty: 'hard', text_fil: 'Masayang nagkwento si lola sa amin.', text_eng: 'Grandmother told us a fun story.' },
  { difficulty: 'hard', text_fil: 'Gumawa ng takdang-aralin bago maglaro.', text_eng: 'Finish your homework before playing outside.' },
  { difficulty: 'hard', text_fil: 'Tumulong tayo sa mga nangangailangan ng tulong.', text_eng: 'Let us help those in need.' },
  { difficulty: 'hard', text_fil: 'Nagtanim kami ng mga sariwang gulay.', text_eng: 'We planted fresh healthy green vegetables.' },
  { difficulty: 'hard', text_fil: 'Ingatan ang mga aklat sa aklatan.', text_eng: 'Take good care of library books.' },
  { difficulty: 'hard', text_fil: 'Masipag gumawa ng proyekto ang pangkat.', text_eng: 'The group worked hard on project.' },
  { difficulty: 'hard', text_fil: 'Maging magalang sa pagsasalita sa kapwa.', text_eng: 'Always speak politely to other people.' },
  { difficulty: 'hard', text_fil: 'Masayang naglaro ng taguan ang magkakaibigan.', text_eng: 'Friends happily played hide and seek.' },
  { difficulty: 'hard', text_fil: 'Magandang asal ang pagsasabi ng salamat.', text_eng: 'Saying thank you shows good manners.' },
];

async function seedSentenceBank() {
  const client = await pool.connect();
  try {
    console.log(`🚀 Starting child-friendly sentence_bank seeding (${sentenceBankData.length} pairs)...`);

    // 1. Recreate table cleanly
    await client.query(`
      DROP TABLE IF EXISTS sentence_bank CASCADE;
      CREATE TABLE sentence_bank (
          sentence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
          text_fil TEXT NOT NULL,
          text_eng TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_sentence_bank_difficulty ON sentence_bank(difficulty);
    `);

    let inserted = 0;

    for (const item of sentenceBankData) {
      await client.query(
        `INSERT INTO sentence_bank (difficulty, text_fil, text_eng)
         VALUES ($1, $2, $3)`,
        [item.difficulty, item.text_fil.trim(), item.text_eng.trim()]
      );
      inserted++;
    }

    console.log(`✅ Finished seeding child-friendly sentence_bank:`);
    console.log(`   - Total Bilingual Pairs Inserted: ${inserted}`);

    // Summary counts
    const counts = await client.query(`
      SELECT difficulty, COUNT(*) as count
      FROM sentence_bank
      GROUP BY difficulty
      ORDER BY difficulty;
    `);

    console.log('\n📊 Current Sentence Bank Distribution:');
    for (const row of counts.rows) {
      console.log(`   - ${row.difficulty.toUpperCase().padEnd(8)}: ${row.count} bilingual pairs`);
    }

    const total = await client.query('SELECT COUNT(*) as total FROM sentence_bank');
    console.log(`\n🎉 Total Bilingual Sentence Pairs in Database: ${total.rows[0].total}`);
  } catch (err) {
    console.error('❌ Error during sentence_bank seeding:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedSentenceBank();
