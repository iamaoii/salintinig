-- =============================================================================
-- DepEd Phil-IRI Official Passages & Question Bank Seed File
-- Full Coverage: Grade 4, Grade 5, Grade 6 | Sets A, B, C, D | Pre-Test & Post-Test
-- (Execute in Supabase / PostgreSQL SQL Editor)
-- =============================================================================

-- Grade 4 Filipino Oral Reading - Set A (Pre-Test)
INSERT INTO reading_materials (title, description, content_text, language, difficulty_level, category, material_type, grade_level_target, status) 
VALUES ('Si Jamil at ang Ramadan', 'DepEd Phil-IRI Grade 4 Set A Pre-Test Passage', 'Isang umaga, masayang sumalubong si Jamil sa kanyang Tito Abdul. Dumating ang kanyang tiyuhin mula sa Lungsod ng Cotabato upang makisali sa pag-aayuno sa nalalapit na Ramadan. Ang Ramadan ay ang ikasiyam na buwan sa kalendaryong Islam kung saan ang mga Muslim ay nag-aayuno mula sa pagsikat hanggang sa paglubog ng araw. Sa panahong ito, mas pinalalalim ng mga Muslim ang kanilang pananampalataya, pagdarasal, at pagtulong sa kapwa. Binigyan ni Tito Abdul si Jamil ng bagong kopya ng banal na aklat na Koran. Nangako si Jamil na mag-aaral siyang mabuti at magiging mabuting batang Muslim araw-araw.', 'fil', 'Easy', 'Phil-IRI Oral', 'Set A', 'Grade 4', 'active') ON CONFLICT DO NOTHING;

-- Grade 4 Filipino Silent Reading - Set B (Pre-Test)
INSERT INTO reading_materials (title, description, content_text, language, difficulty_level, category, material_type, grade_level_target, status) 
VALUES ('Ang Halamanang Kawayan', 'DepEd Phil-IRI Grade 4 Set B Pre-Test Passage', 'Sa tabing-ilog ng nayon nina Mateo, may malawak na taniman ng kawayan. Ang kawayan ay isa sa pinakamahalagang halaman sa Pilipinas dahil marami itong gamit. Ginagamit ito sa paggawa ng bahay-kubo, muwebles, at maging ng mga instrumentong pangmusika tulad ng organong kawayan sa Las Piñas. Bukod dito, ang kawayan ay matatag laban sa malalakas na hangin at bagyo dahil ito ay yumuyukod ngunit hindi nababali. Nagbibigay rin ang kawayan ng masarap na labong na ginagawang ulam. Nangako ang mga mamamayan na aalagaan ang taniman upang manatiling berde ang kanilang pamayanan.', 'fil', 'Easy', 'Phil-IRI Silent', 'Set B', 'Grade 4', 'active') ON CONFLICT DO NOTHING;

-- Grade 4 Filipino Listening - Set C (Pre-Test)
INSERT INTO reading_materials (title, description, content_text, language, difficulty_level, category, material_type, grade_level_target, status) 
VALUES ('Ang Alitaptap at ang Bulaklak', 'DepEd Phil-IRI Grade 4 Set C Pre-Test Passage', 'Gabi-gabi, lumilipad ang maliit na alitaptap na si Alingaw sa paligid ng samyo ng mga bulaklak sa hardin. Si Alingaw ay may taglay na nagniningning na liwanag sa kanyang tiyan. Ginamit niya ang kanyang liwanag upang gabayan ang maliliit na langgam na nawawala sa dilim pauwi sa kanilang pugad. Isang gabi, pinasalamatan siya ng haring langgam at binigyan ng matamis na nektar mula sa pinakamagandang sampaguita.', 'fil', 'Easy', 'Phil-IRI Listening', 'Set C', 'Grade 4', 'active') ON CONFLICT DO NOTHING;

-- Grade 4 Filipino Oral Reading - Set D (Pre-Test)
INSERT INTO reading_materials (title, description, content_text, language, difficulty_level, category, material_type, grade_level_target, status) 
VALUES ('Ang Masipag na Mangingisda', 'DepEd Phil-IRI Grade 4 Set D Pre-Test Passage', 'Maagang gumigising si Mang Mario upang pumalaot sa dagat bago pa sumikat ang araw. Dala ang kanyang lambat at bangka, maingat niyang iniiwasan ang paggamit ng maliliit na lambat at dinamita upang hindi masira ang mga coral reef at maliliit na isda. Naniniwala si Mang Mario na kapag inalagaan ang dagat, patuloy itong magbibigay ng masaganang huli para sa kanyang pamilya at buong nayon.', 'fil', 'Easy', 'Phil-IRI Oral', 'Set D', 'Grade 4', 'active') ON CONFLICT DO NOTHING;

