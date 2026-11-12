const fs = require('fs');

const listeningData = [
  {
    num: 1,
    topics: ['Campsites', 'Business Leadership (Arthur)', 'Dolphin Presentation', 'Recycling Tyres in Australia'],
    file: 'Full Listening, Volume 5, Test 01 [safarov_english].html'
  },
  {
    num: 2,
    topics: ['Oz Housesitters', 'Becoming a Millionaire', 'Science Experiments', 'Office Design'],
    file: 'Full Listening, Volume 5, Test 02 [safarov_english].html'
  },
  {
    num: 3,
    topics: ['Sailing Courses', 'Stanley Island', 'Research on Absence from Work', 'Transhumance'],
    file: 'Full Listening, Volume 5, Test 03 [safarov_english].html'
  },
  {
    num: 4,
    topics: ['Bakewell Travel', 'Creton Running Competition', 'Selective Courses', 'Boar and Red Deer'],
    file: 'Full Listening, Volume 5, Test 04 [safarov_english].html'
  },
  {
    num: 5,
    topics: ['Swimming Lessons', 'Campus Orientation & Dormitories', 'Internship Options', 'Economics and Trust'],
    file: 'Full Listening, Volume 5, Test 05 [safarov_english].html'
  },
  {
    num: 6,
    topics: ['Volunteer Work Application', 'Strawberry Farm Talk', "Kathy's Dissertation on Water Pumps", 'American Salt Marshes'],
    file: 'Full Listening, Volume 5, Test 06 [safarov_english].html'
  },
  {
    num: 7,
    topics: ['London Relocation Services', 'Moving Office', "Mona's Presentation", 'Graphical Symbols'],
    file: 'Full Listening, Volume 5, Test 07 [safarov_english].html'
  },
  {
    num: 8,
    topics: ['Eco-farm Tour', 'Muna Island', 'Music in Restaurants', 'Life on the International Space Station'],
    file: 'Full Listening, Volume 5, Test 08 [safarov_english].html'
  },
  {
    num: 9,
    topics: ['Hot Air Balloon Trip', 'Rivermead School', "Professor Smith's Article", 'Technology and Education'],
    file: 'Full Listening, Volume 5, Test 09 [safarov_english].html'
  },
  {
    num: 10,
    topics: ['Morgan Recruitment Agency', 'Barton House', "Tim and Alice's Course", 'Introduction to Taxation'],
    file: 'Full Listening, Volume 5, Test 10 [safarov_english].html'
  }
];

const readingData = [
  {
    num: 1,
    topics: ['The Importance of Business Cards', 'The Importance of Law', 'The Voynich Manuscript'],
    file: 'Full Reading, Volume 5, Test 01.html'
  },
  {
    num: 2,
    topics: ["A survivor's story", 'Ideal Homes', 'Conformity'],
    file: 'Full Reading, Volume 5, Test 02.html'
  },
  {
    num: 3,
    topics: ['Listening to the Ocean', 'Boring buildings', 'Marketing and the information age'],
    file: 'Full Reading, Volume 5, Test 03.html'
  },
  {
    num: 4,
    topics: ['The history of the Pencil', 'What is an unfair advantage in sport?', 'Theories of planet formation questioned'],
    file: 'Full Reading, Volume 5, Test 04.html'
  },
  {
    num: 5,
    topics: ['New perspectives on food production', "Egypt's ancient boat-builders", 'The communication of science'],
    file: 'Full Reading, Volume 5, Test 05.html'
  },
  {
    num: 6,
    topics: ['Starting school later has positive effects on teens', 'Born to trade', 'New Zealand home textile crafts of the 1930s to 1950s'],
    file: 'Full Reading, Volume 5, Test 06.html'
  },
  {
    num: 7,
    topics: ['Computer games', 'Art and engineering', 'Human instinct: evolutionary psychology at work'],
    file: 'Full Reading, Volume 5, Test 07.html'
  },
  {
    num: 8,
    topics: ['The Origin of Paper', 'A new look for Talbot Park', 'The Analysis of Fear'],
    file: 'Full Reading, Volume 5, Test 08.html'
  },
  {
    num: 9,
    topics: ['The Blockbuster Phenomenon: a new museum trend', 'Saving the Bittern', 'The Placebo Effect'],
    file: 'Full Reading, Volume 5, Test 09.html'
  },
  {
    num: 10,
    topics: ['Sorry – who are you?', 'Mammoth Kill', 'Keeping the fun in funfairs'],
    file: 'Full Reading, Volume 5, Test 10.html'
  }
];

