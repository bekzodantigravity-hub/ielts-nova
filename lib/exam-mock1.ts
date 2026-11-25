import passagesJson from "./exam-mock1-passages.json";
import type {
  ExamAnswerItem,
  ListeningPartData,
  MockExamConfig,
  ReadingPassageData,
  WritingTask1Config,
} from "./exam-types";

export const DEFAULT_EXAM_PASSWORD = "bugunseningkuning";
export const MOCK_1_ID = "mock-1";

export const MOCK_1_LISTENING_PARTS: ListeningPartData[] = [
  {
    part: 1,
    title: "Part 1",
    subtitle: "Eco-farm Tour",
    audioUrl: "/audio/mock1/part1.mp3",
    questionRange: [1, 10],
    sections: [
      {
        kind: "note_box",
        questionRange: [1, 5],
        instruction:
          "Complete the note below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
        boxTitle: "Eco-farm Tour",
        groups: [
          {
            lines: [
              { label: "Dates offered:", prefix: "6–20 June" },
              { label: "Name:", prefix: "Helen", questionNumber: 1 },
              {
                label: "Email address:",
                prefix: "helen123@",
                questionNumber: 2,
                suffix: ".com",
              },
              {
                label: "Home address:",
                questionNumber: 3,
                suffix: "Road, Sheffield",
              },
              { label: "Source of information:", questionNumber: 4 },
              { label: "Membership number:", questionNumber: 5 },
            ],
          },
        ],
      },
      {
        kind: "table",
        questionRange: [6, 10],
        instruction:
          "Complete the table below. Write ONE WORD ONLY for each answer.",
        headers: ["Category", "Recommendations", "Customer preferences"],
        rows: [
          {
            category: "Age",
            recommendation: { prefix: "From 16 to 62" },
            preference: { prefix: "Children: 6 and 4" },
          },
          {
            category: "Accommodation type",
            recommendation: { prefix: "lodges" },
            preference: { prefix: "a", questionNumber: 6 },
          },
          {
            category: "Accommodation location",
            recommendation: { prefix: "Lakeside" },
            preference: {
              prefix: "Near the farm or in the",
              questionNumber: 7,
            },
          },
          {
            category: "Food",
            recommendation: { prefix: "A wide range of food" },
            preference: {
              prefix: "Meat, seafood, and",
              questionNumber: 8,
              suffix: "food",
            },
          },
          {
            category: "Transport",
            recommendation: { prefix: "Train or", questionNumber: 9 },
            preference: { prefix: "Ferry and van" },
          },
          {
            category: "Courses",
            recommendation: { prefix: "Flower planting courses" },
            preference: {
              prefix: "Active courses (e.g. a",
              questionNumber: 10,
              suffix: "course)",
            },
          },
        ],
      },
    ],
  },
  {
    part: 2,
    title: "Part 2",
    subtitle: "Muna Island",
    audioUrl: "/audio/mock1/part2.mp3",
    questionRange: [11, 20],
    sections: [
      {
        kind: "mcq",
        questionRange: [11, 20],
        instruction: "Choose the correct letter, A, B or C.",
        title: "Muna Island",
        items: [
          {
            number: 11,
            prompt: "How much should visitors tip taxi drivers on the island?",
            options: [
              { key: "A", text: "as much as they feel right" },
              { key: "B", text: "no tip at all" },
              { key: "C", text: "10% tip" },
            ],
          },
          {
            number: 12,
            prompt: "What is mentioned about the medical service on the island?",
            options: [
              { key: "A", text: "It will be charged." },
              {
                key: "B",
                text: "Visitors should contact their insurance company.",
              },
              { key: "C", text: "Visitors have to find the hotel doctor." },
            ],
          },
          {
            number: 13,
            prompt: "The tour guide says the tap water",
            options: [
              { key: "A", text: "contains no mineral." },
              { key: "B", text: "is unsafe." },
              { key: "C", text: "has an unusual taste." },
            ],
          },
          {
            number: 14,
            prompt: "What point is made about bottled water?",
            options: [
              { key: "A", text: "It is expensive." },
              { key: "B", text: "The bottle is not always sealed." },
              { key: "C", text: "It isn't sold everywhere." },
            ],
          },
          {
            number: 15,
            prompt: "What feature is mentioned about the bus on the island?",
            options: [
              { key: "A", text: "frequent" },
              { key: "B", text: "not punctual" },
              { key: "C", text: "not comfortable" },
            ],
          },
          {
            number: 16,
            prompt:
              "How can visitors know the destination of the bus on the island?",
            options: [
              { key: "A", text: "find it in front of the bus" },
              { key: "B", text: "check it with the driver" },
              { key: "C", text: "find it at the bus stop" },
            ],
          },
          {
            number: 17,
            prompt:
              "What does the tour guide advise visitors to do before renting a car?",
            options: [
              { key: "A", text: "find a taxi company" },
              { key: "B", text: "go to the hotel reception" },
              { key: "C", text: "compare the price in advance" },
            ],
          },
          {
            number: 18,
            prompt:
              "When they rent a car, it's important for visitors to know",
            options: [
              { key: "A", text: "the mileage is limited." },
              { key: "B", text: "what is included in the price." },
              { key: "C", text: "fuel is included in the price." },
            ],
          },
          {
            number: 19,
            prompt: "How can visitors find a taxi easily?",
            options: [
              { key: "A", text: "call the taxi company" },
              { key: "B", text: "look for a taxi in advance" },
              { key: "C", text: "stop a taxi on the street" },
            ],
          },
          {
            number: 20,
            prompt: "What is suggested by the tour guide about the taxi fee?",
            options: [
              { key: "A", text: "make sure no extra money is asked" },
              { key: "B", text: "check what is included in the fee" },
              { key: "C", text: "agree the price with the driver in advance" },
            ],
          },
        ],
      },
    ],
  },
  {
    part: 3,
    title: "Part 3",
    subtitle: "Music on consumers",
    audioUrl: "/audio/mock1/part3.mp3",
    questionRange: [21, 30],
    sections: [
      {
        kind: "mcq",
        questionRange: [21, 24],
        instruction: "Choose the correct letter, A, B or C.",
        items: [
          {
            number: 21,
            prompt: "What is the topic of the research?",
            options: [
              { key: "A", text: "the effect of music on consumers" },
              { key: "B", text: "the effect of music on eating" },
              { key: "C", text: "the effect of music on the price of food" },
            ],
          },
          {
            number: 22,
            prompt: "The research finds out in the restaurant",
            options: [
              { key: "A", text: "the music is played everywhere." },
              { key: "B", text: "the music is played at a uniform volume level." },
              { key: "C", text: "the music is played at a certain time." },
            ],
          },
          {
            number: 23,
            prompt: "The first few questions in the questionnaire are",
            options: [
              { key: "A", text: "to understand people's taste in music." },
              { key: "B", text: "to clarify the research aim." },
              { key: "C", text: "to disguise the purpose of the survey." },
            ],
          },
          {
            number: 24,
            prompt: "The questions in the questionnaire came from",
            options: [
              { key: "A", text: "a previous study." },
              { key: "B", text: "a professional dictionary." },
              { key: "C", text: "the student herself." },
            ],
          },
        ],
      },
      {
        kind: "multi_two",
        questionNumbers: [25, 26],
        instruction: "Choose TWO letters, A–E.",
        prompt:
          "Which TWO are the main reasons given for choosing a restaurant?",
        options: [
          { key: "A", text: "online comparison with other restaurants" },
          { key: "B", text: "environment" },
          { key: "C", text: "transport facilities" },
          { key: "D", text: "service" },
          { key: "E", text: "seat capacity" },
        ],
      },
      {
        kind: "matching",
        questionRange: [27, 30],
        instruction:
          "Choose FOUR answers from the box and select the correct letter, A–F, next to Questions 27–30.",
        prompt:
          "What is people's attitude toward playing each of the following music in restaurants?",
        boxTitle: "People's Attitudes",
        options: [
          { key: "A", text: "People will spend more money in the restaurant." },
          { key: "B", text: "People don't even notice the music." },
          { key: "C", text: "People will come back again." },
          {
            key: "D",
            text: "People don't think the restaurant is worth the price.",
          },
          {
            key: "E",
            text: "People will leave the restaurant right after eating.",
          },
          { key: "F", text: "People don't like the restaurant at all." },
        ],
        items: [
          { number: 27, label: "no music" },
          { number: 28, label: "jazz" },
          { number: 29, label: "classical music" },
          { number: 30, label: "pop music" },
        ],
      },
    ],
  },
  {
    part: 4,
    title: "Part 4",
    subtitle: "Life on the International Space Station",
    audioUrl: "/audio/mock1/part4.mp3",
    questionRange: [31, 40],
    sections: [
      {
        kind: "note_box",
        questionRange: [31, 40],
        instruction:
          "Complete the notes below. Write ONE WORD ONLY for each answer.",
        boxTitle: "Life on the International Space Station",
        groups: [
          {
            heading: "Background",
            lines: [
              {
                bullet: true,
                prefix:
                  "Station was occupied by international teams of scientists over several months.",
              },
              { bullet: true, prefix: "Research was done on living conditions." },
            ],
          },
          {
            heading: "Early impressions",
            lines: [
              { bullet: true, prefix: "The air smelt", questionNumber: 31 },
              { bullet: true, prefix: "The temperature was easy to adjust." },
              {
                bullet: true,
                prefix: "The food had enough",
                questionNumber: 32,
              },
              { bullet: true, questionNumber: 33, suffix: "was efficient" },
            ],
          },
          {
            heading: "Problems",
            lines: [
              {
                bullet: true,
                prefix: "Difficulties with air filters caused lack of",
                questionNumber: 34,
              },
              {
                bullet: true,
                prefix: "It was difficult to keep cabin objects secure.",
              },
              { bullet: true, prefix: "Systems were incompatible" },
              {
                bullet: true,
                prefix: "e.g. there were problems when mixing",
                questionNumber: 35,
                suffix: "because of the preservatives",
              },
              {
                bullet: true,
                prefix: "The",
                questionNumber: 36,
                suffix: "available were not always suitable for their purpose",
              },
              {
                bullet: true,
                prefix: "It was difficult to access the",
                questionNumber: 37,
                suffix: "for equipment maintenance",
              },
            ],
          },
          {
            heading: "Suggested improvements",
            lines: [
              {
                bullet: true,
                prefix: "Systems and equipment should undergo more extensive",
                questionNumber: 38,
              },
              {
                bullet: true,
                prefix:
                  "In language training, astronauts needed practice in understanding the controller's",
                questionNumber: 39,
              },
              {
                bullet: true,
                prefix: "There should be less emphasis on",
                questionNumber: 40,
                suffix: "and more on other issues",
              },
            ],
          },
        ],
      },
    ],
  },
];

