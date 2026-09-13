/**
 * SalinTinig — Unified Stories Library & Reading Comprehension Seeder
 * 
 * Curated bilingual library collection for upper elementary (Grades 4-6):
 *   - Short Stories, Fables, Poems, Alamat, and Informational Passages
 *   - Filipino & English leveled reading materials
 *   - Embedded multiple-choice comprehension questions with explanations
 * 
 * Run with:
 *   npm run seed:stories
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const storyBankData = [
  // ===========================================================================
  // 1. GRADE 4 (Foundational Comprehension & Moral Lessons)
  // ===========================================================================
  {
    title: 'Sari-Sari Summers',
    author: 'Lynnor Bontigao',
    description: 'Nora helps her Lola save their sari-sari store by making mango ice candy during a hot summer in the Philippines.',
    content_text:
      'Chapter 1\n\n' +
      'Nora spent her summer helping her Lola at their small sari-sari store in the neighborhood.\n\n' +
      'Every morning, she arranged snacks, canned goods, and bottles on the shelves before customers arrived. One very hot afternoon, Nora noticed that there were no customers.\n\n' +
      'Chapter 2\n\n' +
      'She thought about how they could make the store more popular. "What if we sell mango ice candy?" she whispered to herself.\n\n' +
      'She gathered ripe yellow mangoes, condensed milk, and water, then poured the sweet mixture into long plastic bags. By the next day, they were frozen solid and ready to sell! Neighbors lined up happily to buy.',
    language: 'fil',
    category: 'Short Story',
    grade_level_target: 'Grade 4',
    difficulty_level: 'Easy',
    reading_time_minutes: 3,
    quiz_questions: [
      {
        questionText: 'Sino ang tinulungan ni Nora noong panahon ng bakasyon?',
        options: ['Ang kanyang Lola', 'Ang kanyang pinsan', 'Ang kanyang nanay', 'Ang guro'],
        correctAnswerIndex: 0,
        explanation: 'Binanggit sa simula na tinutulungan ni Nora ang kanyang Lola sa tindahan.'
      },
      {
        questionText: 'Anong pampalamig ang naisip gawin ni Nora para kumita ang tindahan?',
        options: ['Mango ice candy', 'Ube ice cream', 'Halo-halo', 'Banana cue'],
        correctAnswerIndex: 0,
        explanation: 'Gumawa si Nora ng masarap at matamis na mango ice candy gamit ang hinog na mangga.'
      },
      {
        questionText: 'Anong magandang katangian ang ipinakita ni Nora sa kwento?',
        options: ['Pagiging malikhain, masipag, at matulungin', 'Pagiging palaasa sa iba', 'Paggastos ng pera sa laro', 'Pagiging mareklamo'],
        correctAnswerIndex: 0,
        explanation: 'Nagpakita si Nora ng kusa at sipag upang makatulong sa kanyang pamilya.'
      }
    ]
  },
  {
    title: 'A Song of Frutas',
    author: 'Margarita Engle',
    description: 'A child helps family sell colorful fruits in the bustling market while celebrating culture, community, and song.',
    content_text:
      'Chapter 1\n\n' +
      'When we visit my abuelo in the city, the streets are alive with the sweet song of frutas.\n\n' +
      'Our wooden cart is piled high with sweet mangoes, juicy pineapples, and ripe papayas. We call out to the neighbors with rhyming tunes, singing the names along with the fruits we carry.\n\n' +
      'Chapter 2\n\n' +
      'Everyone comes out to listen and buy. The children run to us with coins in their hands, their faces lighting up at the sight of the colorful harvest.\n\n' +
      'At the end of the day, when the cart is empty, Abuelo plays his guitar, and we sing our own song of gratitude for a wonderful day.',
    language: 'en',
    category: 'Short Story',
    grade_level_target: 'Grade 4',
    difficulty_level: 'Easy',
    reading_time_minutes: 3,
    quiz_questions: [
      {
        questionText: 'Whom does the child visit in the city?',
        options: ['Abuelo (Grandfather)', 'Lola', 'Uncle', 'Teacher'],
        correctAnswerIndex: 0,
        explanation: 'The narrator visits Abuelo in the city.'
      },
      {
        questionText: 'What instrument does Abuelo play when the cart is empty?',
        options: ['Guitar', 'Piano', 'Flute', 'Drums'],
        correctAnswerIndex: 0,
        explanation: 'Abuelo plays his guitar as they sing together.'
      },
      {
        questionText: 'Which delicious fruits were piled upon their cart?',
        options: ['Mangoes, pineapples, and papayas', 'Apples and pears', 'Watermelons only', 'Strawberries and cherries'],
        correctAnswerIndex: 0,
        explanation: 'The story specifically names sweet mangoes, juicy pineapples, and papayas.'
      }
    ]
  },
  {
    title: 'Si Pagong at si Matsing',
    author: 'Dr. Jose Rizal (Kuwentong Bayan)',
    description: 'Ang tanyag na pabula tungkol sa matalinong pagong at ang tusong matsing na naghati sa isang puno ng saging.',
    content_text:
      'Isang araw, nakakita si Pagong at si Matsing ng isang lumulutang na puno ng saging sa ilog. Napagkasunduan nilang hatiin ito upang itanim.\n\n' +
      'Dahil tuso si Matsing, pinili niya ang itaas na bahagi na may mga dahon, sa pag-aakalang agad itong mamumunga. Ang ibabang bahagi na may mga ugat ay napunta naman kay Pagong.\n\n' +
      'Itinanim nila ang kani-kanilang bahagi. Makalipas ang ilang linggo, nalanta at namatay ang bahagi ni Matsing, habang ang kay Pagong naman ay lumago, nagkadahon ng bago, at namunga ng matatamis na saging!\n\n' +
      'Nang mahinog ang mga saging, nakiusap si Pagong kay Matsing na akyatin ito dahil hindi siya marunong umakyat. Subalit kinain lahat ni Matsing ang saging nang hindi binibigyan si Pagong. Dahil dito, nilagyan ni Pagong ng tinik ang puno upang turuan ng leksyon ang sakim na kaibigan.',
    language: 'fil',
    category: 'Fable',
    grade_level_target: 'Grade 4',
    difficulty_level: 'Easy',
    reading_time_minutes: 4,
    quiz_questions: [
      {
        questionText: 'Bakit pinili ni Matsing ang itaas na bahagi ng puno ng saging?',
        options: ['Inakala niyang mabilis mamunga dahil may mga dahon na', 'Gusto niyang tulungan si Pagong', 'Wala siyang ibang mapagpilian', 'Gusto niya ang tuyong dahon'],
        correctAnswerIndex: 0,
        explanation: 'Pinili ni Matsing ang itaas dahil inakala niyang mas mabilis mamunga ang may dahon.'
      },
      {
        questionText: 'Bakit lumago at namunga ang bahagi na napunta kay Pagong?',
        options: ['Dahil may mga ugat ito na sumisipsip ng sustansya mula sa lupa', 'Dahil nilagyan niya ito ng pampatamis', 'Dahil itinago niya ito sa dilim', 'Dahil madalas itong kantahan ni Pagong'],
        correctAnswerIndex: 0,
        explanation: 'Ang mga ugat ang nagbigay-buhay sa halaman upang lumago at mamunga.'
      },
      {
        questionText: 'Ano ang aral na itinuturo ng kwentong ito?',
        options: ['Ang kasakiman at panlalamang ay nagdudulot ng kapahamakan', 'Huwag nang magtanim ng puno', 'Mas mabuting kumain nang mag-isa', 'Maging tuso palagi sa kaibigan'],
        correctAnswerIndex: 0,
        explanation: 'Ipinapakita ng kwento na ang panlalamang sa kapwa ay laging may masamang kinahinatnan.'
      }
    ]
  },
  {
    title: 'Ang Sipag ng Langgam',
    author: 'Amado V. Hernandez',
    description: 'Isang masiglang tula na nagbibigay-pugay sa kasipagan at paghahanda ng munting langgam sa tag-ulan.',
    content_text:
      'Munting langgam sa damuhan,\n' +
      'Araw-araw ay gumagapang;\n' +
      'Dala-dala ang pagkain,\n' +
      'Sa lungga ay iipunin.\n\n' +
      'Kahit mainit ang araw,\n' +
      'Hindi kailanman umaayaw;\n' +
      'Paghahanda sa tag-ulan,\n' +
      'Upang hindi magutom naman.\n\n' +
      'O kabataan, tularan natin,\n' +
      'Ang langgam na masipag gawin;\n' +
      'Mag-aral at magsikap tuwina,\n' +
      'Para sa magandang bukas na sasapit na!',
    language: 'fil',
    category: 'Poem',
    grade_level_target: 'Grade 4',
    difficulty_level: 'Easy',
    reading_time_minutes: 2,
    quiz_questions: [
      {
        questionText: 'Ano ang ginagawa ng langgam kahit matindi ang init ng araw?',
        options: ['Nangangalap at nag-iipon ng pagkain', 'Natutulog sa ilalim ng bato', 'Naglalaro sa damuhan', 'Naliligo sa ilog'],
        correctAnswerIndex: 0,
        explanation: 'Ayon sa tula, patuloy na nag-iipon ng pagkain ang langgam para sa tag-ulan.'
      },
      {
        questionText: 'Ano ang pangunahing layunin ng may-akda sa tula?',
        options: ['Hikayatin ang kabataan na maging masipag at handa', 'Ikwento ang uri ng mga insekto', 'Turuan ang bata na matulog sa hapon', 'Magbenta ng pagkain'],
        correctAnswerIndex: 0,
        explanation: 'Ipinapayo ng makata na maging masipag at mag-aral nang mabuti ang kabataan.'
      }
    ]
  },
  {
    title: 'Ang Alamat ng Pinya',
    author: 'Kuwentong Bayan',
    description: 'Ang kwento ng isang tamad na batang babae na naghanap ng kanyang mga mata at kung paano naging pinya ang kanyang ulo.',
    content_text:
      'Kabanata 1\n\n' +
      'Noong unang panahon, may isang batang babae na nakatira kasama ang kanyang ina. Siya ay napakatamarim — kahit ang pinakamaliit na bagay ay ayaw niyang gawin.\n\n' +
      'Isang araw, nagkasakit ang kanyang ina. Humingi siya ng tulong ngunit ang batang babae ay nagreklamo dahil hindi niya mahanap ang sandok.\n\n' +
      'Kabanata 2\n\n' +
      '"Sana ay magkaroon ka ng maraming mata para mahanap mo ang lahat ng bagay!" sabi ng ina sa galit.\n\n' +
      'Nang dumating ang gabi, nawala ang batang babae. Kinabukasan, isang halaman ang tumubo sa bakuran — isang prutas na may maraming mata sa katawan nito, na tinawag nilang pinya.',
    language: 'fil',
    category: 'Alamat',
    grade_level_target: 'Grade 4',
    difficulty_level: 'Easy',
    reading_time_minutes: 4,
    quiz_questions: [
      {
        questionText: 'Bakit naging pinya ang batang babae sa kwento?',
        options: ['Dahil siya ay tamad at ayaw tumulong sa kanyang ina', 'Dahil gusto niyang maging halaman', 'Dahil siya ay masipag magtanim', 'Dahil kumain siya ng maraming prutas'],
        correctAnswerIndex: 0,
        explanation: 'Naging aral ang kanyang kasipagan at kawalan ng kusa sa tulong ng kanyang ina.'
      },
      {
        questionText: 'Ano ang katangian ng prutas na kumakatawan sa batang babae?',
        options: ['May maraming mata sa paligid nito', 'Napakaitim ng balat', 'Matamis na kulay berde', 'Walang anyo'],
        correctAnswerIndex: 0,
        explanation: 'Ang pinya ay may maraming mata bilang paalala sa kawalan niya ng tingin sa kanyang paligid.'
      }
    ]
  },

  // ===========================================================================
  // 2. GRADE 5 (Tradition, Heritage, Science, and Responsibility)
  // ===========================================================================
  {
    title: 'Old Clothes for Dinner',
    author: 'Chelo Aestrid',
    description: 'A delightful story about a child\'s perspective on home-cooked meals, family history, and cherished dining traditions.',
    content_text:
      'Chapter 1\n\n' +
      'Every Sunday evening, my mother tells us we are having "old clothes" for dinner.\n\n' +
      'At first, I thought she meant we would eat fabric! But she explained that it is a traditional stew made from shredded beef and vegetables, representing thriftiness and love.\n\n' +
      'Chapter 2\n\n' +
      'As the stew simmers on the stove, the kitchen fills with a rich aroma of garlic, onions, and sweet bell peppers.\n\n' +
      'When we sit down at the table, we share stories of our ancestors, realizing that these "old clothes" are actually a warm embrace of history.',
    language: 'en',
    category: 'Short Story',
    grade_level_target: 'Grade 5',
    difficulty_level: 'Medium',
    reading_time_minutes: 3,
    quiz_questions: [
      {
        questionText: 'What did the narrator think they were eating at first?',
        options: ['Actual fabric/clothes', 'Vegetables', 'Beef stew', 'Leftovers'],
        correctAnswerIndex: 0,
        explanation: 'The narrator humorously thought they were going to eat real fabric.'
      },
      {
        questionText: 'What does the dish "old clothes" (Ropa Vieja) actually represent?',
        options: ['Thriftiness, tradition, and love', 'New fashionable clothes', 'A dull dinner', 'A dirty kitchen'],
        correctAnswerIndex: 0,
        explanation: 'The stew honors resourcefulness, family memories, and warmth.'
      }
    ]
  },
  {
    title: 'Ang Agila ng Pilipinas',
    author: 'DepEd Science & Reading Module',
    description: 'Isang sanaysay tungkol sa maringal na pambansang ibon ng Pilipinas at ang kahalagahan ng pagprotekta sa kalikasan.',
    content_text:
      'Ang Agila ng Pilipinas (Philippine Eagle) ay itinuturing na isa sa pinakamalaki, pinakamakapangyarihan, at pinakamagagandang ibon sa buong daigdig. Ito ang ating Pambansang Ibon na simbolo ng lakas at kalayaan ng lahing Pilipino.\n\n' +
      'Matatagpuan ang mga agilang ito sa mayayamang kagubatan ng Luzon, Samar, Leyte, at lalo na sa palibot ng Bundok Apo sa Mindanao. Mayroon silang malalapad na pakpak at matatalim na kuko na kayang humuli ng malalaking hayop tulad ng unggoy, bayawak, at ahas.\n\n' +
      'Sa kasamaang palad, ang bilang ng mga agila ay mabilis na nababawasan dahil sa pagpuputol ng mga puno at pagkasira ng kanilang natural na tirahan. Dahil dito, sila ay idineklarang endangered species. Kailangan nating pangalagaan ang ating mga kagubatan upang magkaroon pa rin ng ligtas na tahanan ang ating pambansang ibon para sa mga susunod na henerasyon.',
    language: 'fil',
    category: 'Informational',
    grade_level_target: 'Grade 5',
    difficulty_level: 'Medium',
    reading_time_minutes: 4,
    quiz_questions: [
      {
        questionText: 'Saan sa Pilipinas karaniwang matatagpuan ang Philippine Eagle?',
        options: ['Sa kagubatan ng Luzon, Samar, Leyte, at Mindanao', 'Sa baybayin ng Maynila', 'Sa kuweba ng Palawan lamang', 'Sa bukid ng Ilocos'],
        correctAnswerIndex: 0,
        explanation: 'Nakatala sa sanaysay na sila ay naninirahan sa kagubatan ng Luzon, Samar, Leyte, at Mindanao.'
      },
      {
        questionText: 'Bakit nanganganib maubos (endangered) ang mga Agila ng Pilipinas?',
        options: ['Dahil sa pagkasira ng kagubatan at kawalan ng tirahan', 'Dahil lumilipad sila sa ibang bansa', 'Dahil hindi marunong maghanap ng pagkain', 'Dahil sa malamig na klima'],
        correctAnswerIndex: 0,
        explanation: 'Ang pagkasira ng kagubatan ang pangunahing banta sa kaligtasan ng mga agila.'
      }
    ]
  },
  {
    title: 'The Ant and the Grasshopper',
    author: 'Aesop',
    description: 'A classic fable reminding students about the virtues of hard work, preparation, and planning for the future.',
    content_text:
      'On a bright summer day, a Grasshopper was hopping about in a field, chirping and singing to its heart\'s content.\n\n' +
      'An Ant passed by, bearing along with great effort an ear of corn he was taking to his nest. "Why not come and sing with me," said the Grasshopper, "instead of toiling away in the sun?"\n\n' +
      '"I am helping to lay up food for the winter," replied the Ant, "and I recommend you do the same."\n\n' +
      '"Why bother about winter?" said the Grasshopper. "We have plenty of food at present."\n\n' +
      'When winter came, the frozen ground offered no food, and the Grasshopper found itself dying of hunger. Meanwhile, the ants distributed corn and grain from the stores they had collected all summer long. Then the Grasshopper knew: It is best to prepare for days of need.',
    language: 'en',
    category: 'Fable',
    grade_level_target: 'Grade 5',
    difficulty_level: 'Medium',
    reading_time_minutes: 3,
    quiz_questions: [
      {
        questionText: 'What was the Ant doing during the sunny summer days?',
        options: ['Gathering and storing food for winter', 'Singing and dancing in the trees', 'Sleeping near the pond', 'Building a boat'],
        correctAnswerIndex: 0,
        explanation: 'The ant worked persistently to store grain for the upcoming cold winter.'
      },
      {
        questionText: 'What happened to the Grasshopper when winter arrived?',
        options: ['It was cold and starving because it did not prepare', 'It traveled south for vacation', 'It became king of the forest', 'It gave grain to the ants'],
        correctAnswerIndex: 0,
        explanation: 'Because it spent the summer playing, it had no food during winter.'
      },
      {
        questionText: 'What is the moral lesson of this fable?',
        options: ['Work hard today to prepare for tomorrow\'s needs', 'Play and sleep all day', 'Always expect others to feed you', 'Never listen to advice'],
        correctAnswerIndex: 0,
        explanation: 'The fable teaches diligence, foresight, and personal responsibility.'
      }
    ]
  },
  {
    title: 'Ang Mahiwagang Batingaw',
    author: 'Kuwentong Bayan',
    description: 'Isang kwento tungkol sa isang batingaw na nagbibigay ng iba\'t ibang himala sa isang maliit na nayon sa Pilipinas.',
    content_text:
      'Kabanata 1\n\n' +
      'Sa isang maliit na nayon sa bundok, may isang lumang batingaw na nakabitin sa gitna ng plaza.\n\n' +
      'Ayon sa mga matatanda, ang batingaw na ito ay may mahiwagang kapangyarihan — kung tutunog ito nang kusang-loob, may darating na bagay na magbabago ng nayon.\n\n' +
      'Kabanata 2\n\n' +
      'Isang umaga, tumunog ang batingaw nang walang tumatawid. Ang lahat ay natakot at naghanda para sa anumang darating.\n\n' +
      'Ngunit ang dumating ay hindi sakuna — isang manlalakbay ang pumasok sa nayon na may dala-dalang mga buto ng natatanging halaman. Dahil sa kanya, naging masagana ang nayon magpahanggang ngayon.',
    language: 'fil',
    category: 'Short Story',
    grade_level_target: 'Grade 5',
    difficulty_level: 'Medium',
    reading_time_minutes: 4,
    quiz_questions: [
      {
        questionText: 'Saan nakabitin ang mahiwagang batingaw?',
        options: ['Sa gitna ng plaza', 'Sa simbahan', 'Sa bahay ng alkalde', 'Sa puno'],
        correctAnswerIndex: 0,
        explanation: 'Nakatala na ang batingaw ay nakabitin sa gitna ng plaza ng nayon.'
      },
      {
        questionText: 'Sino ang dumating nang tumunog ang batingaw?',
        options: ['Isang manlalakbay na may dala-dalang mga buto ng halaman', 'Isang kalaban na hukbo', 'Isang malakas na bagyo', 'Isang anghel'],
        correctAnswerIndex: 0,
        explanation: 'Ang manlalakbay ang nagdala ng saganang pananim sa nayon.'
      }
    ]
  },
  {
    title: 'The Little Prince and the Fox',
    author: 'Antoine de Saint-Exupéry (adapted)',
    description: 'A gentle story about friendship, taming, and what makes things truly special.',
    content_text:
      'Chapter 1\n\n' +
      'The Little Prince met a fox one afternoon in a field of golden wheat.\n\n' +
      '"Come and play with me," said the Little Prince. "I am so sad."\n\n' +
      '"I cannot play with you," said the fox. "I am not tamed."\n\n' +
      'Chapter 2\n\n' +
      '"What does that mean — \'tame\'?" asked the Little Prince.\n\n' +
      '"It means to establish ties," said the fox. "To me, you are still nothing more than a little boy who is just like a hundred thousand other little boys. But if you tame me, then we shall need each other. To me, you will be unique in all the world."\n\n' +
      'The Little Prince thought about this for a long time. Then he smiled and sat down near the fox.\n\n' +
      'And so, little by little, they became friends.',
    language: 'en',
    category: 'Short Story',
    grade_level_target: 'Grade 5',
    difficulty_level: 'Easy',
    reading_time_minutes: 5,
    quiz_questions: [
      {
        questionText: 'What does "tame" mean according to the fox?',
        options: ['To establish ties', 'To catch an animal', 'To make something wild', 'To run fast'],
        correctAnswerIndex: 0,
        explanation: 'The fox explains that taming means creating meaningful ties between two individuals.'
      },
      {
        questionText: 'What did the Little Prince do after thinking?',
        options: ['He sat down near the fox', 'He ran away', 'He went home', 'He cried'],
        correctAnswerIndex: 0,
        explanation: 'He sat near the fox, beginning the process of taming and friendship.'
      }
    ]
  },

  // ===========================================================================
  // 3. GRADE 6 (Critical Thinking, Environmental Stewardship, and Wit)
  // ===========================================================================
  {
    title: 'Ang Tubbataha Reefs',
    author: 'DepEd Environmental Education',
    description: 'Isang paglalakbay sa tanyag na coral reef sanctuary sa Dagat Sulu na kinikilala sa buong daigdig.',
    content_text:
      'Ang Tubbataha Reefs Natural Park ay isang napakagandang santuwaryo sa gitna ng Dagat Sulu. Dahil sa taglay nitong pambihirang ganda at yamang-dagat, idineklara ito ng UNESCO bilang isang World Heritage Site.\n\n' +
      'Sa ilalim ng malinaw na asul na tubig, makikita ang makukulay na bahura o coral reefs na tahanan ng higit sa 600 uri ng isda, 360 uri ng korales, at sari-saring uri ng pating, lumba-lumba, at mga dambuhalang pawikan.\n\n' +
      'Striktong ipinagbabawal sa parke ang anumang uri ng komersyal na pangingisda upang maprotektahan ang marupok na balanse ng ekolohiya. Ang Tubbataha ay patunay ng mayamang likas na yaman ng Pilipinas na dapat nating ipagmalaki at protektahan para sa kinabukasan.',
    language: 'fil',
    category: 'Informational',
    grade_level_target: 'Grade 6',
    difficulty_level: 'Hard',
    reading_time_minutes: 4,
    quiz_questions: [
      {
        questionText: 'Saang bahagi ng karagatan matatagpuan ang Tubbataha Reefs?',
        options: ['Sa Dagat Sulu', 'Sa Dagat Pasipiko', 'Sa Look ng Maynila', 'Sa Dagat Celebes'],
        correctAnswerIndex: 0,
        explanation: 'Matatagpuan ang Tubbataha Reefs Natural Park sa gitna ng Dagat Sulu.'
      },
      {
        questionText: 'Bakit mahigpit na ipinagbabawal ang pangingisda sa Tubbataha Reefs?',
        options: ['Upang ingatan ang mga korales at pambihirang lamang-dagat', 'Dahil madumi ang tubig', 'Dahil walang isda sa lugar', 'Dahil mapanganib ang mga alon'],
        correctAnswerIndex: 0,
        explanation: 'Pinoprotektahan ang santuwaryo upang mapanatili ang biodiversity ng dagat.'
      }
    ]
  },
  {
    title: 'The Crow and the Pitcher',
    author: 'Aesop',
    description: 'An inspiring tale demonstrating that patience and clever thinking can solve seemingly impossible problems.',
    content_text:
      'A thirsty Crow found a pitcher with a little water in it. But the pitcher was high and had a narrow neck, and no matter how hard he tried, the Crow could not reach the water with his beak. He felt as if he must die of thirst.\n\n' +
      'Then a brilliant thought came to him. He looked around and noticed many small pebbles lying on the ground.\n\n' +
      'One by one, he picked up the pebbles and dropped them into the pitcher. With each pebble he dropped, the water rose a little higher.\n\n' +
      'He kept dropping pebbles patiently until at last, the water reached the brim of the pitcher. Then the thirsty Crow drank his fill, his life saved by his wit and patience.',
    language: 'en',
    category: 'Fable',
    grade_level_target: 'Grade 6',
    difficulty_level: 'Hard',
    reading_time_minutes: 3,
    quiz_questions: [
      {
        questionText: 'Why was the Crow unable to drink the water initially?',
        options: ['The pitcher had a tall, narrow neck with very little water', 'The water was frozen', 'The pitcher had a sealed lid', 'Other animals guarded the water'],
        correctAnswerIndex: 0,
        explanation: 'The neck of the pitcher was too narrow and the water was too deep at the bottom.'
      },
      {
        questionText: 'How did the Crow successfully raise the water level?',
        options: ['By dropping pebbles inside one by one to displace the water', 'By tipping over the pitcher', 'By waiting for a heavy downpour', 'By breaking the base of the pitcher'],
        correctAnswerIndex: 0,
        explanation: 'The crow patiently dropped pebbles inside until the water reached the brim.'
      },
      {
        questionText: 'What key lesson does the Crow\'s triumph demonstrate?',
        options: ['Clever thinking and persistence solve difficult challenges', 'Giving up is better than trying hard', 'Physical strength is the only path to success', 'Animals cannot think creatively'],
        correctAnswerIndex: 0,
        explanation: 'Persistence and resourcefulness overcome seemingly impossible barriers.'
      }
    ]
  },
  {
    title: 'Ang Alamat ng Bahaghari',
    author: 'Genoveva Edroza-Matute',
    description: 'Tuklasin kung paano nagkaroon ng sari-saring kulay ang kalangitan sa pamamagitan ng kwentong-bayan na ito.',
    content_text:
      'Kabanata 1\n\n' +
      'Noong unang panahon, ang langit ay puro puti lamang. Walang kulay, walang saya — para sa mga tao sa lupa, ang langit ay parang isang malaking puting tela.\n\n' +
      'Nanghihinayang ang Diyos kaya naman tinawag niya ang lahat ng kulay mula sa buong mundo.\n\n' +
      'Kabanata 2\n\n' +
      'Dumating ang Pula, ang Kahel, ang Dilaw, ang Berde, ang Asul, at ang Lila — bawat isa ay nagbigay ng kanilang pinakamagandang kulay sa langit.\n\n' +
      'Ngunit hindi sila magkasundo kung sino ang pipili ng lugar sa langit. Kaya naman, ipinasya ng Diyos na ilagay sila lahat sa isang pagkakataon — tuwing may ulan at araw, makikita ang lahat ng kulay sa langit bilang bahaghari.',
    language: 'fil',
    category: 'Alamat',
    grade_level_target: 'Grade 6',
    difficulty_level: 'Medium',
    reading_time_minutes: 4,
    quiz_questions: [
      {
        questionText: 'Bakit walang kulay ang langit noong unang panahon?',
        options: ['Dahil puro puti lamang ito', 'Dahil puti ang gusto ng Diyos', 'Dahil maulap lagi', 'Dahil gabi lagi'],
        correctAnswerIndex: 0,
        explanation: 'Sa simula ng kwento, ang langit ay inilarawan na puro puti lamang.'
      },
      {
        questionText: 'Kailan makikita ang bahaghari sa kalangitan?',
        options: ['Tuwing may ulan at araw', 'Tuwing gabi', 'Tuwing tag-init', 'Tuwing Pasko'],
        correctAnswerIndex: 0,
        explanation: 'Nagpapakita ang bahaghari kapag sumisikat ang araw habang umuulan.'
      }
    ]
  }
];

async function seedStoryLibrary() {
  const client = await pool.connect();
  try {
    console.log(`🚀 Starting Unified Stories Library Seeding (${storyBankData.length} stories)...`);

    // Ensure table structure is present & drop removed columns if they exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS reading_materials (
          material_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          author VARCHAR(150) DEFAULT 'Unknown',
          description TEXT,
          content_text TEXT NOT NULL,
          language VARCHAR(20) NOT NULL DEFAULT 'fil',
          category VARCHAR(50) NOT NULL DEFAULT 'Short Story',
          grade_level_target VARCHAR(50) NOT NULL DEFAULT 'Grade 4',
          difficulty_level VARCHAR(50) DEFAULT 'Easy',
          reading_time_minutes INT DEFAULT 3,
          quiz_questions JSONB DEFAULT '[]'::jsonb,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE reading_materials DROP COLUMN IF EXISTS cover_image_url;
      ALTER TABLE reading_materials DROP COLUMN IF EXISTS tags;
      ALTER TABLE reading_materials DROP COLUMN IF EXISTS source_attribution;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_reading_materials_title'
        ) THEN
          ALTER TABLE reading_materials ADD CONSTRAINT uq_reading_materials_title UNIQUE (title);
        END IF;
      END $$;
    `);

    // Purge legacy duplicates or titles with different formatting/casing in the DB
    const validTitles = storyBankData.map(s => s.title);
    const placeholders = validTitles.map((_, i) => `$${i + 1}`).join(', ');
    await client.query(
      `DELETE FROM reading_materials WHERE LOWER(title) NOT IN (${placeholders});`,
      validTitles.map(t => t.toLowerCase())
    );

    let upsertedCount = 0;

    for (const story of storyBankData) {
      await client.query(`
        INSERT INTO reading_materials (
          title, author, description, content_text, language, category,
          grade_level_target, difficulty_level, reading_time_minutes,
          quiz_questions, status, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', CURRENT_TIMESTAMP)
        ON CONFLICT (title) DO UPDATE SET
          author = EXCLUDED.author,
          description = EXCLUDED.description,
          content_text = EXCLUDED.content_text,
          language = EXCLUDED.language,
          category = EXCLUDED.category,
          grade_level_target = EXCLUDED.grade_level_target,
          difficulty_level = EXCLUDED.difficulty_level,
          reading_time_minutes = EXCLUDED.reading_time_minutes,
          quiz_questions = EXCLUDED.quiz_questions,
          status = 'active',
          updated_at = CURRENT_TIMESTAMP;
      `, [
        story.title,
        story.author,
        story.description,
        story.content_text,
        story.language,
        story.category,
        story.grade_level_target,
        story.difficulty_level,
        story.reading_time_minutes,
        JSON.stringify(story.quiz_questions),
      ]);
      upsertedCount++;
    }

    console.log(`✅ Upserted ${upsertedCount} clean stories into reading_materials.`);

    // Print breakdown
    const gradeSummary = await client.query(`
      SELECT grade_level_target, language, category, COUNT(*) as count
      FROM reading_materials
      GROUP BY grade_level_target, language, category
      ORDER BY grade_level_target, language, category;
    `);

    console.log('\n📊 Stories Library Distribution:');
    for (const row of gradeSummary.rows) {
      console.log(`   - [${row.grade_level_target}] (${row.language.toUpperCase()}) ${row.category}: ${row.count} material(s)`);
    }

    const totalCount = await client.query(`
      SELECT 
        COUNT(*) as total_stories,
        SUM(jsonb_array_length(quiz_questions)) as total_questions
      FROM reading_materials;
    `);

    console.log(`\n🎉 Total Unique Stories in Library: ${totalCount.rows[0].total_stories}`);
    console.log(`🧠 Total Comprehension Questions: ${totalCount.rows[0].total_questions}\n`);

  } catch (err) {
    console.error('❌ Error seeding stories library:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedStoryLibrary();