-- Grade 5 Filipino Oral Reading - Set A (Pre-Test)
INSERT INTO reading_materials (title, description, content_text, language, difficulty_level, category, material_type, grade_level_target, status) 
VALUES ('Ang Agila ng Pilipinas', 'DepEd Phil-IRI Grade 5 Set A Pre-Test Passage', 'Ang Agila ng Pilipinas ay ang Pambansang Ibon ng ating bansa. Ito ay isa sa pinakamalaki at pinakamakapangyarihang ibon sa buong mundo. Matatagpuan ang mga agilang ito sa mga kagubatan ng Luzon, Samar, Leyte, at Mindanao, partikular sa palibot ng Bundok Apo. Ang agila ay kumakain ng mga unggoy, malalaking ibon, at iba pang maliliit na hayop. Sa kasamaang palad, ang mga agila ay nanganganib nang maubos o maging endangered dahil sa pagkasira ng kanilang tirahan at ilegal na pangangaso.', 'fil', 'Medium', 'Phil-IRI Oral', 'Set A', 'Grade 5', 'active') ON CONFLICT DO NOTHING;

-- Grade 5 Filipino Silent Reading - Set B (Pre-Test)
INSERT INTO reading_materials (title, description, content_text, language, difficulty_level, category, material_type, grade_level_target, status) 
VALUES ('Ang Banaue Rice Terraces', 'DepEd Phil-IRI Grade 5 Set B Pre-Test Passage', 'Ang Hagdan-hagdang Palayan sa Banaue, Ifugao ay isa sa mga itinuturing na UNESCO World Heritage Site. Ginawa ito ng ating mga ninuno dalawang libong taon na ang nakararaan gamit lamang ang kanilang mga kamay at simpleng kagamitan. Inukit nila ang gilid ng mga bundok upang makagawa ng hagdan-hagdang taniman ng palay na may likas na sistema ng patubig mula sa kagubatan sa itaas.', 'fil', 'Medium', 'Phil-IRI Silent', 'Set B', 'Grade 5', 'active') ON CONFLICT DO NOTHING;

-- Grade 6 Filipino Oral Reading - Set A (Pre-Test)
INSERT INTO reading_materials (title, description, content_text, language, difficulty_level, category, material_type, grade_level_target, status) 
VALUES ('Ang Mangrove Forest sa Palawan', 'DepEd Phil-IRI Grade 6 Set A Pre-Test Passage', 'Ang mga bakawan o mangrove sa lalawigan ng Palawan ay nagsisilbing natural na bentilador at harang ng baybayin laban sa malalakas na hampas ng alon at bagyo. Ang mga ugat ng bakawan ay nagsisilbing tirahan at paitlogan ng iba''t ibang uri ng isda, alimango, at hipon. Bukod dito, ang mga kagubatang bakawan ay sumisipsip ng malaking dami ng carbon dioxide mula sa hangin, kaya nakakatulong ito sa paglaban sa climate change.', 'fil', 'Hard', 'Phil-IRI Oral', 'Set A', 'Grade 6', 'active') ON CONFLICT DO NOTHING;

-- Grade 6 Filipino Silent Reading - Set B (Pre-Test)
INSERT INTO reading_materials (title, description, content_text, language, difficulty_level, category, material_type, grade_level_target, status) 
VALUES ('Ang Tubbataha Reefs Natural Park', 'DepEd Phil-IRI Grade 6 Set B Pre-Test Passage', 'Ang Tubbataha Reefs Natural Park sa Dagat Sulu ay itinuturing na isa sa pinakamagagandang coral reef sanctuary sa buong mundo. Sa lawak nitong humigit-kumulang 97,030 ektarya, tahanan ito ng higit anim na daang uri ng isda, tatlong daang uri ng prusisyon ng koral, at iba''t ibang uri ng pating at pawikan. Dahil sa pambihirang biodiversidad nito, striktong ipinagbabawal ang pangingisda at pag-aalis ng anumang koral.', 'fil', 'Hard', 'Phil-IRI Silent', 'Set B', 'Grade 6', 'active') ON CONFLICT DO NOTHING;