export const MOCK_1_LISTENING_KEY: ExamAnswerItem[] = [
  { number: 1, part: 1, partLabel: "Part 1", questionType: "Note Completion", accepted: ["pennington"], displayAnswer: "Pennington" },
  { number: 2, part: 1, partLabel: "Part 1", questionType: "Note Completion", accepted: ["greenfield"], displayAnswer: "greenfield" },
  { number: 3, part: 1, partLabel: "Part 1", questionType: "Note Completion", accepted: ["66 lake"], displayAnswer: "66 Lake" },
  { number: 4, part: 1, partLabel: "Part 1", questionType: "Note Completion", accepted: ["radio"], displayAnswer: "radio" },
  { number: 5, part: 1, partLabel: "Part 1", questionType: "Note Completion", accepted: ["uk765024eg"], displayAnswer: "UK765024EG" },
  { number: 6, part: 1, partLabel: "Part 1", questionType: "Table Completion", accepted: ["flat"], displayAnswer: "flat" },
  { number: 7, part: 1, partLabel: "Part 1", questionType: "Table Completion", accepted: ["forest"], displayAnswer: "forest" },
  { number: 8, part: 1, partLabel: "Part 1", questionType: "Table Completion", accepted: ["organic"], displayAnswer: "organic" },
  { number: 9, part: 1, partLabel: "Part 1", questionType: "Table Completion", accepted: ["bike"], displayAnswer: "bike" },
  { number: 10, part: 1, partLabel: "Part 1", questionType: "Table Completion", accepted: ["dance"], displayAnswer: "dance" },

  { number: 11, part: 2, partLabel: "Part 2", questionType: "Multiple Choice", accepted: ["a"], displayAnswer: "A" },
  { number: 12, part: 2, partLabel: "Part 2", questionType: "Multiple Choice", accepted: ["a"], displayAnswer: "A" },
  { number: 13, part: 2, partLabel: "Part 2", questionType: "Multiple Choice", accepted: ["c"], displayAnswer: "C" },
  { number: 14, part: 2, partLabel: "Part 2", questionType: "Multiple Choice", accepted: ["b"], displayAnswer: "B" },
  { number: 15, part: 2, partLabel: "Part 2", questionType: "Multiple Choice", accepted: ["c"], displayAnswer: "C" },
  { number: 16, part: 2, partLabel: "Part 2", questionType: "Multiple Choice", accepted: ["b"], displayAnswer: "B" },
  { number: 17, part: 2, partLabel: "Part 2", questionType: "Multiple Choice", accepted: ["c"], displayAnswer: "C" },
  { number: 18, part: 2, partLabel: "Part 2", questionType: "Multiple Choice", accepted: ["b"], displayAnswer: "B" },
  { number: 19, part: 2, partLabel: "Part 2", questionType: "Multiple Choice", accepted: ["c"], displayAnswer: "C" },
  { number: 20, part: 2, partLabel: "Part 2", questionType: "Multiple Choice", accepted: ["c"], displayAnswer: "C" },

  { number: 21, part: 3, partLabel: "Part 3", questionType: "Multiple Choice", accepted: ["a"], displayAnswer: "A" },
  { number: 22, part: 3, partLabel: "Part 3", questionType: "Multiple Choice", accepted: ["b"], displayAnswer: "B" },
  { number: 23, part: 3, partLabel: "Part 3", questionType: "Multiple Choice", accepted: ["c"], displayAnswer: "C" },
  { number: 24, part: 3, partLabel: "Part 3", questionType: "Multiple Choice", accepted: ["a"], displayAnswer: "A" },
  { number: 25, part: 3, partLabel: "Part 3", questionType: "Choose TWO Letters", accepted: ["a", "e"], displayAnswer: "A / E", pairGroupId: "L25_26", pairAnswers: ["A", "E"] },
  { number: 26, part: 3, partLabel: "Part 3", questionType: "Choose TWO Letters", accepted: ["a", "e"], displayAnswer: "A / E", pairGroupId: "L25_26", pairAnswers: ["A", "E"] },
  { number: 27, part: 3, partLabel: "Part 3", questionType: "Matching", accepted: ["d"], displayAnswer: "D" },
  { number: 28, part: 3, partLabel: "Part 3", questionType: "Matching", accepted: ["a"], displayAnswer: "A" },
  { number: 29, part: 3, partLabel: "Part 3", questionType: "Matching", accepted: ["e"], displayAnswer: "E" },
  { number: 30, part: 3, partLabel: "Part 3", questionType: "Matching", accepted: ["c"], displayAnswer: "C" },

  { number: 31, part: 4, partLabel: "Part 4", questionType: "Note Completion", accepted: ["fresh"], displayAnswer: "fresh" },
  { number: 32, part: 4, partLabel: "Part 4", questionType: "Note Completion", accepted: ["variety"], displayAnswer: "variety" },
  { number: 33, part: 4, partLabel: "Part 4", questionType: "Note Completion", accepted: ["communication"], displayAnswer: "communication" },
  { number: 34, part: 4, partLabel: "Part 4", questionType: "Note Completion", accepted: ["sleep"], displayAnswer: "sleep" },
  { number: 35, part: 4, partLabel: "Part 4", questionType: "Note Completion", accepted: ["water"], displayAnswer: "water" },
  { number: 36, part: 4, partLabel: "Part 4", questionType: "Note Completion", accepted: ["tools"], displayAnswer: "tools" },
  { number: 37, part: 4, partLabel: "Part 4", questionType: "Note Completion", accepted: ["instructions"], displayAnswer: "instructions" },
  { number: 38, part: 4, partLabel: "Part 4", questionType: "Note Completion", accepted: ["testing"], displayAnswer: "testing" },
  { number: 39, part: 4, partLabel: "Part 4", questionType: "Note Completion", accepted: ["accent"], displayAnswer: "accent" },
  { number: 40, part: 4, partLabel: "Part 4", questionType: "Note Completion", accepted: ["safety"], displayAnswer: "safety" },
];

