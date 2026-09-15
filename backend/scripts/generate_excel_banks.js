const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const { sentenceBankData } = require('./seed_sentence_bank');
const { vocabularyBankData } = require('./seed_vocabulary_bank');

// Root destination directory (or user workspace root)
const outputDir = path.join(__dirname, '../../'); // Root folder of salintinig

// Helper to format difficulty display
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Styling definitions
const headerStyle = {
  font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } },
  alignment: { vertical: 'middle', horizontal: 'center' },
  border: {
    top: { style: 'thin', color: { argb: 'D9D9D9' } },
    left: { style: 'thin', color: { argb: 'D9D9D9' } },
    bottom: { style: 'medium', color: { argb: '1F4E78' } },
    right: { style: 'thin', color: { argb: 'D9D9D9' } },
  },
};

const cellBorder = {
  top: { style: 'thin', color: { argb: 'E0E0E0' } },
  left: { style: 'thin', color: { argb: 'E0E0E0' } },
  bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
  right: { style: 'thin', color: { argb: 'E0E0E0' } },
};

function autoFitColumns(worksheet, maxColWidths = {}) {
  worksheet.columns.forEach((column, colIdx) => {
    let maxLen = 12;
    column.eachCell({ includeEmpty: false }, (cell) => {
      const valStr = cell.value ? cell.value.toString() : '';
      if (valStr.length > maxLen) {
        maxLen = valStr.length;
      }
    });
    const colName = column.key;
    const cappedWidth = maxColWidths[colName] ? Math.min(maxLen + 4, maxColWidths[colName]) : Math.min(maxLen + 4, 60);
    column.width = Math.max(cappedWidth, 12);
  });
}

// ============================================================================
// 1. GENERATE SENTENCE BANK EXCEL
// ============================================================================
async function createSentenceBankExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SalinTinig';
  workbook.lastModifiedBy = 'SalinTinig';
  workbook.created = new Date();

  const primaryHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0D5C75' } };
  const evenRowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F4F9FA' } };

  const columnsConfig = [
    { header: '#', key: 'id', width: 8 },
    { header: 'Difficulty', key: 'difficulty', width: 14 },
    { header: 'Filipino Sentence (Pangungusap)', key: 'text_fil', width: 45 },
    { header: 'English Translation', key: 'text_eng', width: 45 },
  ];

  function addSentenceSheet(sheetName, data) {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columnsConfig;

    // Format Header Row
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = primaryHeaderFill;
      cell.font = headerStyle.font;
      cell.alignment = headerStyle.alignment;
      cell.border = headerStyle.border;
    });

    // Add Data Rows
    data.forEach((item, index) => {
      const row = sheet.addRow({
        id: index + 1,
        difficulty: capitalize(item.difficulty),
        text_fil: item.text_fil,
        text_eng: item.text_eng,
      });

      row.height = 22;

      // Styling cells
      row.eachCell((cell, colNumber) => {
        cell.border = cellBorder;
        cell.font = { name: 'Calibri', size: 11 };

        if (index % 2 === 1) {
          cell.fill = evenRowFill;
        }

        if (colNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 2) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (item.difficulty === 'easy') {
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: '1E7E34' } };
          } else if (item.difficulty === 'medium') {
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'D97706' } };
          } else if (item.difficulty === 'hard') {
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'DC2626' } };
          }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        }
      });
    });

    autoFitColumns(sheet, { text_fil: 50, text_eng: 50 });
  }

  // Add worksheets
  addSentenceSheet('All Sentences', sentenceBankData);
  addSentenceSheet('Easy', sentenceBankData.filter(s => s.difficulty === 'easy'));
  addSentenceSheet('Medium', sentenceBankData.filter(s => s.difficulty === 'medium'));
  addSentenceSheet('Hard', sentenceBankData.filter(s => s.difficulty === 'hard'));

  const filePath = path.join(outputDir, 'Sentence_Bank.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log(`✅ Sentence Bank Excel created successfully at: ${filePath}`);
  return filePath;
}

// Helpers for language formatting and filtering
function getLanguageName(lang) {
  if (!lang) return '';
  const l = lang.toLowerCase();
  if (l === 'fil' || l === 'tl' || l === 'tagalog' || l === 'filipino') return 'Filipino';
  if (l === 'en' || l === 'eng' || l === 'english') return 'English';
  return capitalize(lang);
}