let code = `export type TestId =
  | "l-v5-t1"
  | "l-v5-t2"
  | "l-v5-t3"
  | "l-v5-t4"
  | "l-v5-t5"
  | "l-v5-t6"
  | "l-v5-t7"
  | "l-v5-t8"
  | "l-v5-t9"
  | "l-v5-t10"
  | "r-v5-t1"
  | "r-v5-t2"
  | "r-v5-t3"
  | "r-v5-t4"
  | "r-v5-t5"
  | "r-v5-t6"
  | "r-v5-t7"
  | "r-v5-t8"
  | "r-v5-t9"
  | "r-v5-t10"
  | "listening-v5-t09"
  | "reading-v5-t10";

export type ActiveSkill = "listening" | "reading";

export interface TestSectionMeta {
  index: number;
  labelEn: string;
  labelUz: string;
  labelRu: string;
  title: string;
  range: string;
  questionTypesEn: string;
  questionTypesUz: string;
  questionTypesRu: string;
  count: number;
}

export interface OfficialTest {
  id: TestId;
  skill: ActiveSkill;
  volume: string;
  testNumber: string;
  code: string;
  titleEn: string;
  titleUz: string;
  titleRu: string;
  subtitleEn: string;
  subtitleUz: string;
  subtitleRu: string;
  durationMinutes: number;
  extraCheckMinutes?: number;
  questionsCount: number;
  sectionsCount: number;
  formatBadge: string;
  htmlPath: string;
  routePath: string;
  topics: string[];
  sections: TestSectionMeta[];
}

export const OFFICIAL_TESTS: OfficialTest[] = [
`;

// Build 10 Listening tests
listeningData.forEach(d => {
  const pad = String(d.num).padStart(2, '0');
  const id = `l-v5-t${d.num}`;
  code += `  {
    id: "${id}",
    skill: "listening",
    volume: "Volume 5",
    testNumber: "Test ${pad}",
    code: "VOL 5 · TEST ${pad}",
    titleEn: "Full Listening — Volume 5, Test ${pad}",
    titleUz: "Full Listening — Volume 5, Test ${pad}",
    titleRu: "Full Listening — Volume 5, Test ${pad}",
    subtitleEn: "${d.topics.join(' · ')}",
    subtitleUz: "4 qismli haqiqiy CDI audio imtihon: ${d.topics.slice(0, 2).join(', ')}.",
    subtitleRu: "Полный компьютерный тест из 4 аудио-частей: ${d.topics.slice(0, 2).join(', ')}.",
    durationMinutes: 30,
    extraCheckMinutes: 2,
    questionsCount: 40,
    sectionsCount: 4,
    formatBadge: "CDI AUDIO",
    htmlPath: "/mocks/listening/${d.file}",
    routePath: "/test/${id}",
    topics: ${JSON.stringify(d.topics)},
    sections: [
      {
        index: 1,
        labelEn: "Part 1",
        labelUz: "1-qism",
        labelRu: "Часть 1",
        title: ${JSON.stringify(d.topics[0])},
        range: "Q1–10",
        questionTypesEn: "Note Completion & Form Filling",
        questionTypesUz: "Konspekt to'ldirish va forma",
        questionTypesRu: "Заполнение заметок и форм",
        count: 10,
      },
      {
        index: 2,
        labelEn: "Part 2",
        labelUz: "2-qism",
        labelRu: "Часть 2",
        title: ${JSON.stringify(d.topics[1])},
        range: "Q11–20",
        questionTypesEn: "Multiple Choice & Map / Plan Labelling",
        questionTypesUz: "Test savollari va xarita belgilash",
        questionTypesRu: "Множественный выбор и разметка карты",
        count: 10,
      },
      {
        index: 3,
        labelEn: "Part 3",
        labelUz: "3-qism",
        labelRu: "Часть 3",
        title: ${JSON.stringify(d.topics[2])},
        range: "Q21–30",
        questionTypesEn: "Matching & Academic Discussion",
        questionTypesUz: "Moslashtirish va akademik muhokama",
        questionTypesRu: "Сопоставление и обсуждение",
        count: 10,
      },
      {
        index: 4,
        labelEn: "Part 4",
        labelUz: "4-qism",
        labelRu: "Часть 4",
        title: ${JSON.stringify(d.topics[3])},
        range: "Q31–40",
        questionTypesEn: "Academic Monologue Notes (One Word Only)",
        questionTypesUz: "Akademik ma'ruza konspekti (Faqat bir so'z)",
        questionTypesRu: "Конспект академической лекции",
        count: 10,
      },
    ],
  },\n`;
});