export const MOCK_1_READING_PASSAGES: ReadingPassageData[] = [
  {
    passage: 1,
    title: "The history of the Pencil",
    timeHint:
      "You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1.",
    questionRange: [1, 13],
    paragraphs: passagesJson.passage1,
    sections: [
      {
        kind: "note_completion",
        questionRange: [1, 6],
        instruction:
          "Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.",
        boxTitle: "The early history of graphite in Britain",
        groups: [
          {
            lines: [
              {
                prefix: "Graphite was first found below a",
                questionNumber: 1,
                suffix: "blown down in a storm.",
              },
              {
                prefix: "The first use of graphite was to make marks on",
                questionNumber: 2,
              },
              { prefix: "The characteristics of raw graphite:" },
              {
                indent: true,
                prefix: "dirty to use because it is so",
                questionNumber: 3,
              },
              {
                indent: true,
                prefix: "originally wrapped in",
                questionNumber: 4,
                suffix: "or animal skin to make it useable as a pencil.",
              },
              {
                prefix:
                  "Graphite came to the notice of the government for military and commercial purposes.",
              },
              {
                indent: true,
                prefix: "The government completely took over the",
                questionNumber: 5,
                suffix: "at Borrowdale.",
              },
              {
                indent: true,
                prefix:
                  "They employed guards to protect the graphite on its journey south.",
              },
              {
                prefix: "Local people began to",
                questionNumber: 6,
                suffix: "graphite for the money involved.",
              },
              {
                indent: true,
                prefix:
                  "The government passed a law to protect the graphite industry.",
              },
            ],
          },
        ],
      },
      {
        kind: "tfng",
        questionRange: [7, 13],
        instruction:
          "Do the following statements agree with the information given in Reading Passage 1? Choose TRUE, FALSE or NOT GIVEN.",
        items: [
          {
            number: 7,
            statement: "The Italians were the first to make pencils out of wood.",
          },
          {
            number: 8,
            statement:
              "The Germans used different types of wood to produce pencils.",
          },
          {
            number: 9,
            statement: "More clay in a pencil makes it write more darkly.",
          },
          {
            number: 10,
            statement:
              "After the HB code was introduced, it very quickly became used by all manufacturers.",
          },
          {
            number: 11,
            statement: "English pencil factories have now all closed down.",
          },
          {
            number: 12,
            statement:
              "American astronauts used pencils on their early journeys into space.",
          },
          {
            number: 13,
            statement:
              "The use of graphite pencils is unlikely to continue into the future.",
          },
        ],
      },
    ],
  },
  {
    passage: 2,
    title: "What is an unfair advantage in sport?",
    subtitle:
      "Olympic athletes increasingly depend on technology to help them win — but is that fair?",
    timeHint:
      "You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2.",
    questionRange: [14, 26],
    paragraphs: passagesJson.passage2,
    sections: [
      {
        kind: "matching_headings",
        questionRange: [14, 20],
        instruction:
          "Reading Passage 2 has seven paragraphs, A–G. Choose the correct heading for each paragraph from the list of headings below (i–ix).",
        boxTitle: "List of Headings",
        headings: [
          { key: "i", text: "Early research into athletes' physiology" },
          { key: "ii", text: "A convenient method of acclimatization" },
          { key: "iii", text: "The need for a rational approach" },
          { key: "iv", text: "Changes in the body" },
          { key: "v", text: "The athletes who break the rules" },
          { key: "vi", text: "Well-founded concerns" },
          { key: "vii", text: "The surprising outcome of a race" },
          { key: "viii", text: "The reversal of a decision" },
          { key: "ix", text: "The runners who dominate" },
        ],
        items: [
          { number: 14, label: "Paragraph A" },
          { number: 15, label: "Paragraph B" },
          { number: 16, label: "Paragraph C" },
          { number: 17, label: "Paragraph D" },
          { number: 18, label: "Paragraph E" },
          { number: 19, label: "Paragraph F" },
          { number: 20, label: "Paragraph G" },
        ],
      },
      {
        kind: "multi_two",
        questionNumbers: [21, 22],
        instruction: "Choose TWO letters, A–E.",
        prompt:
          "Which TWO of the following statements about Ron Clarke are made in the passage?",
        options: [
          {
            key: "A",
            text: "Clarke was not performing well immediately prior to the Mexico Games.",
          },
          {
            key: "B",
            text: "The worries Clarke had before the Mexico Games were not taken into account.",
          },
          {
            key: "C",
            text: "Clarke's experiences at the Mexico Games are widely talked about today.",
          },
          {
            key: "D",
            text: "At one stage of the Mexico Games 10,000 metres, Clarke was near the front.",
          },
          {
            key: "E",
            text: "Clarke was the only runner at the Mexico Games who appeared to be affected by the altitude.",
          },
        ],
      },
      {
        kind: "summary_input",
        questionRange: [23, 26],
        instruction:
          "Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.",
        title: "Do all new technologies gain approval?",
        paragraphs: [
          [
            {
              type: "text",
              value:
                "Some people may be puzzled by attitudes towards performance-enhancing technologies in sport. For example, why is the altitude tent considered acceptable, but not the LZR Racer suit? For distance running, WADA concluded that the altitude tent was not contrary to the ",
            },
            { type: "blank", questionNumber: 23 },
            {
              type: "text",
              value:
                " of the sport. However, the LZR swimsuit, which is made from a special fabric that aids buoyancy and cuts down ",
            },
            { type: "blank", questionNumber: 24 },
            { type: "text", value: ", was banned." },
          ],
          [
            {
              type: "text",
              value: "Athletes think they have to continually set fresh ",
            },
            { type: "blank", questionNumber: 25 },
            { type: "text", value: ". This is made possible by better " },
            { type: "blank", questionNumber: 26 },
            {
              type: "text",
              value:
                " and training, as well as improved clothing and equipment. However, when sports authorities have to decide whether to give permission for a new performance-enhancing technology to be used, it is important that their decisions are not seen as arbitrary.",
            },
          ],
        ],
      },
    ],
  },
  {
    passage: 3,
    title: "Theories of planet formation questioned",
    timeHint:
      "You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3.",
    questionRange: [27, 40],
    paragraphs: passagesJson.passage3,
    sections: [
      {
        kind: "matching_paragraph",
        questionRange: [27, 32],
        instruction:
          "Reading Passage 3 has nine paragraphs, A–I. Which paragraph contains the following information? Select the correct letter, A–I.",
        letters: ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
        items: [
          {
            number: 27,
            statement:
              "the significance of recent discoveries of a large number of massive planets",
          },
          {
            number: 28,
            statement:
              "an explanation of the difference between the theories of planet creation",
          },
          {
            number: 29,
            statement:
              "the difficulties of proving that the more recent theory of planet creation is correct",
          },
          {
            number: 30,
            statement:
              "reasons why Mayer claims he was able to develop his theory",
          },
          {
            number: 31,
            statement:
              "a detailed explanation of the long-held theory of planet creation",
          },
          {
            number: 32,
            statement: "description of the destructive effect of heat in space",
          },
        ],
      },
      {
        kind: "matching_endings",
        questionRange: [33, 37],
        instruction:
          "Complete each sentence with the correct ending, A–G, below.",
        items: [
          { number: 33, stem: "Traditionally astronomers have believed that" },
          { number: 34, stem: "Lucio Mayer physically observed that" },
          { number: 35, stem: "Thomas Quinn believes that" },
          {
            number: 36,
            stem: "Gerard Kuiper was the first to suggest that",
          },
          { number: 37, stem: "Alan P Boss discovered that" },
        ],
        endings: [
          { key: "A", text: "gaseous planets form before smaller rocky planets." },
          { key: "B", text: "large planets take millions of years to form." },
          { key: "C", text: "large planets must form fast or not at all." },
          {
            key: "D",
            text: "large planets had the potential to develop relatively fast.",
          },
          {
            key: "E",
            text: "gravity could cause planet-sized pieces to break off quickly.",
          },
          {
            key: "F",
            text: "hot clumps of gas, dust and ice were destroyed relatively quickly.",
          },
          {
            key: "G",
            text: "computer studies of planets are too mathematically complex.",
          },
        ],
      },
      {
        kind: "summary_box",
        questionRange: [38, 40],
        instruction:
          "Complete the summary using the list of words, A–F, below.",
        blocks: [
          {
            heading: "The core-accretion model",
            segments: [
              {
                type: "text",
                value:
                  "A hard centre becomes larger and this produces enough gravity to draw gas from the ",
              },
              { type: "blank", questionNumber: 38 },
              { type: "text", value: " around it." },
            ],
          },
          {
            heading: "The gravitational-instability model",
            segments: [
              {
                type: "text",
                value:
                  "Stars can break up the outer gaseous parts which surround objects in the sky because the attraction of the ",
              },
              { type: "blank", questionNumber: 39 },
              {
                type: "text",
                value: " from stars is very powerful. Heat caused by ",
              },
              { type: "blank", questionNumber: 40 },
              {
                type: "text",
                value:
                  " can also destroy the material surrounding the objects in a relatively short time. Planet-sized segments may split away from the main body following several orbits of the parent star.",
              },
            ],
          },
        ],
        wordBox: [
          { key: "A", text: "gravitational pull" },
          { key: "B", text: "ice" },
          { key: "C", text: "solid core" },
          { key: "D", text: "ultraviolet light" },
          { key: "E", text: "Milky Way" },
          { key: "F", text: "disk" },
        ],
      },
    ],
  },
];

