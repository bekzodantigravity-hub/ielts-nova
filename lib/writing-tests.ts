export interface WritingTableCell {
  text: string;
  highlight?: "emerald" | "red";
}

export interface WritingTableRow {
  keyLabel: string;
  cells: WritingTableCell[];
}

export interface WritingStructureStep {
  title: string;
  description: string;
}

export interface WritingTestSet {
  id: "writing-01" | "writing-02" | "writing-03" | "writing-04";
  number: string;
  code: string;
  isNew?: boolean;
  title: string;
  subtitle: string;
  durationMinutes: number;
  task1: {
    topicTitle: string;
    chartType: string;
    shortDesc: string;
    question: string;
    imageUrl: string;
    fallbackImageUrl: string;
    imageAlt: string;
    lightboxTitle: string;
    tableTitle: string;
    columns: string[];
    rows: WritingTableRow[];
  };
  task2: {
    topicTitle: string;
    essayType: string;
    shortDesc: string;
    question: string;
    structureGuide: WritingStructureStep[];
  };
  coachHints: {
    fallbackTip: string;
    quickFollowUps: string[];
  };
}

export const WRITING_TESTS: WritingTestSet[] = [
  {
    id: "writing-01",
    number: "01",
    code: "WRITING · SET 01",
    title: "Tourism Jobs & AI Automation",
    subtitle: "UK turizm sohasi statistikasi va sun'iy intellekt bo'yicha akademik esse",
    durationMinutes: 60,
    task1: {
      topicTitle: "Tourism Jobs in UK City (1989–2009)",
      chartType: "Bar Chart · 4 ta soha",
      shortDesc:
        "Restaurants, Hotels, Sport & leisure hamda Travel & tour sohalaridagi ish o'rinlari dinamikasi (1989–2009).",
      question: `The chart below shows the number of jobs in tourism-related industry in one UK city between 1989 and 2009.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
      imageUrl:
        "https://archive.org/download/image-2026-05-29-16-04-43/IMAGE%202026-05-29%2016%3A04%3A43.jpg",
      fallbackImageUrl: "/images/writing-task1-graph.jpg",
      imageAlt:
        "IELTS Academic Writing Task 1: Number of jobs in tourism-related industry in one UK city (1989-2009)",
      lightboxTitle: "Tourism Jobs in UK City (1989–2009)",
      tableTitle: "Turizm ish o'rinlari jadvali (HD Data Table)",
      columns: [
        "Yil (Year)",
        "🍽️ Restaurants",
        "🏨 Hotels",
        "⚽ Sport & leisure",
        "✈️ Travel & tour",
      ],
      rows: [
        {
          keyLabel: "1989",
          cells: [
            { text: "1,100" },
            { text: "1,050" },
            { text: "900" },
            { text: "800" },
          ],
        },
        {
          keyLabel: "1994",
          cells: [
            { text: "1,300" },
            { text: "1,400 ★ Peak", highlight: "emerald" },
            { text: "700" },
            { text: "1,040" },
          ],
        },
        {
          keyLabel: "1999",
          cells: [
            { text: "1,400" },
            { text: "1,220" },
            { text: "1,050 ★ Peak", highlight: "emerald" },
            { text: "900" },
          ],
        },
        {
          keyLabel: "2004",
          cells: [
            { text: "1,600 ★ Peak", highlight: "emerald" },
            { text: "1,080" },
            { text: "900" },
            { text: "700" },
          ],
        },
        {
          keyLabel: "2009",
          cells: [
            { text: "1,300" },
            { text: "1,050" },
            { text: "700" },
            { text: "400 ▼ Nadir", highlight: "red" },
          ],
        },
      ],
    },
    task2: {
      topicTitle: "AI & Automation in Human Labor",
      essayType: "Discuss Both Views + Opinion",
      shortDesc:
        "Sun'iy intellekt va avtomatlashtirishning samaradorlik hamda ishsizlikka ta'siri bo'yicha ikki tomonlama esse.",
      question: `You should spend about 40 minutes on this task.

Write about the following topic:
In recent years, artificial intelligence and automated systems have increasingly replaced human labor in various industries. While some believe this leads to greater efficiency and economic growth, others argue that it causes widespread unemployment and social inequality.

Discuss both views and give your own opinion.

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.`,
      structureGuide: [
        {
          title: "1. Introduction:",
          description:
            "Savolni paraphrase qiling va o'z pozitsiyangizni (thesis statement) aniq bildiring.",
        },
        {
          title: "2. Body 1:",
          description:
            "Birinchi qarash (Efficiency & Economic growth) va asosli dalillar keltiring.",
        },
        {
          title: "3. Body 2:",
          description:
            "Ikkinchi qarash (Unemployment & Social inequality) va shaxsiy tahlilingizni bering.",
        },
        {
          title: "4. Conclusion:",
          description: "Asosiy nuqtalarni umumlashtiruvchi qat'iy xulosa yozing.",
        },
      ],
    },
    coachHints: {
      fallbackTip:
        "Ushbu insho bo'yicha Band 8.5 ga erishish uchun: 1) Overviewda 'Restaurants' o'sishi va 'Travel and tour' pasayishini qarama-qarshi qo'ying; 2) 'Surged', 'plummeted' kabi aniq fe'llardan foydalaning.",
      quickFollowUps: [
        "Kirish (Introduction) qismini qanday qilib Band 8.5 qilsam bo'ladi?",
        "Nega menga aynan shu ball qo'yildi?",
        "Overview qismimda qanday asosiy kamchilik bor?",
        "Menga ushbu mavzuda 5 ta C1/C2 so'z va kolokatsiya bering",
      ],
    },
  },
  {
    id: "writing-02",
    number: "02",
    code: "WRITING · SET 02",
    title: "Film Production & Social Media",
    subtitle: "5 ta davlatda film ishlab chiqarish hajmi va ijtimoiy tarmoqlar ta'siri",
    durationMinutes: 60,
    task1: {
      topicTitle: "Films Produced by Five Countries (2007–2009)",
      chartType: "Grouped Bar Chart · 5 ta davlat",
      shortDesc:
        "A, B, C, D va E davlatlarida 2007–2009-yillar davomida ishlab chiqarilgan filmlar soni tahlili.",
      question: `You should spend about 20 minutes on this task.

The chart below shows the number of films produced by five countries in three years.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
      imageUrl: "/images/writing-task1-films.svg",
      fallbackImageUrl: "/images/writing-task1-films.svg",
      imageAlt:
        "IELTS Academic Writing Task 1: The number of films produced by five countries in 2007, 2008 and 2009",
      lightboxTitle: "Films Produced by Five Countries (2007–2009)",
      tableTitle: "Davlatlar kesimida filmlar soni (HD Data Table)",
      columns: ["Davlat", "2007", "2008", "2009"],
      rows: [
        {
          keyLabel: "Country A",
          cells: [
            { text: "88 ★ Peak", highlight: "emerald" },
            { text: "88 ★ Peak", highlight: "emerald" },
            { text: "80" },
          ],
        },
        {
          keyLabel: "Country B",
          cells: [
            { text: "48" },
            { text: "50" },
            { text: "70 ▲ Surge", highlight: "emerald" },
          ],
        },
        {
          keyLabel: "Country C",
          cells: [
            { text: "8 ▼ Lowest", highlight: "red" },
            { text: "14" },
            { text: "19" },
          ],
        },
        {
          keyLabel: "Country D",
          cells: [
            { text: "17" },
            { text: "10 ▼ Dip", highlight: "red" },
            { text: "14" },
          ],
        },
        {
          keyLabel: "Country E",
          cells: [
            { text: "10" },
            { text: "11" },
            { text: "12" },
          ],
        },
      ],
    },
    task2: {
      topicTitle: "Social Media: Connection & News",
      essayType: "Advantages Outweigh Disadvantages",
      shortDesc:
        "Ijtimoiy tarmoqlarning muloqot va yangiliklardan xabardor bo'lishdagi foyda hamda zararlari muvozanati.",
      question: `You should spend about 40 minutes on this task.

Write about the following topic:
Social media enables people to keep in touch with each other and learn about news events.

Do the advantages outweigh the disadvantages?

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.`,
      structureGuide: [
        {
          title: "1. Introduction:",
          description:
            "Mavzuni paraphrase qiling va foydalar zararlardan ustun kelishini (yoki aksincha) aniq bayon eting.",
        },
        {
          title: "2. Body 1 (Qarama-qarshi tomon — Kamchiliklar):",
          description:
            "Soxta yangiliklar (misinformation), diqqat chalg'ishi va jonli muloqotning zaiflashishini yoriting.",
        },
        {
          title: "3. Body 2 (Asosiy pozitsiya — Afzalliklar):",
          description:
            "Masofadan cheksiz aloqa, favqulodda voqealarni tezkor bilish va nega ijobiy jihatlar kuchliroqligini asoslang.",
        },
        {
          title: "4. Conclusion:",
          description:
            "Ikkala tomonni qisqa jamlab, pozitsiyangizni qat'iy tasdiqlovchi yakun yozing.",
        },
      ],
    },
    coachHints: {
      fallbackTip:
        "Ushbu to'plamda Band 8.5+ olish uchun: Task 1 da Country A yetakchiligi va Country B ning 2009-yildagi keskin o'sishini (48 dan 70 gacha) C–E guruhlari bilan taqqoslang; Task 2 da esa afzalliklar ustunligini aniq misollar bilan asoslang.",
      quickFollowUps: [
        "Country A va B ni Overview qismida qanday qiyoslash kerak?",
        "Task 2 da 'advantages outweigh disadvantages' thesis statementini ko'rsating",
        "Nega menga aynan shu ball qo'yildi?",
        "Social media mavzusi uchun 5 ta C1/C2 kolokatsiya bering",
      ],
    },
  },
  {
    id: "writing-03",
    number: "03",
    code: "WRITING · SET 03",
    title: "Youth Employment & Reoffending",
    subtitle: "Yoshlar bandligi jadvali (2005–2010) va takroriy jinoyatchilik sabablari",
    durationMinutes: 60,
    task1: {
      topicTitle: "Youth Employment by Sector (2005 & 2010)",
      chartType: "Data Table · 7 ta soha",
      shortDesc:
        "7 ta iqtisodiy sohada yoshlar bandligi ulushi (2005 vs 2010): Social services tushishi va xizmat ko'rsatish o'sishi.",
      question: `You should spend about 20 minutes on this task.

The table shows the percentage of young people who were employed in different sectors in one country in 2005 and 2010.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
      imageUrl: "/images/writing-task1-employment.svg",
      fallbackImageUrl: "/images/writing-task1-employment.svg",
      imageAlt:
        "IELTS Academic Writing Task 1: Percentage of young people employed in different sectors in 2005 and 2010",
      lightboxTitle: "Youth Employment by Sector (2005 & 2010)",
      tableTitle: "Yoshlar bandligi ulushi jadvali (HD Data Table)",
      columns: ["Soha (Sector)", "2005 (%)", "2010 (%)"],
      rows: [
        {
          keyLabel: "Agriculture",
          cells: [{ text: "7%" }, { text: "8%" }],
        },
        {
          keyLabel: "Business",
          cells: [{ text: "7%" }, { text: "10%" }],
        },
        {
          keyLabel: "Manufacturing",
          cells: [{ text: "21%" }, { text: "14%" }],
        },
        {
          keyLabel: "Shops, restaurants & hotels",
          cells: [
            { text: "20%" },
            { text: "33% ▲ Surge", highlight: "emerald" },
          ],
        },
        {
          keyLabel: "Social services",
          cells: [
            { text: "34% ★ Peak", highlight: "emerald" },
            { text: "22%" },
          ],
        },
        {
          keyLabel: "Transport",
          cells: [
            { text: "5%" },
            { text: "4% ▼ Lowest", highlight: "red" },
          ],
        },
        {
          keyLabel: "Other",
          cells: [{ text: "7%" }, { text: "7%" }],
        },
      ],
    },
    task2: {
      topicTitle: "Criminal Reoffending: Causes & Solutions",
      essayType: "Causes & Solutions",
      shortDesc:
        "Jazo o'tagandan keyin takroriy jinoyat sodir etish sabablari hamda reabilitatsiya yechimlari.",
      question: `You should spend about 40 minutes on this task.

Write about the following topic:
Some people believe that criminals should be punished after committing a crime. However, criminals often commit crimes again after completing their punishment.

Why might this be the case?
What can be done to solve this problem?

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.`,
      structureGuide: [
        {
          title: "1. Introduction:",
          description:
            "Mavzuni paraphrase qiling va takroriy jinoyatchilikning (reoffending) asosiy sabablari hamda amaliy yechimlariga qisqacha ishora qiling.",
        },
        {
          title: "2. Body 1 (Sabablari — Why might this be the case?):",
          description:
            "Jamiyatga qaytishdagi ijtimoiy tamg'a (stigma), ish topish muammosi hamda qamoq tizimida reabilitatsiya va kasbiy ta'lim yetishmasligini tahlil qiling.",
        },
        {
          title: "3. Body 2 (Yechimlari — What can be done?):",
          description:
            "Qamoqxona ichida kasb-hunar dasturlari (vocational training), psixologik ko'mak va ozodlikdan keyingi ishga joylashish dasturlarini asoslang.",
        },
        {
          title: "4. Conclusion:",
          description:
            "Asosiy sabab va taklif etilgan chora-tadbirlarni umumlashtirib, yakuniy xulosa chiqaring.",
        },
      ],
    },
    coachHints: {
      fallbackTip:
        "Ushbu to'plamda Band 8.5+ olish uchun: Task 1 da 2005-yilda yetakchi bo'lgan 'Social services' (34% -> 22%) hamda 2010-yilda birinchi o'ringa chiqqan 'Shops, restaurants & hotels' (20% -> 33%) o'zgarishini aniq solishtiring; Task 2 da esa ikkala savolga ham (sabablar + yechimlar) teng va chuqur javob bering.",
      quickFollowUps: [
        "Table (jadval) turidagi Task 1 uchun ideal Overview qanday yoziladi?",
        "Task 2 da sabab va yechimlarni mantiqan qanday bog'lash mumkin?",
        "Nega menga aynan shu ball qo'yildi?",
        "Crime & Rehabilitation mavzusida 5 ta C1/C2 kolokatsiya bering",
      ],
    },
  },
  {
    id: "writing-04",
    number: "04",
    code: "WRITING · SET 04",
    isNew: true,
    title: "Mobile Contracts & News Value",
    subtitle: "Yevropa davlatidagi mobil aloqa tariflari grafigi (2002) va gazeta/TV yangiliklari qiymati",
    durationMinutes: 60,
    task1: {
      topicTitle: "Mobile Phone Contract Costs (Jan–Sep 2002)",
      chartType: "Line Graph · 4 ta tarif",
      shortDesc:
        "Demo, Lex, Sim TX va Alpha mobil shartnomalari oylik o'rtacha narxlarining (yevroda) 2002-yil Yanvar–Sentabrdagi o'zgarishi.",
      question: `You should spend about 20 minutes on this task.

The chart below shows the average monthly cost of contracts for four different mobile (cell) phones in a European country from January to September 2002, measured in euros.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
      imageUrl: "/images/writing-task1-mobile-contracts.svg",
      fallbackImageUrl: "/images/writing-task1-mobile-contracts.svg",
      imageAlt:
        "IELTS Academic Writing Task 1: Average monthly cost of contracts for four different mobile phones in a European country from January to September 2002, measured in euros",
      lightboxTitle: "Mobile Phone Contract Costs (Jan–Sep 2002)",
      tableTitle: "Mobil aloqa tariflari oylik narxi (HD Data Table)",
      columns: ["Oy (2002)", "Demo (€)", "Lex (€)", "Sim TX (€)", "Alpha (€)"],
      rows: [
        {
          keyLabel: "Jan",
          cells: [
            { text: "15" },
            { text: "12" },
            { text: "5" },
            { text: "9" },
          ],
        },
        {
          keyLabel: "Feb",
          cells: [
            { text: "16" },
            { text: "10" },
            { text: "5" },
            { text: "~8" },
          ],
        },
        {
          keyLabel: "Mar",
          cells: [
            { text: "~17" },
            { text: "~13" },
            { text: "6" },
            { text: "~9" },
          ],
        },
        {
          keyLabel: "Apr",
          cells: [
            { text: "16" },
            { text: "~13" },
            { text: "7" },
            { text: "10" },
          ],
        },
        {
          keyLabel: "May",
          cells: [
            { text: "20" },
            { text: "14" },
            { text: "6" },
            { text: "~11" },
          ],
        },
        {
          keyLabel: "Jun",
          cells: [
            { text: "20" },
            { text: "~13" },
            { text: "5 ▼ Min", highlight: "red" },
            { text: "14 ★ Peak", highlight: "emerald" },
          ],
        },
        {
          keyLabel: "Jul",
          cells: [
            { text: "25 ★ Peak", highlight: "emerald" },
            { text: "16" },
            { text: "10" },
            { text: "10" },
          ],
        },
        {
          keyLabel: "Aug",
          cells: [
            { text: "~24" },
            { text: "16" },
            { text: "13" },
            { text: "~9" },
          ],
        },
        {
          keyLabel: "Sep",
          cells: [
            { text: "~22.5" },
            { text: "~18" },
            { text: "25 ★ Peak", highlight: "emerald" },
            { text: "~8" },
          ],
        },
      ],
    },
    task2: {
      topicTitle: "Newspapers & TV News: Waste of Time?",
      essayType: "Agree or Disagree",
      shortDesc:
        "Gazeta va televideniye yangiliklarining insonlar kundalik hayotiga aloqadorligi hamda amaliy ahamiyati bo'yicha esse.",
      question: `You should spend about 40 minutes on this task.

Write about the following topic:
Some people say that reading newspapers and watching TV news is a waste of time because the news has no direct connection with people’s lives.

To what extent do you agree or disagree?

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.`,
      structureGuide: [
        {
          title: "1. Introduction:",
          description:
            "Mavzuni paraphrase qiling va yangiliklarni kuzatish vaqtni behuda sarflashmi yoki yo'qligi borasidagi aniq pozitsiyangizni (masalan, qisman yoki to'liq qarshiman) bildiring.",
        },
        {
          title: "2. Body 1 (Tanqidiy tomon — Qisman qo'shilish / Sabablar):",
          description:
            "Nega ayrimlar yangiliklarni foydasiz deb bilishini (shov-shuvli xabarlar, uzoq hududdagi voqealar, axborot charchog'i) tahlil qiling.",
        },
        {
          title: "3. Body 2 (Asosiy pozitsiya — Kundalik hayotga bevosita ta'sir):",
          description:
            "Iqtisodiy qarorlar (inflyatsiya, soliq, ish bozori), qonunchilik o'zgarishlari, sog'liqni saqlash va favqulodda ogohlantirishlar orqali yangiliklar hayotimizga bevosita ta'sir qilishini asoslang.",
        },
        {
          title: "4. Conclusion:",
          description:
            "Asosiy dalillarni umumlashtirib, ishonchli va saralangan yangiliklarni kuzatish vaqtni zoye ketkazmasligini ta'kidlovchi xulosa yozing.",
        },
      ],
    },
    coachHints: {
      fallbackTip:
        "Ushbu to'plamda Band 8.5+ olish uchun: Task 1 da Sim TX ning Jan–Jun oralig'idagi barqaror past narxidan (5–7 yevro) Sentabrda 25 yevrogacha keskin ko'tarilib, Demo (22.5 yevro) dan o'zib ketganini aniq ta'kidlang; Task 2 da esa 'to what extent' savoliga kirishdan xulosagacha izchil pozitsiyada javob bering.",
      quickFollowUps: [
        "Line graph (chiziqli grafik) uchun trendlarni guruhlab yozish usulini ko'rsating",
        "To what extent do you agree or disagree savoliga ideal thesis statement bering",
        "Nega menga aynan shu ball qo'yildi?",
        "News & Media mavzusida 5 ta C1/C2 akademik kolokatsiya bering",
      ],
    },
  },
];

export function getWritingTestById(id?: string | null): WritingTestSet {
  return WRITING_TESTS.find((t) => t.id === id) ?? WRITING_TESTS[0];
}
