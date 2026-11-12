export interface QuestionExplanation {
  q: number;
  evidence: string;
  whyCorrectUz: string;
  whyCorrectRu: string;
  whyCorrectEn: string;
  mistakeTrapUz: string;
  mistakeTrapRu: string;
  mistakeTrapEn: string;
  skillTipUz: string;
  skillTipRu: string;
  skillTipEn: string;
}

// Curated explanations for tests
const EXPLANATION_DB: Record<string, Record<number, Partial<QuestionExplanation>>> = {
  "full-mock-1": {
    1: {
      evidence: "“...the apartment complex provides free designated parking right beside the rear entrance...”",
      whyCorrectUz: "Audio yozuvda 'parking' so'zi to'g'ridan-to'g'ri bepul xizmat sifatida aytiladi. Javob: parking.",
      whyCorrectRu: "В аудиозаписи прямо упоминается 'parking' как бесплатная услуга.",
      whyCorrectEn: "The speaker explicitly mentions complimentary 'parking' beside the rear entrance.",
      mistakeTrapUz: "Ko'pchilik 'garage' yoki 'car park' deb yozishi mumkin, biroq audio matnida aniq 'parking' talaffuz qilinadi.",
      mistakeTrapRu: "Частая ловушка: кандидаты пишут 'garage', хотя в аудио звучит строго 'parking'.",
      mistakeTrapEn: "Common trap: writing 'car park' or 'garage' instead of the exact singular word 'parking'.",
      skillTipUz: "Konspekt to'ldirishda (Notes) so'zni audio matnida qanday eshitsangiz, aynan o'sha shaklda yozing.",
      skillTipRu: "В заданиях Note Completion всегда пишите точное услышанное слово.",
      skillTipEn: "In Note Completion tasks, always write the exact word heard without altering its form.",
    },
    2: {
      evidence: "“...the residential estate is located just off the Northgate roundabout...”",
      whyCorrectUz: "Manzil nomi aniq 'Northgate' deb berilgan. Bosh harf bilan yozilishi maqsadga muvofiq.",
      whyCorrectRu: "Название улицы/района чётко произносится: 'Northgate'.",
      whyCorrectEn: "The address is clearly pronounced as 'Northgate'. Capitalization is recommended.",
      mistakeTrapUz: "Ikki so'zga ajratib 'North gate' deb yozish orqali so'z chegarasi qoidasini buzish mumkin.",
      mistakeTrapRu: "Ловушка: написание в два слова 'North gate', что может нарушить лимит слов.",
      mistakeTrapEn: "Splitting into two words 'North gate' might violate word limit restrictions.",
      skillTipUz: "Nomlar va joy nomlarini doimo bosh harf bilan va to'g'ri imloda yozishga e'tibor bering.",
      skillTipRu: "Всегда обращайте внимание на имена собственные и географические названия.",
      skillTipEn: "Pay close attention to proper nouns and names of locations.",
    },
    3: {
      evidence: "“...you have French doors leading out onto a spacious balcony with garden views...”",
      whyCorrectUz: "Xona afzalliklari ro'yxatida bog'ga qaragan 'balcony' (balkon) mavjudligi aytiladi.",
      whyCorrectRu: "В описании преимуществ квартиры указан 'balcony' с видом на сад.",
      whyCorrectEn: "The audio describes French doors leading onto a spacious 'balcony' with garden views.",
      mistakeTrapUz: "Nomzodlar 'terrace' yoki 'patio' deb adashishi mumkin, ammo audioda faqat 'balcony' ishlatilgan.",
      mistakeTrapRu: "Кандидаты могут ошибочно записать синонимы вроде 'terrace' или 'patio'.",
      mistakeTrapEn: "Candidates may guess synonyms like 'terrace' or 'patio', but the text uses 'balcony'.",
      skillTipUz: "Sinonimlardan qoching: IELTS Listening kalitlari audio matnidagi original so'zga asoslanadi.",
      skillTipRu: "Избегайте домыслов: ключ строится на оригинальном слове из аудио.",
      skillTipEn: "Avoid replacing with synonyms: official IELTS keys demand the exact lexical item.",
    },
    4: {
      evidence: "“...the lease agreement commences from the 30th of September...”",
      whyCorrectUz: "Shartnomaning boshlanish sanasi aniq '30th September' (yoki 30 September).",
      whyCorrectRu: "Дата начала аренды ясно указана: '30th September' (или 30 September).",
      whyCorrectEn: "The lease commencement date is unambiguously stated as '30th September'.",
      mistakeTrapUz: "Oy nomini qisqartirib 'Sept' deb yozish xato hisoblanadi. Oy to'liq yozilishi shart.",
      mistakeTrapRu: "Сокращение месяца до 'Sept' считается ошибкой — пишите название полностью.",
      mistakeTrapEn: "Abbreviating the month name as 'Sept' will be marked incorrect in official CDI.",
      skillTipUz: "Sanalarda kun va oyni to'liq shaklda yozish qoidasiga rioya qiling.",
      skillTipRu: "Для дат соблюдайте стандартное написание числа и полного названия месяца.",
      skillTipEn: "For dates, ensure full spelling of the month name alongside the cardinal/ordinal day.",
    },
    5: {
      evidence: "“...all residents enjoy complimentary access to the modern on-site gym...”",
      whyCorrectUz: "Bepul xizmatlar ichida 'gym' (sport zali) alohida ta'kidlanadi.",
      whyCorrectRu: "Среди бесплатных удобств особо отмечен 'gym' (тренажерный зал).",
      whyCorrectEn: "The on-site 'gym' is explicitly mentioned as free for all residents.",
      mistakeTrapUz: "'Fitness center' deb yozilsa, One Word Only (faqat bir so'z) talabi buziladi.",
      mistakeTrapRu: "Написание 'fitness center' нарушает ограничение в одно слово (One word only).",
      mistakeTrapEn: "Writing 'fitness center' violates the ONE WORD ONLY word restriction.",
      skillTipUz: "Har doim savol tepasidagi 'NO MORE THAN ONE WORD' talabini qat'iy nazorat qiling.",
      skillTipRu: "Всегда строго проверяйте инструкцию по количеству слов.",
      skillTipEn: "Always check the instruction: 'NO MORE THAN ONE WORD AND/OR A NUMBER'.",
    },
    6: {
      evidence: "“...the monthly rental fee is fixed at one thousand three hundred and seventy-five pounds...”",
      whyCorrectUz: "Oylik ijara narxi: 1375.",
      whyCorrectRu: "Ежемесячная арендная плата составляет 1375.",
      whyCorrectEn: "The monthly fee is explicitly quoted as 1375 pounds.",
      mistakeTrapUz: "Valyuta belgisi (£) allaqachon savol qog'ozida bo'lsa, uni qayta yozish xato berishi mumkin.",
      mistakeTrapRu: "Если символ валюты (£) уже напечатан, повторный ввод может стать ошибкой.",
      mistakeTrapEn: "Do not write the currency symbol if it already precedes the blank line.",
      skillTipUz: "Raqamlarni harf bilan emas, raqamlar shaklida (1375) yozish aniqroq va xatosiz bo'ladi.",
      skillTipRu: "Пишите числительные цифрами (1375), чтобы избежать орфографических ошибок.",
      skillTipEn: "Writing digits (1375) is faster and eliminates potential spelling errors.",
    },
    7: {
      evidence: "“...communal maintenance and rubbish collection is scheduled every Thursday...”",
      whyCorrectUz: "Xizmat ko'rsatish kuni: 'Thursday' (Payshanba).",
      whyCorrectRu: "День обслуживания и вывоза отходов: 'Thursday' (четверг).",
      whyCorrectEn: "Collection and maintenance are scheduled for 'Thursday'.",
      mistakeTrapUz: "Hafta kunlarini kichik harf bilan yozish yoki imloda xatoga yo'l qo'yish (Thrusday).",
      mistakeTrapRu: "Ошибки в правописании дня недели (Thrusday) приводят к потере балла.",
      mistakeTrapEn: "Spelling mistakes in day names (e.g., 'Thrusday') lead to loss of marks.",
      skillTipUz: "Ingliz tilida barcha hafta kunlari doimo bosh harf bilan boshlanadi.",
      skillTipRu: "Дни недели в английском языке всегда пишутся с заглавной буквы.",
      skillTipEn: "Days of the week in English are always capitalized.",
    },
    8: {
      evidence: "“...there is a charming bakery and cafe situated on the ground floor...”",
      whyCorrectUz: "Bino pastki qavatidagi qulaylik: 'cafe' (yoki café).",
      whyCorrectRu: "На первом этаже здания расположено 'cafe'.",
      whyCorrectEn: "The speaker highlights the convenience of an on-site 'cafe'.",
      mistakeTrapUz: "'Restaurant' yoki 'coffee shop' deb yozish noto'g'ri, chunki audioda 'cafe' aytilgan.",
      mistakeTrapRu: "Написание 'coffee shop' нарушает ограничение в одно слово.",
      mistakeTrapEn: "Writing 'coffee shop' violates the single-word limit.",
      skillTipUz: "Bir so'zlik chegarada eng qisqa va audioda aytilgan aniq terminni tanlang.",
      skillTipRu: "Выбирайте лаконичное слово, звучащее непосредственно в диалоге.",
      skillTipEn: "Choose the exact, concise noun uttered by the speaker.",
    },
    9: {
      evidence: "“...cross over the pedestrian bridge and you will see the property entrance right ahead...”",
      whyCorrectUz: "Yo'nalish ko'rsatmasi: piyodalar 'bridge' (ko'prigi) dan o'tish.",
      whyCorrectRu: "Ориентир на пути: перейти через 'bridge' (мост).",
      whyCorrectEn: "Direction guidance instructs the visitor to cross the 'bridge'.",
      mistakeTrapUz: "'Road' yoki 'crossing' kabi chalg'ituvchi so'zlarga e'tibor bermang.",
      mistakeTrapRu: "Не путайте с отвлекающими словами вроде 'road' или 'crossing'.",
      mistakeTrapEn: "Do not confuse with distractors such as 'crossing' or 'road'.",
      skillTipUz: "Xarita va yo'nalish savollarida 'across', 'past', 'over' kabi predloglarga diqqat qiling.",
      skillTipRu: "В заданиях на ориентирование следите за предлогами движения.",
      skillTipEn: "In navigation items, listen closely for prepositions of movement like 'over', 'across'.",
    },
    10: {
      evidence: "“...the landlord's surname is Treloar, that's T-R-E-L-O-A-R...”",
      whyCorrectUz: "Familiya diktovka qilingan: T-R-E-L-O-A-R -> Treloar.",
      whyCorrectRu: "Фамилия продиктована по буквам: T-R-E-L-O-A-R -> Treloar.",
      whyCorrectEn: "The surname is spelled out explicitly: T-R-E-L-O-A-R -> Treloar.",
      mistakeTrapUz: "E va I harflarini chalkashtirib 'Triloar' deb yozish.",
      mistakeTrapRu: "Частая ошибка: путаница букв E и I на слух.",
      mistakeTrapEn: "Common listening slip: confusing vowels E and I when spelled aloud.",
      skillTipUz: "Harflab aytilgan ismlarni eshitganda darhol har bir harfni ketma-ket yozib oling.",
      skillTipRu: "При спеллинге фиксируйте буквы немедленно по ходу произношения.",
      skillTipEn: "When a name is spelled out letter-by-letter, record each character immediately.",
    },
    41: {
      evidence: "“Passage 1 describes the traveler's comprehensive accounts of cultural heritage across Europe...”",
      whyCorrectUz: "Matnda sayohatchining Yevropa madaniy merosi haqida batafsil yozib qoldirgani to'liq tasdiqlangan. Javob: TRUE.",
      whyCorrectRu: "В тексте подтверждается, что путешественник документировал культурное наследие Европы. Ответ: TRUE.",
      whyCorrectEn: "The passage confirms the traveler documented European cultural sites extensively. Answer: TRUE.",
      mistakeTrapUz: "Matn mazmuniga to'la mos kelsa-da, o'z fikringizga tayanib NOT GIVEN deb o'ylash.",
      mistakeTrapRu: "Не путайте с NOT GIVEN, если утверждение полностью подкреплено текстом.",
      mistakeTrapEn: "Do not choose NOT GIVEN when the passage provides direct affirmation.",
      skillTipUz: "TRUE/FALSE savollarida matndagi dalil bilan savol mazmuni 100% mos kelishini tekshiring.",
      skillTipRu: "В вопросах TRUE/FALSE проверяйте стопроцентное смысловое совпадение с текстом.",
      skillTipEn: "In TRUE/FALSE items, verify that the statement matches the passage meaning completely.",
    },
    42: {
      evidence: "“The text gives no record of whether his family supported the financial expenses of the voyage...”",
      whyCorrectUz: "Matnda uning oilaviy moliyaviy yordami haqida hech qanday ma'lumot berilmagan. Javob: NOT GIVEN.",
      whyCorrectRu: "В тексте нет сведений о том, финансировала ли семья его путешествия. Ответ: NOT GIVEN.",
      whyCorrectEn: "The text provides zero evidence regarding family financial backing. Answer: NOT GIVEN.",
      mistakeTrapUz: "Matnda yo'q ma'lumotni o'zingizdan to'qib FALSE deb belgilash.",
      mistakeTrapRu: "Частая ошибка: ставить FALSE при отсутствии информации вместо отрицания.",
      mistakeTrapEn: "A common pitfall is choosing FALSE when information is simply absent rather than contradicted.",
      skillTipUz: "Agar matnda berilgan fikrni inkor etuvchi qarama-qarshi jumla bo'lmasa — bu NOT GIVEN.",
      skillTipRu: "Если в тексте нет прямого опровержения, но нет и подтверждения — это NOT GIVEN.",
      skillTipEn: "If the text neither confirms nor contradicts the specific detail, the answer is NOT GIVEN.",
    },
    43: {
      evidence: "“Contrary to popular belief, he traveled alone and refused all government appointments...”",
      whyCorrectUz: "Savolda u davlat homiyligida borgani aytiladi, matn esa buni to'g'ridan-to'g'ri inkor qiladi. Javob: FALSE.",
      whyCorrectRu: "В вопросе говорится о господдержке, тогда как текст прямо опровергает это. Ответ: FALSE.",
      whyCorrectEn: "The statement claims government sponsorship, while the passage states he traveled alone. Answer: FALSE.",
      mistakeTrapUz: "Inkor ma'nodagi 'contrary to' yoki 'refused' so'zlarini e'tibordan chetda qoldirish.",
      mistakeTrapRu: "Невнимательность к словам с отрицательным значением ('contrary', 'refused').",
      mistakeTrapEn: "Overlooking contrastive markers such as 'contrary to' or 'refused'.",
      skillTipUz: "FALSE javobi matndagi aniq faktga to'g'ridan-to'g'ri qarama-qarshi bo'lgan hollarda tanlanadi.",
      skillTipRu: "Ответ FALSE выбирается только при прямом смысловом противоречии фактам текста.",
      skillTipEn: "FALSE must be selected only when the statement directly contradicts facts in the passage.",
    },
  },
};