export const MOCK_1_READING_KEY: ExamAnswerItem[] = [
  { number: 1, part: 1, partLabel: "Passage 1", questionType: "Note Completion", accepted: ["tree"], displayAnswer: "tree" },
  { number: 2, part: 1, partLabel: "Passage 1", questionType: "Note Completion", accepted: ["sheep"], displayAnswer: "sheep" },
  { number: 3, part: 1, partLabel: "Passage 1", questionType: "Note Completion", accepted: ["soft"], displayAnswer: "soft" },
  { number: 4, part: 1, partLabel: "Passage 1", questionType: "Note Completion", accepted: ["rope"], displayAnswer: "rope" },
  { number: 5, part: 1, partLabel: "Passage 1", questionType: "Note Completion", accepted: ["mines"], displayAnswer: "mines" },
  { number: 6, part: 1, partLabel: "Passage 1", questionType: "Note Completion", accepted: ["steal"], displayAnswer: "steal" },

  { number: 7, part: 1, partLabel: "Passage 1", questionType: "True / False / Not Given", accepted: ["true", "t"], displayAnswer: "TRUE" },
  { number: 8, part: 1, partLabel: "Passage 1", questionType: "True / False / Not Given", accepted: ["not given", "ng"], displayAnswer: "NOT GIVEN" },
  { number: 9, part: 1, partLabel: "Passage 1", questionType: "True / False / Not Given", accepted: ["false", "f"], displayAnswer: "FALSE" },
  { number: 10, part: 1, partLabel: "Passage 1", questionType: "True / False / Not Given", accepted: ["not given", "ng"], displayAnswer: "NOT GIVEN" },
  { number: 11, part: 1, partLabel: "Passage 1", questionType: "True / False / Not Given", accepted: ["false", "f"], displayAnswer: "FALSE" },
  { number: 12, part: 1, partLabel: "Passage 1", questionType: "True / False / Not Given", accepted: ["true", "t"], displayAnswer: "TRUE" },
  { number: 13, part: 1, partLabel: "Passage 1", questionType: "True / False / Not Given", accepted: ["false", "f"], displayAnswer: "FALSE" },

  { number: 14, part: 2, partLabel: "Passage 2", questionType: "Matching Headings", accepted: ["vii"], displayAnswer: "vii" },
  { number: 15, part: 2, partLabel: "Passage 2", questionType: "Matching Headings", accepted: ["vi"], displayAnswer: "vi" },
  { number: 16, part: 2, partLabel: "Passage 2", questionType: "Matching Headings", accepted: ["ix"], displayAnswer: "ix" },
  { number: 17, part: 2, partLabel: "Passage 2", questionType: "Matching Headings", accepted: ["iv"], displayAnswer: "iv" },
  { number: 18, part: 2, partLabel: "Passage 2", questionType: "Matching Headings", accepted: ["ii"], displayAnswer: "ii" },
  { number: 19, part: 2, partLabel: "Passage 2", questionType: "Matching Headings", accepted: ["viii"], displayAnswer: "viii" },
  { number: 20, part: 2, partLabel: "Passage 2", questionType: "Matching Headings", accepted: ["iii"], displayAnswer: "iii" },

  { number: 21, part: 2, partLabel: "Passage 2", questionType: "Choose TWO Letters", accepted: ["b", "d"], displayAnswer: "B / D", pairGroupId: "R21_22", pairAnswers: ["B", "D"] },
  { number: 22, part: 2, partLabel: "Passage 2", questionType: "Choose TWO Letters", accepted: ["b", "d"], displayAnswer: "B / D", pairGroupId: "R21_22", pairAnswers: ["B", "D"] },

  { number: 23, part: 2, partLabel: "Passage 2", questionType: "Summary Completion", accepted: ["spirit"], displayAnswer: "spirit" },
  { number: 24, part: 2, partLabel: "Passage 2", questionType: "Summary Completion", accepted: ["drag"], displayAnswer: "drag" },
  { number: 25, part: 2, partLabel: "Passage 2", questionType: "Summary Completion", accepted: ["records"], displayAnswer: "records" },
  { number: 26, part: 2, partLabel: "Passage 2", questionType: "Summary Completion", accepted: ["diet", "nutrition"], displayAnswer: "diet / nutrition" },

  { number: 27, part: 3, partLabel: "Passage 3", questionType: "Matching Paragraph Information", accepted: ["e"], displayAnswer: "E" },
  { number: 28, part: 3, partLabel: "Passage 3", questionType: "Matching Paragraph Information", accepted: ["b"], displayAnswer: "B" },
  { number: 29, part: 3, partLabel: "Passage 3", questionType: "Matching Paragraph Information", accepted: ["h"], displayAnswer: "H" },
  { number: 30, part: 3, partLabel: "Passage 3", questionType: "Matching Paragraph Information", accepted: ["i"], displayAnswer: "I" },
  { number: 31, part: 3, partLabel: "Passage 3", questionType: "Matching Paragraph Information", accepted: ["a"], displayAnswer: "A" },
  { number: 32, part: 3, partLabel: "Passage 3", questionType: "Matching Paragraph Information", accepted: ["d"], displayAnswer: "D" },

  { number: 33, part: 3, partLabel: "Passage 3", questionType: "Matching Sentence Endings", accepted: ["b"], displayAnswer: "B" },
  { number: 34, part: 3, partLabel: "Passage 3", questionType: "Matching Sentence Endings", accepted: ["f"], displayAnswer: "F" },
  { number: 35, part: 3, partLabel: "Passage 3", questionType: "Matching Sentence Endings", accepted: ["c"], displayAnswer: "C" },
  { number: 36, part: 3, partLabel: "Passage 3", questionType: "Matching Sentence Endings", accepted: ["d"], displayAnswer: "D" },
  { number: 37, part: 3, partLabel: "Passage 3", questionType: "Matching Sentence Endings", accepted: ["e"], displayAnswer: "E" },

  { number: 38, part: 3, partLabel: "Passage 3", questionType: "Summary Completion", accepted: ["f"], displayAnswer: "F" },
  { number: 39, part: 3, partLabel: "Passage 3", questionType: "Summary Completion", accepted: ["a"], displayAnswer: "A" },
  { number: 40, part: 3, partLabel: "Passage 3", questionType: "Summary Completion", accepted: ["d"], displayAnswer: "D" },
];

