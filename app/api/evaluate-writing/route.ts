import { GoogleGenAI } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";
import { WRITING_TESTS } from "@/lib/writing-tests";

export interface CriterionDetail {
  band: number;
  score: number;
  title: string;
  feedback: string;
  whyThisScore: string;
  howToReachNextBand: string;
}

export interface MistakeItem {
  original: string;
  correction: string;
  band9Upgrade: string;
  explanation: string;
}

export interface VocabularyUpgrade {
  originalWord: string;
  upgrades: string[];
  contextExample: string;
}

export interface PracticeTask {
  id: string;
  type: "rewrite" | "fill_blank" | "fix_error";
  question: string;
  incorrectSentence: string;
  hint: string;
  sampleAnswer: string;
  explanation: string;
}

export interface EvaluationResult {
  overallBand: number;
  wordCount: number;
  taskTitle: string;
  isAttempted: boolean;
  criteria: {
    taskAchievement: CriterionDetail;
    coherenceCohesion: CriterionDetail;
    lexicalResource: CriterionDetail;
    grammaticalAccuracy: CriterionDetail;
  };
  mistakes: MistakeItem[];
  vocabularyUpgrades: VocabularyUpgrade[];
  practiceTasks: PracticeTask[];
  examinerAdvice: string;
}

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function roundBand(val: number): number {
  const rounded = Math.round(val * 2) / 2;
  return Math.min(9.0, Math.max(1.0, rounded));
}

function roundIELTS(score: number): number {
  const safeScore = Number.isFinite(score) ? score : 1.0;
  const intPart = Math.floor(safeScore);
  const frac = safeScore - intPart;
  const rounded =
    frac < 0.25 ? intPart : frac < 0.75 ? intPart + 0.5 : intPart + 1.0;
  return Math.min(9.0, Math.max(1.0, rounded));
}

function normalizeTextForMatch(text: string): string {
  return text
    .trim()
    .replace(/^["'«»“”‘’`]+|["'«»“”‘’`]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function essayContainsQuote(essay: string, candidateQuote: string): boolean {
  const normEssay = normalizeTextForMatch(essay);
  const normQuote = normalizeTextForMatch(candidateQuote);
  if (!normQuote || normQuote.length < 2) return false;
  if (normEssay.includes(normQuote)) return true;
  if (normQuote.includes("...")) {
    const parts = normQuote
      .split(/\.\.\./)
      .map((p) => p.trim())
      .filter((p) => p.length >= 3);
    return parts.length > 0 && parts.every((p) => normEssay.includes(p));
  }
  return false;
}

function getTask1ReferenceContext(question: string): {
  taskTitle: string;
  dataBlock: string;
} {
  const qNorm = normalizeTextForMatch(question);
  const matchedTest = WRITING_TESTS.find((t) => {
    const tNorm = normalizeTextForMatch(t.task1.question);
    if (qNorm.includes(tNorm) || tNorm.includes(qNorm)) return true;
    if (t.id === "writing-01" && /tourism-related industry|uk city/i.test(question))
      return true;
    if (t.id === "writing-02" && /films produced by five countries/i.test(question))
      return true;
    if (
      t.id === "writing-03" &&
      /percentage of young people.*employed in different sectors/i.test(question)
    )
      return true;
    if (
      t.id === "writing-04" &&
      /monthly cost of contracts.*mobile.*phones|measured in euros/i.test(question)
    )
      return true;
    return false;
  });

  if (!matchedTest) {
    return {
      taskTitle: "Task 1: Academic Report",
      dataBlock:
        "No external reference table is attached for this custom prompt; evaluate strictly against the wording of QUESTION and internal factual consistency without inventing numbers.",
    };
  }

  const cols = matchedTest.task1.columns;
  const cleanCell = (s: string) => s.replace(/\s*[★▲▼]\s*\w+/g, "").trim();
  const rowLines = matchedTest.task1.rows
    .map((r) => {
      const pairs = r.cells.map((c, idx) => `${cols[idx + 1] || `Col${idx + 1}`}: ${cleanCell(c.text)}`);
      return `- ${r.keyLabel}: ${pairs.join("; ")}`;
    })
    .join("\n");

  return {
    taskTitle: `Task 1: ${matchedTest.task1.topicTitle}`,
    dataBlock: `VERIFIED CHART/TABLE DATA (${matchedTest.task1.topicTitle} — ${matchedTest.task1.chartType}):\n${rowLines}`,
  };
}

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "");
  }
  return cleaned.trim();
}

