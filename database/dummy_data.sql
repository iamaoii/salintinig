-- Clear existing data (reset database)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE story_assignments;
TRUNCATE TABLE student_achievements;
TRUNCATE TABLE reading_sessions;
TRUNCATE TABLE student_progress;
TRUNCATE TABLE stories;
TRUNCATE TABLE students_account;
TRUNCATE TABLE teachers_account;
SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- 1. Insert Teachers
-- =========================
INSERT INTO teachers_account (full_name, email, password_hash) VALUES 
('Teacher One', 'teacher1@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Teacher Two', 'teacher2@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- =========================
-- 2. Insert Students
-- =========================
INSERT INTO students_account (full_name, email, lrn_number, grade_level, password_hash) VALUES 
('Student One', 'student1@gmail.com', '100000000001', 4, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Student Two', 'student2@gmail.com', '100000000002', 5, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Student Three', 'student3@gmail.com', '100000000003', 6, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Student Four', 'student4@gmail.com', '100000000004', 4, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Student Five', 'student5@gmail.com', '100000000005', 5, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

INSERT INTO student_progress (student_id, total_stars, current_streak, stories_read)
SELECT id, 0, 0, 0 FROM students_account;

-- =========================
-- 3. Insert Stories
-- =========================
INSERT INTO stories (title, description, content, grade_level, language, image_url) VALUES

-- ========= ENGLISH (9) =========
('The Clever Turtle', 'A turtle solves a problem with patience and smart planning.',
'On a sunny morning, Timo the turtle saw a banana plant drifting in the river. “If I can plant it, I can share bananas with everyone,” he thought.\n\nHe tugged the plant onto the shore, but the roots were heavy and messy. A monkey named Miko laughed. “You are slow! I can do it faster,” Miko said.\n\nTimo smiled. “Fast is good, but planning is better. Help me dig a wide hole first.”\n\nMiko wanted bananas too, so he dug quickly. Timo rolled small stones to keep the plant steady. Together, they placed the plant gently into the hole and covered the roots with soft soil.\n\nThe next day, rain came and the river rose. Many plants washed away, but Timo’s stones kept the banana plant safe.\n\nWeeks later, the first bananas grew. Miko cheered. “You were right, Timo. Planning saved our plant!”\n\nTimo shared bananas with the animals and said, “When we think before we act, we succeed.”\n\nMoral: Patience and planning lead to better results.',
4, 'English', 'assets/stories/the_clever_turtle.png'),

('The Space Adventure', 'Three friends learn teamwork on a trip to the stars.',
'Kai, Lila, and Ben built a cardboard rocket for the science fair. Their teacher smiled. “Pretend it’s real. What will you do in space?”\n\nKai grabbed a flashlight. “I’ll be captain!” Lila held a map. “I’ll guide us!” Ben carried snacks. “I’ll keep us energized!”\n\nIn their imagination, the rocket launched—3…2…1—blast off! Stars sparkled outside the window. Suddenly, an alarm beeped.\n\n“Our oxygen is low!” Kai said.\n\nLila stayed calm. “Check the air filter.”\n\nBen found a loose pipe and taped it tight. The beeping stopped.\n\nThey landed safely on the moon and planted a tiny flag that read: TEAMWORK.\n\nBack in class, they presented their project. “We learned that every role matters,” Kai said.\n\nTheir classmates clapped, and the teacher nodded proudly.\n\nMoral: Working together makes hard tasks easier.',
5, 'English', 'assets/stories/the_space_adventure.png'),

('The Mystery of the Old House', 'Kids discover that curiosity and kindness beat fear.',
'At the edge of town stood an old house with squeaky windows. People whispered, “It’s spooky.”\n\nTom and Jerry (best friends) didn’t want to believe rumors. One afternoon, they walked up the path with a flashlight and a notebook.\n\nInside, the floor creaked. A shadow moved behind a curtain. Tom gulped. Jerry whispered, “Let’s be brave—but careful.”\n\nThey followed a soft “meow.” Behind a box, they found a skinny cat and three kittens.\n\n“The shadow was just the cat!” Tom laughed, relieved.\n\nThe boys brought water and some bread. They opened a window so fresh air could enter. The next day, they returned with a neighbor who helped find homes for the kittens.\n\nSoon, the old house wasn’t “spooky” anymore. It was just quiet and lonely.\n\nMoral: Don’t fear rumors—look for the truth with kindness.',
6, 'English', 'assets/stories/the_mystery_old_house.png'),

('The Lost Pencil', 'A student learns responsibility and calm problem-solving.',
'Mia loved her yellow pencil with a tiny star sticker. During Math, she wrote neatly and felt proud.\n\nAfter recess, she opened her pencil case. The pencil was gone.\n\nHer heart thumped. “Don’t panic,” she told herself. She checked her desk, her bag, and the floor. Nothing.\n\nMia borrowed a pencil and finished her work. After class, she retraced her steps: the hallway, the reading corner, the playground.\n\nNear the bookshelf, she spotted a small yellow sparkle. Her pencil! It had rolled under a low shelf.\n\nMia thanked herself for staying calm. At home, she added a label to her pencil case: CHECK BEFORE YOU LEAVE.\n\nMoral: Staying calm helps you solve problems faster.',
4, 'English', 'assets/stories/the_lost_pencil.png'),

('The Kindness Jar', 'A classroom discovers how small kindness becomes a big change.',
'Ms. Rivera placed an empty jar on her desk. “This is our Kindness Jar,” she said. “Write kind actions on paper and drop them in.”\n\nAt first, only two notes appeared. Then Carlo picked up spilled crayons—note. Liza shared her snack—note. Jana helped a classmate understand a math problem—note.\n\nSoon, the jar filled quickly.\n\nOne rainy day, the hallway was slippery. A student nearly fell, but two classmates held out their hands.\n\nAt the end of the month, Ms. Rivera read the notes aloud. The room felt warm and bright. “Kindness is like sunlight,” she said. “It helps everyone grow.”\n\nMoral: Small kind actions can change a whole community.',
4, 'English', 'assets/stories/the_kindness_jar.png'),

('The Brave Little Kite', 'A kite learns confidence by trusting the wind.',
'Piko the kite was new and small. On the field, bigger kites flew high and danced in the sky.\n\n“I’m too little,” Piko worried.\n\nA gentle wind whispered, “Try. I will lift you.”\n\nPiko’s string tightened. He rose a little—then dipped.\n\n“Hold steady!” the child below said.\n\nPiko took a deep breath (as much as a kite can) and leaned into the wind. Up he went—higher than he ever imagined!\n\nThe bigger kites waved. “Welcome!”\n\nThat day, Piko learned that bravery isn’t being the biggest. It’s trying even when you’re nervous.\n\nMoral: Believe in yourself and keep trying.',
4, 'English', 'assets/stories/the_brave_little_kite.png'),

('Teamwork on the Field', 'A team wins by supporting each other, not by showing off.',
'During the school sports day, Team Blue wanted to win badly. Leo tried to dribble the ball alone.\n\nBut every time he rushed, the other team stole the ball.\n\nCoach Lina called time-out. “Passing is not weakness,” she said. “It’s trust.”\n\nLeo nodded. He passed to Mia. Mia passed to Jay. Jay passed back to Leo—now free.\n\nGoal!\n\nTeam Blue cheered, not because Leo scored, but because everyone helped.\n\nAfter the game, Leo said, “I learned the best wins are shared.”\n\nMoral: Teamwork is stronger than showing off.',
5, 'English', 'assets/stories/teamwork_on_the_field.png'),

('The Helpful Robot', 'A robot learns that helping means understanding people.',
'Mr. Cruz built a robot named Rono to help in class. Rono could carry books, clean the board, and organize papers.\n\nOne day, Rono noticed Ella looking sad. He scanned his checklist. “Task not found,” he said.\n\nElla whispered, “I’m nervous about reading aloud.”\n\nRono paused. Then he sat beside her and said, “We can practice together.” He pointed to a short paragraph and timed her gently.\n\nElla improved and smiled. “Thank you, Rono.”\n\nRono added a new rule to his memory: Helping is not only doing chores—it is giving support.\n\nMoral: True help includes kindness and understanding.',
6, 'English', 'assets/stories/the_helpful_robot.png'),

('The Mountain Hike', 'Students learn perseverance one step at a time.',
'The class planned a small mountain hike. At the start, everyone felt excited.\n\nHalfway up, the trail became steep. Paolo sighed, “My legs are tired.”\n\nTheir teacher said, “Let’s take small steps. Rest, breathe, and continue.”\n\nThe group shared water and encouraged each other. “You can do it!” they cheered.\n\nAt the top, the view was wide and beautiful. Paolo smiled. “I almost quit,” he admitted.\n\nHis friend said, “But you didn’t.”\n\nMoral: Perseverance turns hard work into achievement.',
6, 'English', 'assets/stories/the_mountain_hike.png'),

-- ========= FILIPINO (9) =========
('Ang Alamat ng Pinya', 'Isang alamat tungkol sa pagsisikap at pagkatuto.',
'Noong unang panahon, may batang si Pina na laging umaasa sa kanyang ina. Kapag may hinahanap siya, lagi niyang sinasabi, “Nanay, nasaan?”\n\nIsang araw, napagod ang kanyang ina at sinabi, “Sana magkaroon ka ng maraming mata para makita mo ang mga bagay.”\n\nKinabukasan, nawala si Pina. Sa kanilang bakuran, tumubo ang isang prutas na may maraming “mata.” Ito ang pinya.\n\nNatutunan ng mga tao ang aral: mas mabuting matutong magsikap at maging mapagmasid.\n\nAral: Maging responsable at matutong tumulong sa sarili.',
4, 'Filipino', 'assets/stories/alamat_ng_pinya.png'),

('Si Pagong at si Matsing', 'Isang pabula tungkol sa pagiging tapat at patas.',
'Isang araw, nakakita sina Pagong at Matsing ng punong saging na palutang-lutang sa ilog. Pareho nilang gusto ang prutas.\n\n“Paghatian natin,” sabi ni Pagong.\n\nNgunit dinaya ni Matsing si Pagong. Kinuha niya ang bahaging may bunga at iniwan kay Pagong ang bahaging walang laman.\n\nLumipas ang mga araw, namunga ang saging. Dahil mataas ang puno, hindi ito maabot ni Pagong. Umakyat si Matsing, ngunit nadulas siya sa balat ng saging at nahulog.\n\nTinulungan pa rin siya ni Pagong. Napahiya si Matsing at humingi ng tawad.\n\nAral: Ang panlilinlang ay bumabalik, at ang kabutihan ay mas mahalaga.',
5, 'Filipino', 'assets/stories/si_pagong_at_si_matsing.png'),

('Ang Huling Higante', 'Isang kuwento tungkol sa kabaitan at pagtanggap.',
'Sa malayong lupain, may huling higante na si Hagan. Malaki siya, kaya natatakot ang mga tao.\n\nIsang araw, bumaha. Naiwan sa gitna ng ilog ang isang bata. Walang gustong tumulong dahil malakas ang agos.\n\nTumayo si Hagan sa tubig at ginawang tulay ang kanyang mga braso. Ligtas na nakatawid ang bata.\n\nDoon napagtanto ng mga tao: hindi sa laki nasusukat ang puso.\n\nAral: Huwag manghusga agad—kilalanin muna ang pagkatao.',
6, 'Filipino', 'assets/stories/ang_huling_higante.png'),

('Ang Nawawalang Aklat', 'Aral sa pag-iingat at pananagutan.',
'Si Nica ay humiram ng aklat sa aklatan. “Iingatan ko po,” pangako niya.\n\nNgunit pag-uwi, naiwan niya ito sa jeep. Kinabukasan, nag-alala siya.\n\nSa halip na magtago, sinabi niya ang totoo sa guro. Tinulungan siyang magtanong sa terminal.\n\nMaya-maya, may isang drayber na nagbalik ng aklat. “May pangalan, kaya naibalik,” sabi nito.\n\nNagpasalamat si Nica at natutong maging mas maingat.\n\nAral: Ang katapatan at pananagutan ay mahalaga.',
4, 'Filipino', 'assets/stories/ang_nawawalang_aklat.png'),

('Ang Banga ng Kabutihan', 'Kabutihan na nakakahawa sa buong klase.',
'Naglagay ang guro ng isang banga sa mesa. “Tuwing may kabutihang gagawin, isulat at ilagay dito,” sabi niya.\n\nMay nagbahagi ng lapis, may tumulong magbitbit ng libro, may nagpaalala ng takdang-aralin.\n\nUnti-unting napuno ang banga. Isang araw, binasa ng guro ang mga papel. Napangiti ang lahat.\n\n“Kapag mabuti ang puso, gumagaan ang araw,” sabi niya.\n\nAral: Maliit man o malaki, mahalaga ang kabutihan.',
4, 'Filipino', 'assets/stories/ang_banga_ng_kabutihan.png'),

('Ang Munting Saranggola', 'Tapang at tiwala sa sarili.',
'May munting saranggola na takot lumipad. “Baka mahulog ako,” sabi niya.\n\nNgunit sinabi ng hangin, “Kaya mo ‘yan.”\n\nHinawakan ng batang may-ari ang pisi nang maigi. Dahan-dahang umangat ang saranggola.\n\nNoong una, nanginginig siya. Pero nang makakita siya ng mga ulap, napangiti siya.\n\n“Hindi pala masama ang subukan,” wika niya.\n\nAral: Ang tapang ay nagsisimula sa pagsubok.',
4, 'Filipino', 'assets/stories/ang_munting_saranggola.png'),

('Sama-samang Tagumpay', 'Isang koponan ang nanalo dahil sa pagtutulungan.',
'Sa sports fest, gustong-gusto ni Marco na siya ang laging mag-score. Ngunit lagi silang natatalo.\n\nTinawag sila ng coach. “Magpasa kayo. Magtiwala sa isa’t isa,” sabi niya.\n\nSa susunod na laro, nagpasahan sila nang maayos. Nakakuha sila ng pagkakataon at nakapuntos.\n\nNanalo sila at nagyakapan. “Mas masaya pala kapag sama-sama,” sabi ni Marco.\n\nAral: Ang tagumpay ay mas matamis kapag pinaghirapan ng lahat.',
5, 'Filipino', 'assets/stories/sama_samang_tagumpay.png'),

('Ang Mabait na Robot', 'Isang robot ang natutong umunawa at umalalay.',
'Gumawa si G. Reyes ng robot na si Riko para tumulong sa klase. Marunong siyang maglinis at mag-ayos ng papel.\n\nIsang araw, napansin ni Riko na malungkot si Ana. “Walang task,” sabi ng kanyang system.\n\nSabi ni Ana, “Kinakabahan ako magbasa sa harap.”\n\nUmupo si Riko sa tabi niya. “Magpraktis tayo,” sabi niya.\n\nPagkatapos, mas malinaw na nagbasa si Ana at napangiti.\n\nAral: Ang tunay na tulong ay may kasamang malasakit.',
6, 'Filipino', 'assets/stories/ang_mabait_na_robot.png'),

('Pag-akyat sa Bundok', 'Tiyaga at lakas ng loob ang susi sa tagumpay.',
'Nag-hike ang klase sa isang maliit na bundok. Masaya sila sa umpisa.\n\nNgunit nang tumarik ang daan, napagod si Paulo. “Hindi ko na kaya,” sabi niya.\n\nSabi ng guro, “Dahan-dahan. Pahinga, hinga, tuloy.”\n\nNagbahagi sila ng tubig at nagpalakasan ng loob.\n\nSa tuktok, nakita nila ang magandang tanawin. Ngumiti si Paulo. “Buti hindi ako sumuko.”\n\nAral: Ang tiyaga ay nagdadala sa tagumpay.',
6, 'Filipino', 'assets/stories/pag_akyat_sa_bundok.png');

-- =========================
-- 4. Insert Reading Sessions (History)
-- =========================
INSERT INTO reading_sessions (student_id, story_id, stars_earned, words_per_minute, started_at, completed_at) VALUES 
(1, 1, 3, 120, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 2, 2, 110, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 3, 3, 130, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 2, 3, 140, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

-- =========================
-- 5. Update Student Progress base on sessions
-- =========================
UPDATE student_progress SET 
    total_stars = 8, 
    current_streak = 2, 
    stories_read = 3,
    total_reading_time = 45 
WHERE student_id = 1;

UPDATE student_progress SET 
    total_stars = 3, 
    current_streak = 1, 
    stories_read = 1,
    total_reading_time = 15 
WHERE student_id = 2;

-- =========================
-- 6. Assignments
-- =========================
INSERT INTO story_assignments (story_id, teacher_id, student_id, due_date) VALUES 
(4, 1, 1, DATE_ADD(NOW(), INTERVAL 7 DAY)),
(5, 1, 2, DATE_ADD(NOW(), INTERVAL 5 DAY)),
(1, 1, 3, DATE_ADD(NOW(), INTERVAL 3 DAY));

-- =========================
-- 7. Unlocked Achievements
-- =========================
INSERT INTO student_achievements (student_id, achievement_id) VALUES 
(1, 1);