export const MOCK_1_WRITING_TASK1: WritingTask1Config = {
  title: "WRITING TASK 1",
  prompt:
    "You should spend about 20 minutes on this task.\n\nThe graph below shows the sales of 5 types of items in four different seasons in a US department store in 2011.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
  minWords: 150,
  durationSeconds: 20 * 60,
  chartTitle: "Department store sales (in US dollars)",
  yMax: 120000,
  yStep: 20000,
  series: [
    { key: "womens", label: "Women's clothes", color: "#3b6cb7" },
    { key: "mens", label: "Men's clothes", color: "#e87a2e" },
    { key: "sports", label: "Sports equipment", color: "#9ca3af" },
    { key: "cosmetics", label: "Cosmetics", color: "#f5c31e" },
    { key: "jewellery", label: "Jewellery", color: "#4ea6dc" },
  ],
  data: [
    {
      season: "Winter",
      values: {
        womens: 40000,
        mens: 30000,
        sports: 32000,
        cosmetics: 30000,
        jewellery: 20000,
      },
    },
    {
      season: "Spring",
      values: {
        womens: 60000,
        mens: 20000,
        sports: 40000,
        cosmetics: 20000,
        jewellery: 18000,
      },
    },
    {
      season: "Summer",
      values: {
        womens: 80000,
        mens: 40000,
        sports: 20000,
        cosmetics: 30000,
        jewellery: 25000,
      },
    },
    {
      season: "Autumn",
      values: {
        womens: 110000,
        mens: 30000,
        sports: 40000,
        cosmetics: 45000,
        jewellery: 50000,
      },
    },
  ],
};

export function createDefaultMock1(): MockExamConfig {
  const now = new Date().toISOString();
  return {
    id: MOCK_1_ID,
    title: "MOCK 1 — Official CDI IELTS Exam",
    subtitle: "Listening (40 Q) · Reading (60:00) · Writing Task 1 (20:00)",
    password: DEFAULT_EXAM_PASSWORD,
    startMode: "proctor",
    status: "waiting",
    startedAt: null,
    writingMode: "task1_only",
    readingDurationSeconds: 60 * 60,
    writingDurationSeconds: 20 * 60,
    listeningParts: MOCK_1_LISTENING_PARTS,
    readingPassages: MOCK_1_READING_PASSAGES,
    writingTask1: MOCK_1_WRITING_TASK1,
    writingTask2: null,
    listeningKey: MOCK_1_LISTENING_KEY,
    readingKey: MOCK_1_READING_KEY,
    createdAt: now,
    updatedAt: now,
  };
}