// Build 10 Reading tests
readingData.forEach(d => {
  const pad = String(d.num).padStart(2, '0');
  const id = `r-v5-t${d.num}`;
  code += `  {
    id: "${id}",
    skill: "reading",
    volume: "Volume 5",
    testNumber: "Test ${pad}",
    code: "VOL 5 · TEST ${pad}",
    titleEn: "Full Reading — Volume 5, Test ${pad}",
    titleUz: "Full Reading — Volume 5, Test ${pad}",
    titleRu: "Full Reading — Volume 5, Test ${pad}",
    subtitleEn: "${d.topics.join(' · ')}",
    subtitleUz: "3 ta Academic matn: ${d.topics.slice(0, 2).join(', ')}.",
    subtitleRu: "3 академических текста: ${d.topics.slice(0, 2).join(', ')}.",
    durationMinutes: 60,
    questionsCount: 40,
    sectionsCount: 3,
    formatBadge: "ACADEMIC CDI",
    htmlPath: "/mocks/reading/${d.file}",
    routePath: "/test/${id}",
    topics: ${JSON.stringify(d.topics)},
    sections: [
      {
        index: 1,
        labelEn: "Passage 1",
        labelUz: "1-matn",
        labelRu: "Текст 1",
        title: ${JSON.stringify(d.topics[0])},
        range: "Q1–13",
        questionTypesEn: "True / False / Not Given & Notes Completion",
        questionTypesUz: "True / False / Not Given va konspekt to'ldirish",
        questionTypesRu: "True / False / Not Given и заполнение заметок",
        count: 13,
      },
      {
        index: 2,
        labelEn: "Passage 2",
        labelUz: "2-matn",
        labelRu: "Текст 2",
        title: ${JSON.stringify(d.topics[1])},
        range: "Q14–26",
        questionTypesEn: "Summary Completion & Information Location",
        questionTypesUz: "Xulosa to'ldirish va ma'lumot topish",
        questionTypesRu: "Заполнение резюме и поиск информации",
        count: 13,
      },
      {
        index: 3,
        labelEn: "Passage 3",
        labelUz: "3-matn",
        labelRu: "Текст 3",
        title: ${JSON.stringify(d.topics[2])},
        range: "Q27–40",
        questionTypesEn: "Matching Headings & Yes / No / Not Given",
        questionTypesUz: "Sarlavhalarni moslashtirish va Yes/No/Not Given",
        questionTypesRu: "Подбор заголовков и Yes/No/Not Given",
        count: 14,
      },
    ],
  },\n`;
});

code += `];

export const TEST_BY_ID: Record<TestId, OfficialTest> = {
`;

// Populate TEST_BY_ID
for (let i = 1; i <= 10; i++) {
  code += `  "l-v5-t${i}": OFFICIAL_TESTS[${i - 1}],\n`;
}
for (let i = 1; i <= 10; i++) {
  code += `  "r-v5-t${i}": OFFICIAL_TESTS[${10 + i - 1}],\n`;
}
// Legacy aliases for backward compatibility
code += `  "listening-v5-t09": OFFICIAL_TESTS[8], // l-v5-t9
  "reading-v5-t10": OFFICIAL_TESTS[19], // r-v5-t10
};

export const LISTENING_BAND_TABLE = [
  { raw: "39–40", band: "9.0" },
  { raw: "37–38", band: "8.5" },
  { raw: "35–36", band: "8.0" },
  { raw: "32–34", band: "7.5" },
  { raw: "30–31", band: "7.0" },
  { raw: "26–29", band: "6.5" },
  { raw: "23–25", band: "6.0" },
  { raw: "18–22", band: "5.5" },
  { raw: "16–17", band: "5.0" },
];

export const READING_BAND_TABLE = [
  { raw: "39–40", band: "9.0" },
  { raw: "37–38", band: "8.5" },
  { raw: "35–36", band: "8.0" },
  { raw: "33–34", band: "7.5" },
  { raw: "30–32", band: "7.0" },
  { raw: "27–29", band: "6.5" },
  { raw: "23–26", band: "6.0" },
  { raw: "19–22", band: "5.5" },
  { raw: "15–18", band: "5.0" },
];
`;

fs.writeFileSync('lib/tests-registry.ts', code, 'utf8');
console.log('Successfully wrote updated lib/tests-registry.ts with all 20 tests!');