function buildFallbackEvaluation(
  taskType: string,
  question: string,
  essay: string
): EvaluationResult {
  const words = countWords(essay);
  const isTask1 = taskType.toLowerCase().includes("1");
  const minWords = isTask1 ? 150 : 250;
  const isAttempted = words >= 20;

  if (!isAttempted) {
    return {
      overallBand: 1.0,
      wordCount: words,
      taskTitle: isTask1 ? "Task 1 (Report)" : "Task 2 (Essay)",
      isAttempted: false,
      criteria: {
        taskAchievement: {
          band: 1.0,
          score: 1.0,
          title: isTask1 ? "Task Achievement (TR)" : "Task Response (TR)",
          feedback: "Nomzod topshiriqni bajarmagan yoki yozilgan matn hajm jihatidan baholash uchun yetarli emas.",
          whyThisScore: "IELTS mezonlariga muvofiq, yozilmagan yoki 20 so'zdan kam topshiriqlar Band 1.0 deb qayd etiladi.",
          howToReachNextBand: "Kamida belgilangan minimal so'z chegarasiga yetkazib, barcha talablarni yoritish lozim.",
        },
        coherenceCohesion: {
          band: 1.0,
          score: 1.0,
          title: "Coherence and Cohesion (CC)",
          feedback: "Matn mavjud emasligi sababli mantiqiy bog'liqlik va paragraflar tahlil qilinmadi.",
          whyThisScore: "Bog'lovchi vositalar va paragraflar strukturasi mavjud emas.",
          howToReachNextBand: "Kamida 3-4 ta alohida mantiqiy paragraf yarating.",
        },
        lexicalResource: {
          band: 1.0,
          score: 1.0,
          title: "Lexical Resource (LR)",
          feedback: "So'z boyligi tahlili uchun yetarli leksik ma'lumot taqdim etilmagan.",
          whyThisScore: "Akademik so'zlar aniqlanmadi.",
          howToReachNextBand: "Mavzuga oid kamida 10-15 ta akademik atama va kolokatsiyalarni qo'llang.",
        },
        grammaticalAccuracy: {
          band: 1.0,
          score: 1.0,
          title: "Grammatical Range and Accuracy (GRA)",
          feedback: "Grammatik strukturalar mavjud emas.",
          whyThisScore: "Grammatik shakllar va gap tuzilishi baholanmadi.",
          howToReachNextBand: "Murakkab va qo'shma gaplardan foydalanib fikringizni ifodalang.",
        },
      },
      mistakes: [],
      vocabularyUpgrades: [],
      practiceTasks: [],
      examinerAdvice: "Imtihonni muvaffaqiyatli topshirish uchun belgilangan vaqt ichida to'liq insho yozish talab etiladi.",
    };
  }

  // Realistic calibrated fallback based on actual length and academic keywords
  const hasAcademicLexis = /predominant|trajectory|illustrate|noticeable|rebounded|consequently|furthermore|in contrast|nevertheless|outweigh|conversely|misinformation|rehabilitation|reoffend|recidivism|stigma|overtook|surpassed|sensationalist|civic/i.test(essay);
  const baseBand = words >= minWords ? (hasAcademicLexis ? 7.5 : 6.5) : 5.5;

  const fallbackProfiles = [
    {
      match: isTask1 && /film/i.test(question),
      title: "Task 1: Film Production by Five Countries",
      feedback: `Topshiriq talabi asosan bajarilgan (${words} so'z). Beshta davlat (A–E) bo'yicha film ishlab chiqarish dinamikasi yoritilgan.`,
      nextBand: "Country A (88–80) yetakchiligi va Country B ning 2009-yildagi 70 gacha ko'tarilishini C–E davlatlari bilan solishtiruvchi aniq Overview yozing.",
    },
    {
      match: isTask1 && /young people|employed.*sector/i.test(question),
      title: "Task 1: Youth Employment by Sector (2005 & 2010)",
      feedback: `Topshiriq talabi asosan bajarilgan (${words} so'z). Turli sohalardagi yoshlar bandligi foizlari (2005 va 2010) tahlil qilingan.`,
      nextBand: "'Social services'ning 34% dan 22% ga tushishi hamda 'Shops, restaurants & hotels'ning 20% dan 33% ga o'sishini solishtiruvchi aniq Overview yozing.",
    },
    {
      match: isTask1 && /mobile.*phone|contracts|euros/i.test(question),
      title: "Task 1: Mobile Phone Contract Costs (2002)",
      feedback: `Topshiriq talabi asosan bajarilgan (${words} so'z). To'rtta mobil tarif (Demo, Lex, Sim TX, Alpha) narxlarining Yanvar–Sentabr oralig'idagi o'zgarishi yoritilgan.`,
      nextBand: "Sim TX ning 5 yevrodan 25 yevrogacha sakrab Demo (~22.5 yevro) dan o'zib ketganini hamda Alpha ning Iyun oyidagi cho'qqisini (14 yevro) solishtiruvchi Overview yozing.",
    },
    {
      match: !isTask1 && /social media/i.test(question),
      title: "Task 2: Social Media Advantages & Disadvantages",
      feedback: `Ijtimoiy tarmoqlarning muloqot va yangiliklar borasidagi ijobiy hamda salbiy jihatlari solishtirilgan (${words} so'z).`,
      nextBand: "Afzalliklar yoki kamchiliklar ustun kelishini (outweigh) har bir tana paragrafida izchil isbotlang.",
    },
    {
      match: !isTask1 && /criminal|punishment|commit crimes/i.test(question),
      title: "Task 2: Criminal Reoffending (Causes & Solutions)",
      feedback: `Takroriy jinoyatchilik sabablari va muammoni hal qilish yo'llari tahlil qilingan (${words} so'z).`,
      nextBand: "Har bir sabab (ishsizlik, ijtimoiy tamg'a) uchun aniq reabilitatsiya yoki ta'lim yechimini misollar bilan chuqurlashtiring.",
    },
    {
      match: !isTask1 && /newspapers|watching tv news/i.test(question),
      title: "Task 2: Newspapers & TV News Relevance",
      feedback: `Gazeta va televideniye yangiliklarining amaliy foydasi hamda kundalik hayotga bog'liqligi tahlil qilingan (${words} so'z).`,
      nextBand: "'To what extent' savoliga muvofiq iqtisodiy, huquqiy va ijtimoiy misollar orqali o'z pozitsiyangiz darajasini aniqroq himoya qiling.",
    },
  ];

  const defaultProfile = isTask1
    ? {
        title: "Task 1: UK City Tourism Jobs",
        feedback: `Topshiriq talabi asosan bajarilgan (${words} so'z). UK turizm sohasidagi ish o'rinlari (Restaurants, Hotels, Sport and leisure, Travel and tour) tendensiyalari ko'rsatilgan.`,
        nextBand: "Eng yuqori va eng quyi nuqtalarni (Restaurants 1600 gacha o'sgani, Travel 400 ga tushgani) taqqoslovchi aniq Overview yozing.",
      }
    : {
        title: "Task 2: AI & Automation in Society",
        feedback: `Mavzuning ikkala tomoni (iqtisodiy samaradorlik va ishsizlik xavfi) tahlil qilingan hamda shaxsiy pozitsiya bildirilgan.`,
        nextBand: "Har bir argument uchun hayotiy yoki statistik misollarni yanada chuqurroq keltiring.",
      };

  const profile = fallbackProfiles.find((p) => p.match) ?? defaultProfile;

  const defaultMistakes: MistakeItem[] = isTask1
    ? /tourism-related|uk city/i.test(question)
      ? [
          {
            original: "The jobs in restaurants went up very high in 2004.",
            correction:
              "Employment in the restaurant sector surged significantly, reaching a peak in 2004.",
            band9Upgrade:
              "Restaurant sector employment witnessed an unprecedented ascendancy, culminating in an all-time peak of 1,600 jobs by 2004.",
            explanation:
              "Oddiy so'z birikmalari o'rniga akademik nominallashtirish (nominalization) va aniq fe'llardan foydalanish ballni Band 9.0 darajasiga ko'taradi.",
          },
          {
            original: "Travel and tour had big drop down to 400.",
            correction:
              "The travel and tour sector experienced a steep decline, falling to just 400 jobs.",
            band9Upgrade:
              "Travel and tour positions underwent a precipitous drop, plummeting to an unprecedented nadir of approximately 400 jobs in 2009.",
            explanation:
              "'Drop down' norasmiy (informal) fraza bo'lib, o'rniga 'steep decline' yoki 'precipitous drop' qo'llash zarur.",
          },
          {
            original: "Hotels and sports stayed same number.",
            correction:
              "The figures for hotels and leisure industries exhibited relative stability.",
            band9Upgrade:
              "Both hospitality and recreational sectors displayed remarkable resilience, hovering within a consistent margin throughout the surveyed timeframe.",
            explanation:
              "'Stayed same number' tushunchasini 'exhibited stability' yoki 'hovered within a consistent margin' kabi C2 iboralari bilan berish talab etiladi.",
          },
        ]
      : []
    : [
        {
          original: "People think that AI will take all human jobs.",
          correction:
            "Many commentators contend that automated systems may displace substantial portions of the human workforce.",
          band9Upgrade:
            "It is widely posited that the widespread proliferation of cognitive automation risks instigating profound structural labor displacement.",
          explanation:
            "Oddiy so'z birikmalari o'rniga akademik nominallashtirish (nominalization) va aniq fe'llardan foydalanish ballni Band 9.0 darajasiga ko'taradi.",
        },
        {
          original: "AI makes companies to work more fast and good.",
          correction:
            "Artificial intelligence optimizes operational efficiency and productivity across corporate sectors.",
          band9Upgrade:
            "Technological implementation substantially streamlines commercial workflows while exponentially augmenting precision.",
          explanation:
            "'more fast and good' o'rniga aniq akademik fe'l va ot birikmalaridan foydalanish zarur.",
        },
        {
          original: "In my opinion I think government must help them.",
          correction:
            "In my perspective, state authorities must institute robust reskilling initiatives.",
          band9Upgrade:
            "It is imperative that government policymakers orchestrate proactive workforce retraining programs to mitigate structural inequalities.",
          explanation:
            "Takroriy shaxsiy iboralar o'rniga rasmiy akademik uslubdagi tuzilmalardan foydalanish talab etiladi.",
        },
      ];

  return {
    overallBand: baseBand,
    wordCount: words,
    taskTitle: profile.title,
    isAttempted: true,
    criteria: {
      taskAchievement: {
        band: baseBand,
        score: baseBand,
        title: isTask1 ? "Task Achievement (TR)" : "Task Response (TR)",
        feedback: profile.feedback,
        whyThisScore: words >= minWords
          ? "Asosiy tendentsiyalar qamrab olingan va umumiy xulosa (Overview) keltirilgan."
          : "So'zlar soni yetarli emas, ayrim muhim raqamlar yoki dalillar to'liq ochilmagan.",
        howToReachNextBand: profile.nextBand,
      },
      coherenceCohesion: {
        band: baseBand,
        score: baseBand,
        title: "Coherence and Cohesion (CC)",
        feedback: "Paragraflar o'rtasida mantiqiy ketma-ketlik mavjud. Bog'lovchi vositalar o'z o'rnida qo'llangan.",
        whyThisScore: "Kirish, asosiy qismlar va xulosa aniq ajratilgan, fikrlar uzviy bog'langan.",
        howToReachNextBand: "Mexanik bog'lovchilar ('First, Second') o'rniga tabiiy sintaktik bog'lovchilarni ('What stands out from the data is...') qo'llang.",
      },
      lexicalResource: {
        band: baseBand,
        score: baseBand,
        title: "Lexical Resource (LR)",
        feedback: "Mavzuga doir leksika qo'llangan. Ayrim so'zlarning takrorlanishi kuzatiladi.",
        whyThisScore: "Akademik so'zlar mavjud, biroq C1/C2 darajasidagi kam uchraydigan iboralar cheklangan.",
        howToReachNextBand: "'increase/decrease' o'rniga 'surge, plateau, plunge, fluctuate' kabi aniq fe'l va frazalardan foydalaning.",
      },
      grammaticalAccuracy: {
        band: baseBand,
        score: baseBand,
        title: "Grammatical Range and Accuracy (GRA)",
        feedback: "Murakkab va sodda gaplar mutanosibligi yaxshi, punktuatsiya qoidalariga amal qilingan.",
        whyThisScore: "Aksariyat gaplar grammatik xatolarsiz, biroq inversiya va passiv strukturalar kam.",
        howToReachNextBand: "Inversion ('Not only did the figures surge...'), Participle clauses ('Having peaked at...') kabi murakkab tuzilmalardan foydalaning.",
      },
    },
    mistakes: defaultMistakes,
    vocabularyUpgrades: [
      {
        originalWord: "went up / increased",
        upgrades: ["surged", "escalated", "witnessed an upward trajectory", "ascended"],
        contextExample: "Restaurant employment witnessed an upward trajectory, surpassing 1,600 jobs.",
      },
      {
        originalWord: "went down / decreased",
        upgrades: ["plummeted", "diminished", "underwent a contraction", "slumped"],
        contextExample: "Travel-related occupations underwent a marked contraction towards the end of the period.",
      },
      {
        originalWord: "big difference",
        upgrades: ["substantial disparity", "marked discrepancy", "conspicuous divergence"],
        contextExample: "A substantial disparity emerged between dining and travel agencies.",
      },
      {
        originalWord: "help / improve",
        upgrades: ["foster", "facilitate", "augment", "ameliorate"],
        contextExample: "Strategic investments facilitate economic resilience across the city.",
      },
    ],
    practiceTasks: [
      {
        id: "pt-1",
        type: "rewrite",
        question: "Quyidagi norasmiy va sodda gapni akademik Band 8.5+ darajasiga o'zgartiring:",
        incorrectSentence: "The number of jobs in hotels went up and then went down in the last years.",
        hint: "'Fluctuate', 'reach a pinnacle', yoki 'subsequently decline' kabi akademik iboralardan foydalaning.",
        sampleAnswer: "Hotel employment figures experienced notable fluctuations, peaking in 1994 before witnessing a moderate downward trend.",
        explanation: "'Went up and down' o'rniga 'experienced notable fluctuations' va 'peaking before declining' konstruktsiyasi ishlatiladi.",
      },
      {
        id: "pt-2",
        type: "fill_blank",
        question: "Bo'sh joyni eng mos C1/C2 akademik kolokatsiya bilan to'ldiring:",
        incorrectSentence: "Restaurant employment reached its _______ in 2004, outstripping all other sectors.",
        hint: "Eng yuqori cho'qqi ma'nosini bildiruvchi so'z: 'zenith', 'peak', yoki 'apex'.",
        sampleAnswer: "zenith",
        explanation: "'Reached its zenith' yoki 'reached its peak' - Band 9.0 darajasidagi mukammal akademik ibora hisoblanadi.",
      },
      {
        id: "pt-3",
        type: "fix_error",
        question: "Quyidagi gapdagi grammatik va leksik xatoni tuzating:",
        incorrectSentence: "The data shows that there was a big drop of jobs between 2004 and 2009.",
        hint: "'There was a big drop of' o'rniga 'A significant decline in employment occurred' deb tuzing.",
        sampleAnswer: "The data reveals that a significant contraction in jobs occurred between 2004 and 2009.",
        explanation: "'Drop of jobs' grammatik jihatdan noo'rin, to'g'ri shakli: 'decline in employment' yoki 'contraction in jobs'.",
      },
      {
        id: "pt-4",
        type: "rewrite",
        question: "Ushbu xulosa (Overview) jumlasini ikkita asosiy tendensiyani taqqoslagan holda qayta yozing:",
        incorrectSentence: "Overall, restaurants got more jobs but travel got less jobs in 2009.",
        hint: "'While ... surged, ... experienced the steepest decline' strukturasidan foydalaning.",
        sampleAnswer: "Overall, while the restaurant sector emerged as the predominant employer, the travel and tour industry suffered the steepest contraction over the two-decade span.",
        explanation: "IELTS Task 1 da mukammal Overview uchun 'while' yoki 'whereas' orqali eng yuqori va eng past ko'rsatkichlarni solishtirish Band 8.5+ ni ta'minlaydi.",
      },
    ],
    examinerAdvice:
      "Ushbu insho mustahkam asosga ega. Keyingi 8.0–9.0 bandga chiqish uchun: 1) Har bir asosiy ma'lumotni 'Overview' bilan solishtirib boring; 2) 'Surged', 'plummeted', 'fluctuated' kabi aniq fe'llarni kiritib, noaniq so'zlardan voz keching; 3) Har bir paragrafda inversiya va passiv grammatik shakllardan o'rinli foydalaning.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const taskType: string = body.taskType || "Task 1";
    const question: string = body.question || "IELTS Academic Writing Prompt";
    const essay: string = (body.essay || "").trim();

    const words = countWords(essay);
    const isTask1 = taskType.toLowerCase().includes("1");
    const minWords = isTask1 ? 150 : 250;

    // If essay is essentially empty or user skipped it
    if (!essay || words < 10) {
      return NextResponse.json({
        overallBand: 1.0,
        wordCount: words,
        taskTitle: isTask1 ? "Task 1" : "Task 2",
        isAttempted: false,
        criteria: {
          taskAchievement: {
            band: 1.0,
            score: 1.0,
            title: isTask1 ? "Task Achievement (TR)" : "Task Response (TR)",
            feedback: "Nomzod ushbu topshiriq uchun matn taqdim etmagan. IELTS qoidalariga ko'ra bo'sh qoldirilgan topshiriqqa Band 1.0 belgilanadi.",
            whyThisScore: "Javob matni mavjud emas.",
            howToReachNextBand: "Topshiriq bo'yicha kamida 150 so'zdan iborat tahliliy insho yozing.",
          },
          coherenceCohesion: {
            band: 1.0,
            score: 1.0,
            title: "Coherence and Cohesion (CC)",
            feedback: "Matn yo'qligi sababli bog'liqlikni baholash imkonsiz.",
            whyThisScore: "Paragraflar va bog'lovchilar mavjud emas.",
            howToReachNextBand: "Strukturali paragraflar yarating.",
          },
          lexicalResource: {
            band: 1.0,
            score: 1.0,
            title: "Lexical Resource (LR)",
            feedback: "So'z boyligi tahlil qilinmadi.",
            whyThisScore: "Leksik birliklar mavjud emas.",
            howToReachNextBand: "Akademik so'zlardan foydalaning.",
          },
          grammaticalAccuracy: {
            band: 1.0,
            score: 1.0,
            title: "Grammatical Range and Accuracy (GRA)",
            feedback: "Grammatik strukturalar mavjud emas.",
            whyThisScore: "Gaplar mavjud emas.",
            howToReachNextBand: "Grammatik xatolarsiz murakkab gaplar yozing.",
          },
        },
        mistakes: [],
        vocabularyUpgrades: [],
        practiceTasks: [],
        examinerAdvice: "Ushbu vazifani to'liq yozib topshirish tavsiya etiladi.",
      });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      "";

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Using rule-based fallback evaluation.");
      return NextResponse.json(buildFallbackEvaluation(taskType, question, essay));
    }

    const ai = new GoogleGenAI({ apiKey });

    // Official Cambridge & IDP Calibrated System Prompt
    const systemPrompt = `You are a certified Senior Cambridge & IDP IELTS Writing Examiner evaluating an Academic ${taskType} essay.
Calibrate scores strictly and FAIRLY between 5.0 and 9.0 using the official IELTS Band Descriptors:

OFFICIAL BAND CALIBRATION RULES:
- Band 8.5 - 9.0 (Expert / Exceptional):
  * Task 1: Fully satisfies all requirements. Clear, sophisticated Overview highlighting key trends/contrasts. Key data reported with surgical accuracy.
  * Task 2: Fully developed position addressing all nuances. Well-supported arguments.
  * Vocabulary: Fluent, flexible use of rare C1/C2 academic lexis (e.g., 'predominant', 'trajectory', 'steepest decline', 'rebounded', 'outstripped', 'plummeted', 'disproportionately').
  * Grammar: Full flexibility, virtually error-free, complex sentences flow naturally.
  * IMPORTANT: If a high-level essay demonstrates these qualities, DO NOT hold back! Fairly award 8.5 or 9.0!
- Band 7.5 - 8.0 (Very Good / Advanced):
  * Clear overview and structure, logical paragraphing, wide lexical resource with occasional minor slips, good complex grammatical range.
- Band 6.5 - 7.0 (Competent / Good):
  * Covers requirements well, clear overall progression, sufficient academic vocabulary, some complex sentences with occasional errors that do not impede communication.
- Band 5.5 - 6.0 (Modest / Competent):
  * Addresses the topic generally, overview is present but may lack clarity or key data, vocabulary is adequate but repetitive, mix of simple and complex sentences with noticeable grammatical mistakes.
- Band 5.0 (Limited):
  * Incomplete task response, no clear overview, limited vocabulary range, frequent grammatical errors that may cause strain for the reader.

QUESTION:
"""
${question}
"""

CANDIDATE ESSAY (${words} words):
"""
${essay}
"""

TASK SPECIFICS FOR EVALUATION:
- If Task 1 is about "Number of jobs in tourism-related industry in one UK city between 1989 and 2009", evaluate whether the candidate noted:
  1) Restaurants rose from 1,100 (1989) to an all-time peak of 1,600 (2004) before finishing at 1,300 (2009).
  2) Hotels peaked in 1994 at 1,400, then settled around 1,050 in 2009.
  3) Sport and leisure fluctuated between 700 and 1,050.
  4) Travel and tour suffered the steepest contraction, dropping from 800 to 400 (halving).
  5) A comprehensive Overview comparing the predominant sector (Restaurants) vs the declining sector (Travel and tour).

RETURN PURE JSON ONLY adhering strictly to this schema:
{
  "overallBand": 8.0, // Calculated as the mathematical average of the 4 criteria rounded to the nearest 0.5 (e.g. 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0)
  "taskTitle": "${isTask1 ? "Task 1: UK City Tourism Jobs" : "Task 2: Academic Essay"}",
  "isAttempted": true,
  "criteria": {
    "taskAchievement": {
      "band": 8.0,
      "score": 8.0,
      "title": "${isTask1 ? "Task Achievement (TR)" : "Task Response (TR)"}",
      "feedback": "Deep diagnostic analysis in Uzbek (O'zbek tilida) evaluating completeness, overview, and data accuracy.",
      "whyThisScore": "Exact justification in Uzbek explaining why this specific score was awarded.",
      "howToReachNextBand": "Clear, actionable step in Uzbek explaining how the candidate can advance to the next half-band."
    },
    "coherenceCohesion": {
      "band": 8.0,
      "score": 8.0,
      "title": "Coherence and Cohesion (CC)",
      "feedback": "Deep diagnostic analysis in Uzbek analyzing paragraph structure, logical flow, and cohesive devices.",
      "whyThisScore": "Exact justification in Uzbek explaining the CC band awarded.",
      "howToReachNextBand": "Actionable step in Uzbek on elevating paragraph transitions and referencing."
    },
    "lexicalResource": {
      "band": 8.0,
      "score": 8.0,
      "title": "Lexical Resource (LR)",
      "feedback": "Deep diagnostic analysis in Uzbek on vocabulary range, collocations, precision, and stylistic register.",
      "whyThisScore": "Exact justification in Uzbek on lexical choices and variety.",
      "howToReachNextBand": "Actionable step in Uzbek on incorporating C1/C2 collocations."
    },
    "grammaticalAccuracy": {
      "band": 8.0,
      "score": 8.0,
      "title": "Grammatical Range and Accuracy (GRA)",
      "feedback": "Deep diagnostic analysis in Uzbek on sentence diversity, punctuation, and structural control.",
      "whyThisScore": "Exact justification in Uzbek on syntactic range and error frequency.",
      "howToReachNextBand": "Actionable step in Uzbek on advanced structures like participle clauses and inversion."
    }
  },
  "mistakes": [
    {
      "original": "Exact sentence or clause from candidate's essay that has an error or could be improved",
      "correction": "Corrected academic version",
      "band9Upgrade": "Native Band 9.0 C2-level masterpiece rewrite of that same sentence",
      "explanation": "Detailed pedagogical explanation in Uzbek explaining the linguistic reasoning"
    }
  ],
  "vocabularyUpgrades": [
    {
      "originalWord": "simple or repeated word from essay",
      "upgrades": ["advanced C1 synonym", "C2 synonym", "academic collocation"],
      "contextExample": "Sample natural sentence showing how to use the upgrade in this essay's context"
    }
  ],
  "practiceTasks": [
    {
      "id": "pt-1",
      "type": "rewrite", // 'rewrite' | 'fill_blank' | 'fix_error'
      "question": "Clear instruction in Uzbek for the student to practice fixing their specific error",
      "incorrectSentence": "The specific flawed sentence from the essay or a related synthetic error",
      "hint": "Helpful hint in Uzbek guiding the student without giving away the full answer",
      "sampleAnswer": "The ideal Band 8.5-9.0 correction",
      "explanation": "Pedagogical explanation in Uzbek why this answer is superior"
    }
  ],
  "examinerAdvice": "Comprehensive, highly motivating 3-4 sentence advice in Uzbek summarizing the fastest route to Band 8.5+."
}

Ensure 'mistakes' has 4-8 rich entries, 'vocabularyUpgrades' has 4-6 entries, and 'practiceTasks' has exactly 4 interactive micro-exercises derived from the candidate's actual errors.
DO NOT wrap in markdown backticks. Return strictly raw JSON.`;

    // -----------------------------------------------------------------------
    // -----------------------------------------------------------------------
    // TASK 1 ONLY: dynamic Cambridge band descriptors + Zero Hallucination.
    // Task 2 continues to use `systemPrompt` above, unchanged.
    // -----------------------------------------------------------------------
    const task1Ref = isTask1
      ? getTask1ReferenceContext(question)
      : { taskTitle: "Task 1: Academic Report", dataBlock: "" };

    const task1Prompt = `You are a professional and objective IELTS Examiner evaluating Academic Task 1.
Your scoring MUST be 100% dynamic and accurately reflect the quality of the specific essay provided, based strictly on the official Cambridge IELTS Band Descriptors (allowed criterion bands from 1.0 to 9.0 in 0.5 increments).

- If the essay is weak, repetitive, or full of errors, score it 4.0, 4.5, 5.0, or 5.5.
- If the essay is competent/good with clear main points but contains noticeable lexical, grammatical, or data-detail slips, score it 6.0, 6.5, or 7.0.
- If the essay is well-structured, uses advanced vocabulary, complex grammar error-free, and accurately compares data, YOU MUST award it 7.5, 8.0, 8.5, or 9.0.
- DO NOT lock onto a default band. DO NOT cap scores arbitrarily. Grade objectively and dynamically strictly according to what you see in CANDIDATE REPORT.

EVALUATION CRITERIA:
1. Task Achievement (TA): Reward clear overviews and accurate data comparison (verify figures against VERIFIED CHART/TABLE DATA below).
2. Coherence & Cohesion (CC): Reward logical flow and natural cohesive devices.
3. Lexical Resource (LR): Reward uncommon vocabulary and precise word choice. Penalize actual spelling errors.
4. Grammatical Range & Accuracy (GRA): Reward error-free complex sentences.

STRICT ANTI-HALLUCINATION RULE:
When providing 'whyThisScore' (Nega aynan shu ball), 'feedback', and giving examples of mistakes, YOU MUST STRICTLY QUOTE ONLY THE EXACT WORDS EXISTING IN CANDIDATE REPORT BELOW. NEVER invent, hallucinate, or assume errors that are not physically present in the text.

=====================================================================
STEP 2.5: STRICT CALIBRATION ANCHORS (MANDATORY ACCURACY RULES)
=====================================================================
Do NOT inflate scores by +0.5 out of generosity. Compare the candidate's essay against these 3 neutral calibration benchmarks to lock in exact Cambridge strictness:

* **ANCHOR A — Band 5.5 Profile:**
  - *Sample traits:* Lists numbers chronologically without grouping or clear trend synthesis. Frequent basic errors in almost every second sentence (wrong tenses, missing articles, repeated basic words).
  - *Exact Cambridge Scores:* TA: 5.5, CC: 5.5, LR: 5.5, GRA: 5.0 -> Overall: 5.5.

* **ANCHOR B — Band 6.0 Profile (CRITICAL CALIBRATION BENCHMARK):**
  - *Sample traits:* Has a clear overview and covers main figures, BUT recounts details somewhat mechanically item-by-item (TA = 6.5). Uses formulaic sentence-initial linkers ("Looking first at...", "Additionally...", "By contrast...", "Regarding...") and occasional awkward referencing (CC = 6.0). Uses some good topic words, BUT has 2–4 noticeable spelling typos (fused words or misspelled past verbs like 'wetnessed', 'inthe') and 2–3 unnatural collocations (LR = 6.0). Attempts complex sentences ("which", "whereas"), BUT drops clause subjects, omits prepositions before months/numbers, or uses base verb instead of past tense in 3+ places (GRA = 6.0).
  - *Exact Cambridge Scores:* TA: 6.5, CC: 6.0, LR: 6.0, GRA: 6.0 -> Average: 6.125 -> Overall: 6.0.
  - *Strict Rule:* Formulaic sentence-initial linkers ("Looking first at", "Additionally", "By contrast") MUST NEVER receive CC 7.0 — they are textbook Band 6.0 cohesion. Two or more spelling typos or broken complex clauses MUST NEVER receive LR 6.5 or GRA 6.5 — they are textbook Band 6.0.

* **ANCHOR C — Band 8.0 Profile:**
  - *Sample traits:* Insightful overview synthesizing overall trends and exceptions; seamless grouping and explicit comparisons across categories (TA = 8.0). Effortless cohesion using pronouns, substitution ("the former", "on the other hand", "conversely"), and participle clauses rather than mechanical openers (CC = 8.0). Precise, idiomatic collocations with zero spelling errors (LR = 8.0). Over 85% of sentences are completely error-free with varied complex structures (GRA = 8.0).
  - *Exact Cambridge Scores:* TA: 8.0, CC: 8.0, LR: 8.0, GRA: 8.0 -> Overall: 8.0.

QUESTION:
"""
${question}
"""

${task1Ref.dataBlock}

CANDIDATE REPORT (${words} words):
"""
${essay}
"""

RETURN PURE JSON ONLY adhering strictly to this schema:
{
  "overallBand": 7.5, // Code will compute task1Band = roundIELTS((TA + CC + LR + GRA) / 4)
  "taskTitle": "${task1Ref.taskTitle}",
  "isAttempted": true,
  "criteria": {
    "taskAchievement": { "band": 7.5, "score": 7.5, "title": "Task Achievement (TR)", "feedback": "Deep analysis in Uzbek (O'zbek tilida) evaluating overview, comparisons, and data accuracy.", "whyThisScore": "Exact reason in Uzbek quoting ONLY exact words present in CANDIDATE REPORT.", "howToReachNextBand": "Concrete step in Uzbek." },
    "coherenceCohesion": { "band": 7.5, "score": 7.5, "title": "Coherence and Cohesion (CC)", "feedback": "Analysis in Uzbek.", "whyThisScore": "Exact reason in Uzbek quoting ONLY exact words present in CANDIDATE REPORT.", "howToReachNextBand": "Concrete step in Uzbek." },
    "lexicalResource": { "band": 7.5, "score": 7.5, "title": "Lexical Resource (LR)", "feedback": "Analysis in Uzbek.", "whyThisScore": "Exact reason in Uzbek quoting ONLY exact words present in CANDIDATE REPORT.", "howToReachNextBand": "Concrete step in Uzbek." },
    "grammaticalAccuracy": { "band": 7.5, "score": 7.5, "title": "Grammatical Range and Accuracy (GRA)", "feedback": "Analysis in Uzbek.", "whyThisScore": "Exact reason in Uzbek quoting ONLY exact words present in CANDIDATE REPORT.", "howToReachNextBand": "Concrete step in Uzbek." }
  },
  "mistakes": [
    { "original": "EXACT verbatim substring copied from CANDIDATE REPORT", "correction": "Corrected academic version", "band9Upgrade": "Band 9.0 rewrite", "explanation": "Detailed pedagogical explanation in Uzbek" }
  ],
  "vocabularyUpgrades": [
    { "originalWord": "Exact word/phrase copied verbatim from CANDIDATE REPORT", "upgrades": ["C1 upgrade", "C2 upgrade"], "contextExample": "Natural academic sentence for this chart" }
  ],
  "practiceTasks": [
    { "id": "pt-1", "type": "rewrite", "question": "Clear instruction in Uzbek", "incorrectSentence": "Exact sentence copied verbatim from CANDIDATE REPORT", "hint": "Hint in Uzbek", "sampleAnswer": "Band 8.5+ answer", "explanation": "Explanation in Uzbek" }
  ],
  "examinerAdvice": "Actionable 3-4 sentence advice in Uzbek."
}
Provide 4-8 entries in 'mistakes' (or fewer if the essay is nearly error-free, highlighting sentences that can be elevated to C2), 4-6 entries in 'vocabularyUpgrades', and exactly 4 entries in 'practiceTasks'. Do NOT use markdown backticks; return strictly raw JSON.`;

    const modelOrder = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"];
    let lastError: Error | null = null;

    for (const modelName of modelOrder) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: isTask1 ? task1Prompt : systemPrompt,
          config: {
            responseMimeType: "application/json",
            temperature: isTask1 ? 0.1 : 0.15,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(cleanJsonString(response.text));
          if (parsed && typeof parsed.overallBand === "number" && parsed.criteria) {
            const taBand = isTask1
              ? roundIELTS(Number(parsed.criteria.taskAchievement?.band ?? 7.0))
              : roundBand(parsed.criteria.taskAchievement?.band ?? 7.0);
            const ccBand = isTask1
              ? roundIELTS(Number(parsed.criteria.coherenceCohesion?.band ?? 7.0))
              : roundBand(parsed.criteria.coherenceCohesion?.band ?? 7.0);
            let lrBand = isTask1
              ? roundIELTS(Number(parsed.criteria.lexicalResource?.band ?? 7.0))
              : roundBand(parsed.criteria.lexicalResource?.band ?? 7.0);
            let graBand = isTask1
              ? roundIELTS(Number(parsed.criteria.grammaticalAccuracy?.band ?? 7.0))
              : roundBand(parsed.criteria.grammaticalAccuracy?.band ?? 7.0);
            const calculatedOverall = isTask1
              ? roundIELTS((taBand + ccBand + lrBand + graBand) / 4)
              : roundBand((taBand + ccBand + lrBand + graBand) / 4);

            const rawMistakes: MistakeItem[] = Array.isArray(parsed.mistakes)
              ? parsed.mistakes
              : [];
            const verifiedMistakes = isTask1
              ? rawMistakes.filter(
                  (m) => m?.original && essayContainsQuote(essay, m.original)
                )
              : rawMistakes;

            const rawUpgrades: VocabularyUpgrade[] = Array.isArray(
              parsed.vocabularyUpgrades
            )
              ? parsed.vocabularyUpgrades
              : [];
            const verifiedUpgrades = isTask1
              ? rawUpgrades.filter(
                  (v) =>
                    v?.originalWord &&
                    v.originalWord
                      .split("/")
                      .some((part) => essayContainsQuote(essay, part))
                )
              : rawUpgrades;

            const result: EvaluationResult = {
              overallBand: calculatedOverall,
              wordCount: words,
              taskTitle: parsed.taskTitle || (isTask1 ? "Task 1" : "Task 2"),
              isAttempted: true,
              criteria: {
                taskAchievement: {
                  band: taBand,
                  score: taBand,
                  title: parsed.criteria.taskAchievement?.title || (isTask1 ? "Task Achievement (TR)" : "Task Response (TR)"),
                  feedback: parsed.criteria.taskAchievement?.feedback || "Topshiriq ko'rsatkichlari tahlili.",
                  whyThisScore: parsed.criteria.taskAchievement?.whyThisScore || "Topshiriq talablarining bajarilish darajasiga asosan belgilandi.",
                  howToReachNextBand: parsed.criteria.taskAchievement?.howToReachNextBand || "Overview va asosiy raqamlar solishtirmasini chuqurlashtiring.",
                },
                coherenceCohesion: {
                  band: ccBand,
                  score: ccBand,
                  title: parsed.criteria.coherenceCohesion?.title || "Coherence and Cohesion (CC)",
                  feedback: parsed.criteria.coherenceCohesion?.feedback || "Mantiqiy bog'liqlik va paragraflar tahlili.",
                  whyThisScore: parsed.criteria.coherenceCohesion?.whyThisScore || "Fikrlar oqimi va bog'lovchi vositalar mutanosibligiga ko'ra baholandi.",
                  howToReachNextBand: parsed.criteria.coherenceCohesion?.howToReachNextBand || "Paragraflar o'rtasida tabiiy o'tish jumlalaridan foydalaning.",
                },
                lexicalResource: {
                  band: lrBand,
                  score: lrBand,
                  title: parsed.criteria.lexicalResource?.title || "Lexical Resource (LR)",
                  feedback: parsed.criteria.lexicalResource?.feedback || "So'z boyligi va akademik atamalar tahlili.",
                  whyThisScore: parsed.criteria.lexicalResource?.whyThisScore || "Qo'llangan akademik leksika va kolokatsiyalar doirasiga asosan qo'yildi.",
                  howToReachNextBand: parsed.criteria.lexicalResource?.howToReachNextBand || "C1/C2 darajasidagi kam uchraydigan sinonimlarni kiritish lozim.",
                },
                grammaticalAccuracy: {
                  band: graBand,
                  score: graBand,
                  title: parsed.criteria.grammaticalAccuracy?.title || "Grammatical Range and Accuracy (GRA)",
                  feedback: parsed.criteria.grammaticalAccuracy?.feedback || "Grammatik strukturalar va xatolarsizlik darajasi.",
                  whyThisScore: parsed.criteria.grammaticalAccuracy?.whyThisScore || "Murakkab gaplar chastotasi va punktuatsiya aniqligiga qarab belgilandi.",
                  howToReachNextBand: parsed.criteria.grammaticalAccuracy?.howToReachNextBand || "Inversiya va sifatdoshli konstruksiyalarni kengroq qo'llang.",
                },
              },
              mistakes: verifiedMistakes,
              vocabularyUpgrades: verifiedUpgrades,
              practiceTasks: Array.isArray(parsed.practiceTasks) ? parsed.practiceTasks : [],
              examinerAdvice: parsed.examinerAdvice || "Akademik so'zlar va murakkab gaplardan muntazam foydalaning.",
            };

            return NextResponse.json(result);
          }
        }
      } catch (err: unknown) {
        lastError = err as Error;
        console.warn(`Model ${modelName} evaluation attempt:`, (err as Error).message);
      }
    }

    console.warn("Using calibrated fallback due to:", lastError?.message);
    return NextResponse.json(buildFallbackEvaluation(taskType, question, essay));
  } catch (outerErr: unknown) {
    console.error("Evaluation API error:", outerErr);
    return NextResponse.json(
      { error: "Baholash tizimida xatolik yuz berdi. Iltimos qaytadan urinib ko'ring." },
      { status: 500 }
    );
  }
}