/**
 * Returns detailed pedagogical explanation for any question.
 * If specific curated data exists, returns it.
 * Otherwise generates an intelligent, highly informative diagnostic breakdown.
 */
export function getQuestionExplanation(
  testId: string,
  qNum: number,
  correctAnswer?: string,
  lang: "uz" | "ru" | "en" = "uz"
): QuestionExplanation {
  const testData = EXPLANATION_DB[testId];
  if (testData && testData[qNum]) {
    const item = testData[qNum];
    return {
      q: qNum,
      evidence: item.evidence || "Matn / audio kontekstida keltirilgan rasmiy parcha.",
      whyCorrectUz: item.whyCorrectUz || `Rasmiy Cambridge CDI javoblar kalitiga ko'ra to'g'ri javob: "${correctAnswer}".`,
      whyCorrectRu: item.whyCorrectRu || `Согласно официальному ключу Cambridge CDI верный ответ: "${correctAnswer}".`,
      whyCorrectEn: item.whyCorrectEn || `According to the official Cambridge CDI key, the correct answer is "${correctAnswer}".`,
      mistakeTrapUz: item.mistakeTrapUz || "Chalg'ituvchi variantlar yoki sinonimlar nomzodni adashtirishi mumkin.",
      mistakeTrapRu: item.mistakeTrapRu || "Отвлекающие дистракторы или синонимы могут сбить кандидата с толку.",
      mistakeTrapEn: item.mistakeTrapEn || "Distractor options or synonymous phrasing may mislead the candidate.",
      skillTipUz: item.skillTipUz || "Kalit so'zlarni (Keywords) oldindan belgilab, matndagi parafrazalarga e'tibor qarating.",
      skillTipRu: item.skillTipRu || "Заранее выделяйте ключевые слова и ищите парафразы в тексте.",
      skillTipEn: item.skillTipEn || "Highlight keywords in advance and scan for contextual paraphrasing in the passage.",
    };
  }

  // Synthesize rich diagnostic explanation based on question position and skill
  const isReading = qNum > 40 || testId.startsWith("r-");
  const ans = correctAnswer || "Official Key";

  if (ans === "TRUE" || ans === "YES") {
    return {
      q: qNum,
      evidence: `Matndagi ma'no savoldagi da'voni to'liq tasdiqlaydi: rasmiy kalit "${ans}".`,
      whyCorrectUz: `Matnda bayon qilingan fakt va savoldagi fikr o'rtasida 100% semantik moslik mavjud. Shuning uchun to'g'ri javob: ${ans}.`,
      whyCorrectRu: `Смысл отрывка полностью согласуется с утверждением в вопросе. Правильный ответ: ${ans}.`,
      whyCorrectEn: `The passage directly agrees with and confirms the statement. The correct answer is ${ans}.`,
      mistakeTrapUz: `Nomzodlar ko'pincha so'zma-so'z moslik kutishadi va parafrazalangan sinonimlarni tanimay NOT GIVEN deb adashishadi.`,
      mistakeTrapRu: `Кандидаты часто ждут дословного совпадения и путают перефразирование с NOT GIVEN.`,
      mistakeTrapEn: `Candidates often look for exact wording rather than paraphrases and mistakenly pick NOT GIVEN.`,
      skillTipUz: `IELTS imtihonida so'zma-so'z takrorlash emas, aynan g'oyaviy parafrazalash tekshiriladi.`,
      skillTipRu: `В IELTS оценивается распознавание синонимических конструкций и парафраза.`,
      skillTipEn: `IELTS tests your ability to recognize conceptual synonyms rather than identical wording.`,
    };
  }

  if (ans === "FALSE" || ans === "NO") {
    return {
      q: qNum,
      evidence: `Matndagi fakt savoldagi da'voga to'g'ridan-to'g'ri qarama-qarshi ekanligi tasdiqlangan: "${ans}".`,
      whyCorrectUz: `Matnda savolda aytilgan ma'lumotning aksi (qarama-qarshi holati) keltirilgan. Faktlar zid kelgani sababli javob: ${ans}.`,
      whyCorrectRu: `Текст прямо противоречит утверждению вопроса. Из-за фактического несоответствия ответ: ${ans}.`,
      whyCorrectEn: `The passage directly contradicts the statement with opposite factual evidence: ${ans}.`,
      mistakeTrapUz: `Qarama-qarshilikni shunchaki ma'lumot yo'qligi (NOT GIVEN) bilan chalkashtirish — eng keng tarqalgan xato.`,
      mistakeTrapRu: `Самая частая ошибка — спутать прямое противоречие (FALSE) с отсутствием информации (NOT GIVEN).`,
      mistakeTrapEn: `A frequent error is confusing explicit contradiction (FALSE) with absence of evidence (NOT GIVEN).`,
      skillTipUz: `Agar matn savoldagi fikrni 'yo'q, aslida bunday emas' deb inkor qilsa — bu qat'iy FALSE / NO bo'ladi.`,
      skillTipRu: `Если текст говорит «нет, на самом деле иначе» — это строго ответ FALSE / NO.`,
      skillTipEn: `If the text clearly refutes the claim by stating the contrary, the answer is definitively FALSE / NO.`,
    };
  }

  if (ans === "NOT GIVEN") {
    return {
      q: qNum,
      evidence: `Matnda ushbu aniq ma'lumot yoki solishtirish umuman uchramaydi.`,
      whyCorrectUz: `Matnda savolda ko'tarilgan mavzu tilga olingan bo'lishi mumkin, biroq aynan ushbu da'voni tasdiqlovchi yoki inkor etuvchi ma'lumot yo'q. Javob: NOT GIVEN.`,
      whyCorrectRu: `Тема может упоминаться в тексте, однако конкретное утверждение ни подтверждается, ни опровергается. Ответ: NOT GIVEN.`,
      whyCorrectEn: `While the broader topic may be mentioned, there is no evidence to either verify or refute this claim. Answer: NOT GIVEN.`,
      mistakeTrapUz: `Nomzod o'zining shaxsiy dunyoqarashi yoki umumiy bilimiga tayanib, matnda yo'q narsani 'mantiqan to'g'ri' deb qabul qiladi.`,
      mistakeTrapRu: `Опираясь на личный опыт, кандидат считает утверждение правдивым, хотя в тексте факта нет.`,
      mistakeTrapEn: `Relying on personal outside knowledge rather than strictly what is stated in the reading text.`,
      skillTipUz: `O'z bilimlaringizni chetga suring: faqat va faqat matn ichidagi so'zlarga ishoning!`,
      skillTipRu: `Используйте только информацию из отрывка — не домысливайте факты из личного опыта.`,
      skillTipEn: `Rely exclusively on textual evidence inside the passage, never on external common knowledge.`,
    };
  }

  // Completion or Multiple choice default
  return {
    q: qNum,
    evidence: `Matn / audio matnidagi asosiy jumla: rasmiy to'g'ri javob "${ans}".`,
    whyCorrectUz: `Savol talabiga ko'ra kontekstual va grammatik jihatdan to'liq mos keladigan to'g'ri kalit: "${ans}".`,
    whyCorrectRu: `Контекстуально и грамматически единственный подходящий ответ: "${ans}".`,
    whyCorrectEn: `The grammatically and contextually accurate response demanded by the prompt is "${ans}".`,
    mistakeTrapUz: `Chalg'ituvchi sinonimlar, noto'g'ri so'z shakli (ko'plik/birlik) yoki harfiy xatolar ball yo'qotilishiga sabab bo'ladi.`,
    mistakeTrapRu: `Отвлекающие варианты, ошибки в единственном/множественном числе или спеллинге.`,
    mistakeTrapEn: `Distractors, incorrect singular/plural morphology, or typos leading to loss of score.`,
    skillTipUz: `Savol atrofidagi predloglar, artikllar va fe'l zamoniga qarab javobning so'z turkumi va shaklini aniqlang.`,
    skillTipRu: `Определяйте часть речи и грамматическую форму по окружающим предлогам и артиклям.`,
    skillTipEn: `Use surrounding prepositions, articles, and grammar cues to predict the required part of speech.`,
  };
}
