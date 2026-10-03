/**
 * Curated Filipino Vocabulary Lexicon for Oral Reading Miscue Engine
 *
 * Distinguishes between:
 * 1. Substitution (student reads a DIFFERENT real, valid Filipino dictionary word)
 * 2. Mispronunciation (student produces an acoustic distortion or non-word)
 */

const FILIPINO_LEXICON = new Set([
  // Common animals & nature
  'aso', 'pusa', 'ibon', 'isda', 'baka', 'kalabaw', 'kambing', 'baboy', 'manok', 'bibe',
  'palaka', 'buwaya', 'daga', 'tupa', 'kabayo', 'elepante', 'leon', 'tigre', 'ahas', 'pagong',
  'lawa', 'ilog', 'sapa', 'dagat', 'burol', 'bundok', 'kapatagan', 'parang', 'gubat', 'bakuran',
  'puno', 'dahon', 'bulaklak', 'ugat', 'sangay', 'damo', 'halaman', 'araw', 'gabi', 'buwan', 'bituin',
  'hangin', 'ulan', 'bagyo', 'tubig', 'apoy', 'lupa', 'putik', 'bato', 'buhangin', 'langit',

  // People, family, professions
  'bata', 'matanda', 'lalaki', 'babae', 'tatay', 'nanay', 'ina', 'ama', 'kuya', 'ate',
  'bunso', 'lolo', 'lola', 'tiyo', 'tiya', 'tito', 'tita', 'pinsan', 'pamangkin', 'kapatid',
  'magulang', 'anak', 'guro', 'titser', 'doktor', 'nars', 'pulis', 'bumbero', 'drayber', 'karpintero',
  'panadero', 'dentista', 'abogado', 'inhinyero', 'magsasaka', 'mangingisda', 'tindero', 'sundalo',
  'kaibigan', 'kaklase', 'kapitbahay', 'tao', 'mamamayan', 'pangulo', 'alkalde',

  // Household, objects, clothing, vehicles, places
  'bahay', 'kubo', 'tahanan', 'silid', 'pinto', 'bintana', 'dingding', 'bubong', 'sahig', 'hagdan',
  'mesa', 'silya', 'upuan', 'kama', 'unan', 'kumot', 'kutsara', 'tinidor', 'plato', 'pinggan',
  'baso', 'tasa', 'sandok', 'kaldero', 'kawali', 'kalan', 'walis', 'basurahan', 'sako', 'kahon',
  'aklat', 'libro', 'kuwaderno', 'papel', 'lapis', 'ballpen', 'pambura', 'gunting', 'bag',
  'damit', 'baro', 'pantalon', 'palda', 'kamiseta', 'sapatos', 'tsinelas', 'medyas', 'sombrero',
  'orasan', 'relo', 'salamin', 'suklay', 'sabon', 'tuwalya', 'payong', 'pera', 'barya',
  'paaralan', 'simbahan', 'ospital', 'palengke', 'tindahan', 'munisipyo',
  'kotse', 'dyip', 'bus', 'trak', 'motor', 'bisikleta', 'bangka', 'barko', 'eroplano', 'tren',

  // Food, fruits, vegetables
  'kanin', 'tinapay', 'kape', 'gatas', 'asukal', 'asin', 'karne', 'itlog', 'keso', 'pansit',
  'prutas', 'gulay', 'mansanas', 'saging', 'mangga', 'papaya', 'kamatis', 'kamote', 'mani',
  'singkamas', 'talong', 'sigarilyas', 'sitaw', 'bataw', 'patani', 'kundol', 'patola', 'upo',
  'kalabasa', 'labanos', 'mustasa', 'sibuyas', 'bawang', 'luya', 'linga',

  // Common verbs
  'kumain', 'uminom', 'tumakbo', 'lumakad', 'naglakad', 'nagbasa', 'sumulat', 'gumuhit', 'pumasok',
  'lumabas', 'umalis', 'dumating', 'nagsalita', 'nakinig', 'tumingin', 'nakita', 'narinig', 'tumawa',
  'umiyak', 'nagluto', 'naglaba', 'naglaro', 'sumayaw', 'nagsayaw', 'kumanta', 'natulog', 'gumising', 'tumayo',
  'umupo', 'humawak', 'pumunta', 'umuwi', 'nag-aral', 'nagturo', 'lumipad', 'lumangoy',

  // Common adjectives & descriptors
  'masaya', 'malungkot', 'galit', 'takot', 'malaki', 'maliit', 'mataas', 'mababa', 'mahaba',
  'maikli', 'mataba', 'payat', 'mabilis', 'mabagal', 'malakas', 'mahina', 'mainit', 'malamig',
  'malinis', 'marumi', 'madumi', 'bago', 'luma', 'maganda', 'pangit', 'masipag', 'tamad',
  'mabait', 'matalino', 'magalang', 'tahimik', 'maingay', 'masarap', 'mapait', 'matamis', 'maasim',
  'maalat', 'tuyo', 'basa', 'matigas', 'malambot', 'maliwanag', 'madilim', 'pula', 'puti', 'itim',
  'dilaw', 'berde', 'asul', 'lila', 'kahel',

  // Minimal pair roots for disambiguation
  'bala', 'pala', 'siko', 'mali', 'sama', 'toto', 'lita', 'dana', 'pati', 'hata', 'dilis',
  'dalas', 'sapa', 'bata', 'baka', 'sako', 'mani', 'lobo', 'daga'
]);

function isKnownFilipinoWord(word) {
  if (!word || typeof word !== 'string') return false;
  const clean = word.toLowerCase().replace(/[^\wñáéíóú]/gi, '').trim();
  return FILIPINO_LEXICON.has(clean);
}

module.exports = {
  FILIPINO_LEXICON,
  isKnownFilipinoWord
};
