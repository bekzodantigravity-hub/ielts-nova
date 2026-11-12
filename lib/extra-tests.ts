import type { OfficialTest, TestSectionMeta } from "./tests-registry";

function makeListeningSections(
  topics: [string, string, string, string]
): TestSectionMeta[] {
  const ranges = ["Q1–10", "Q11–20", "Q21–30", "Q31–40"];
  const typesEn = [
    "Note Completion & Form Filling",
    "Multiple Choice & Map / Matching",
    "Matching & Academic Discussion",
    "Academic Monologue Notes",
  ];
  const typesUz = [
    "Konspekt to'ldirish va forma",
    "Test savollari va moslashtirish",
    "Moslashtirish va akademik muhokama",
    "Akademik ma'ruza konspekti",
  ];
  const typesRu = [
    "Заполнение заметок и форм",
    "Множественный выбор и карта",
    "Сопоставление и обсуждение",
    "Конспект академической лекции",
  ];

  return topics.map((title, idx) => ({
    index: idx + 1,
    labelEn: `Part ${idx + 1}`,
    labelUz: `${idx + 1}-qism`,
    labelRu: `Часть ${idx + 1}`,
    title,
    range: ranges[idx],
    questionTypesEn: typesEn[idx],
    questionTypesUz: typesUz[idx],
    questionTypesRu: typesRu[idx],
    count: 10,
  }));
}

function makeReadingSections(
  topics: [string, string, string]
): TestSectionMeta[] {
  const ranges = ["Q1–13", "Q14–26", "Q27–40"];
  const counts = [13, 13, 14];
  const typesEn = [
    "True/False/Not Given & Completion",
    "Heading / Information Matching",
    "Multiple Choice & Yes/No/Not Given",
  ];
  const typesUz = [
    "True/False/Not Given va to'ldirish",
    "Sarlavha va ma'lumot moslashtirish",
    "Test savollari va Yes/No/Not Given",
  ];
  const typesRu = [
    "True/False/Not Given и дополнение",
    "Подбор заголовков и информации",
    "Множественный выбор и Yes/No/Not Given",
  ];

  return topics.map((title, idx) => ({
    index: idx + 1,
    labelEn: `Passage ${idx + 1}`,
    labelUz: `${idx + 1}-matn`,
    labelRu: `Текст ${idx + 1}`,
    title,
    range: ranges[idx],
    questionTypesEn: typesEn[idx],
    questionTypesUz: typesUz[idx],
    questionTypesRu: typesRu[idx],
    count: counts[idx],
  }));
}

function createListeningTest(
  id: OfficialTest["id"],
  num: number,
  topics: [string, string, string, string]
): OfficialTest {
  const label = `Test ${num}`;
  return {
    id,
    skill: "listening",
    volume: "Standard",
    testNumber: label,
    code: `TEST ${num}`,
    titleEn: label,
    titleUz: label,
    titleRu: label,
    subtitleEn: topics.join(" · "),
    subtitleUz: topics.join(" · "),
    subtitleRu: topics.join(" · "),
    durationMinutes: 30,
    extraCheckMinutes: 2,
    questionsCount: 40,
    sectionsCount: 4,
    formatBadge: "Listening",
    htmlPath: `/mocks/listening/${id}.html`,
    routePath: `/test/${id}`,
    topics,
    sections: makeListeningSections(topics),
  };
}

function createReadingTest(
  id: OfficialTest["id"],
  num: number,
  topics: [string, string, string]
): OfficialTest {
  const label = `Test ${num}`;
  return {
    id,
    skill: "reading",
    volume: "Standard",
    testNumber: label,
    code: `TEST ${num}`,
    titleEn: label,
    titleUz: label,
    titleRu: label,
    subtitleEn: topics.join(" · "),
    subtitleUz: topics.join(" · "),
    subtitleRu: topics.join(" · "),
    durationMinutes: 60,
    questionsCount: 40,
    sectionsCount: 3,
    formatBadge: "Reading",
    htmlPath: `/mocks/reading/${id}.html`,
    routePath: `/test/${id}`,
    topics,
    sections: makeReadingSections(topics),
  };
}

export const EXTRA_TESTS: OfficialTest[] = [
  // Listening Tests 21..26
  createListeningTest("l-t21", 21, [
    "Swimming Lessons",
    "Campus Orientation",
    "Careers Advice",
    "Economics and Trust",
  ]),
  createListeningTest("l-t22", 22, [
    "Bankside Recruitment Agency",
    "Matthews Island Holidays",
    "Birth Order and Personality",
    "The Eucalyptus Tree in Australia",
  ]),
  createListeningTest("l-t23", 23, [
    "Festival Information",
    "Minster Park",
    "Charles Dickens Display",
    "Agricultural Programme in Mozambique",
  ]),
  createListeningTest("l-t24", 24, [
    "Post Office Package Delivery Form",
    "Montana Resort Hotel",
    "Oral History",
    "Plant Behaviour",
  ]),
  createListeningTest("l-t25", 25, [
    "Volunteer Work Application",
    "Strawberry Farm",
    "Water Pumps",
    "American Salt Marshes",
  ]),
  createListeningTest("l-t26", 26, [
    "Poppy Reserve",
    "Iron Age Village",
    "Organising a Debate",
    "Office Design",
  ]),

  // Reading Tests 21..33
  createReadingTest("r-t21", 21, [
    "The Wonder Plant",
    "Renewable Energy",
    "Inside the mind of a fan",
  ]),
  createReadingTest("r-t22", 22, [
    "The importance of children’s play",
    "Bike-sharing schemes",
    "Motivational factors",
  ]),
  createReadingTest("r-t23", 23, [
    "Alexander Henderson",
    "Skyscraper design",
    "Why companies should welcome disorder",
  ]),
  createReadingTest("r-t24", 24, [
    "The concept of intelligence",
    "Saving bugs to find new drugs",
    "The power of play",
  ]),
  createReadingTest("r-t25", 25, [
    "The development of the silk industry",
    "The discovery of a baby mammoth",
    "What makes a musical expert?",
  ]),
  createReadingTest("r-t26", 26, [
    "The Clipper Races",
    "Orientation of birds",
    "The role of accidents in business",
  ]),
  createReadingTest("r-t27", 27, [
    "An important language development",
    "Children's comprehension of television advertising",
    "A New Voyage Round the World",
  ]),
  createReadingTest("r-t28", 28, [
    "Voyage of Going Beyond the Blue Line",
    "Multitasks",
    "Grimm's Fairy Tales",
  ]),
  createReadingTest("r-t29", 29, [
    "HISTORY OF TEA",
    "Biodiversity",
    "Nature Works Polylactic Acid",
  ]),
  createReadingTest("r-t30", 30, [
    "Leatherback turtles",
    "Thoughtful Computing system",
    "Irish ELK",
  ]),
  createReadingTest("r-t31", 31, [
    "THE BRIEF HISTORY OF TEA",
    "Clean water filter",
    "Linguistic Change",
  ]),
  createReadingTest("r-t32", 32, [
    "The Tuatara",
    "THE TASMANIAN TIGER",
    "The Cane Toad",
  ]),
  createReadingTest("r-t33", 33, [
    "Pesticide-free village",
    "Skyscraper Farming",
    "Mind Control",
  ]),
];