function isFilipino(lang) {
  if (!lang) return false;
  const l = lang.toLowerCase();
  return l === 'fil' || l === 'tl' || l === 'tagalog' || l === 'filipino';
}

function isEnglish(lang) {
  if (!lang) return false;
  const l = lang.toLowerCase();
  return l === 'en' || l === 'eng' || l === 'english';
}

// ============================================================================
// 2. GENERATE VOCABULARY BANK EXCEL
// ============================================================================
async function createVocabularyBankExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SalinTinig';
  workbook.lastModifiedBy = 'SalinTinig';
  workbook.created = new Date();

  const primaryHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B365D' } };
  const evenRowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F4F8' } };

  const columnsConfig = [
    { header: '#', key: 'id', width: 8 },
    { header: 'Language', key: 'language', width: 14 },
    { header: 'Word (Salita)', key: 'word', width: 22 },
    { header: 'Translation (Salin)', key: 'translation', width: 22 },
    { header: 'Syllables (Pantig)', key: 'syllables', width: 20 },
    { header: 'Difficulty', key: 'difficulty', width: 14 },
    { header: 'Definition (Kahulugan)', key: 'definition', width: 50 },
    { header: 'Example Sentence (Halimbawa)', key: 'example_sentence', width: 50 },
  ];

  function addVocabSheet(sheetName, data) {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columnsConfig;

    // Format Header Row
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = primaryHeaderFill;
      cell.font = headerStyle.font;
      cell.alignment = headerStyle.alignment;
      cell.border = headerStyle.border;
    });

    // Add Data Rows
    data.forEach((item, index) => {
      const syllablesStr = Array.isArray(item.syllables) ? item.syllables.join('-') : (item.syllables || '');
      const langStr = getLanguageName(item.language);

      const row = sheet.addRow({
        id: index + 1,
        language: langStr,
        word: item.word,
        translation: item.translation,
        syllables: syllablesStr,
        difficulty: capitalize(item.difficulty),
        definition: item.definition || '',
        example_sentence: item.example_sentence || '',
      });

      row.height = 24;

      // Styling cells
      row.eachCell((cell, colNumber) => {
        cell.border = cellBorder;
        cell.font = { name: 'Calibri', size: 11 };

        if (index % 2 === 1) {
          cell.fill = evenRowFill;
        }

        if (colNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 2) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.font = { name: 'Calibri', size: 11, bold: true };
        } else if (colNumber === 3) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: '0F4C81' } };
        } else if (colNumber === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (item.difficulty === 'easy') {
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: '1E7E34' } };
          } else if (item.difficulty === 'medium') {
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'D97706' } };
          } else if (item.difficulty === 'hard') {
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'DC2626' } };
          }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        }
      });
    });

    autoFitColumns(sheet, { definition: 55, example_sentence: 55 });
  }

  // Add worksheets
  addVocabSheet('All Vocabulary', vocabularyBankData);
  addVocabSheet('Filipino Words', vocabularyBankData.filter(v => isFilipino(v.language)));
  addVocabSheet('English Words', vocabularyBankData.filter(v => isEnglish(v.language)));
  addVocabSheet('Easy', vocabularyBankData.filter(v => v.difficulty === 'easy'));
  addVocabSheet('Medium', vocabularyBankData.filter(v => v.difficulty === 'medium'));
  addVocabSheet('Hard', vocabularyBankData.filter(v => v.difficulty === 'hard'));

  const filePath = path.join(outputDir, 'Vocabulary_Bank.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log(`✅ Vocabulary Bank Excel created successfully at: ${filePath}`);
  return filePath;
}


async function main() {
  try {
    console.log('🚀 Starting Excel Generation...');
    const sentenceFile = await createSentenceBankExcel();
    const vocabFile = await createVocabularyBankExcel();
    console.log('\n🎉 ALL EXCEL FILES CREATED SUCCESSFULLY!');
    console.log(`1. Sentence Bank: ${sentenceFile}`);
    console.log(`2. Vocabulary Bank: ${vocabFile}`);
  } catch (err) {
    console.error('❌ Excel Generation Failed:', err);
    process.exit(1);
  }
}

main();
