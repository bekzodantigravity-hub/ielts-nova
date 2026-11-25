export type ExamStartMode = "proctor" | "individual";
export type ExamRoomStatus = "waiting" | "started" | "finished";
export type ExamWritingMode = "task1_only" | "task1_and_task2";

export type ListeningQuestionType =
  | "Note Completion"
  | "Table Completion"
  | "Multiple Choice"
  | "Choose TWO Letters"
  | "Matching";

export type ReadingQuestionType =
  | "Note Completion"
  | "True / False / Not Given"
  | "Matching Headings"
  | "Choose TWO Letters"
  | "Summary Completion"
  | "Matching Paragraph Information"
  | "Matching Sentence Endings";

export interface ExamAnswerItem {
  number: number;
  part: number; // 1-4 for Listening, 1-3 for Reading
  partLabel: string;
  questionType: string;
  accepted: string[]; // case-insensitive accepted strings
  displayAnswer: string;
  pairGroupId?: string; // e.g. "L25_26" or "R21_22" for order-independent 2-letter pairs
  pairAnswers?: string[]; // e.g. ["A", "E"]
}

export interface ListeningNoteLine {
  label?: string;
  prefix?: string;
  questionNumber?: number;
  suffix?: string;
  bullet?: boolean;
}

export interface ListeningTableRow {
  category: string;
  recommendation: { prefix?: string; questionNumber?: number; suffix?: string };
  preference: { prefix?: string; questionNumber?: number; suffix?: string };
}

export interface McqItem {
  number: number;
  prompt: string;
  options: { key: string; text: string }[];
}

export interface MatchingItem {
  number: number;
  label: string;
}

export interface ListeningPartData {
  part: number;
  title: string;
  subtitle: string;
  audioUrl: string;
  questionRange: [number, number];
  sections: Array<
    | {
        kind: "note_box";
        questionRange: [number, number];
        instruction: string;
        boxTitle: string;
        groups: { heading?: string; lines: ListeningNoteLine[] }[];
      }
    | {
        kind: "table";
        questionRange: [number, number];
        instruction: string;
        headers: [string, string, string];
        rows: ListeningTableRow[];
      }
    | {
        kind: "mcq";
        questionRange: [number, number];
        instruction: string;
        title?: string;
        items: McqItem[];
      }
    | {
        kind: "multi_two";
        questionNumbers: [number, number];
        instruction: string;
        prompt: string;
        options: { key: string; text: string }[];
      }
    | {
        kind: "matching";
        questionRange: [number, number];
        instruction: string;
        prompt: string;
        boxTitle: string;
        options: { key: string; text: string }[];
        items: MatchingItem[];
      }
  >;
}

export interface ReadingParagraph {
  label?: string; // "A", "B", ...
  text: string;
}

export interface ReadingPassageData {
  passage: number; // 1, 2, 3
  title: string;
  subtitle?: string;
  timeHint: string;
  questionRange: [number, number];
  paragraphs: ReadingParagraph[];
  sections: Array<
    | {
        kind: "note_completion";
        questionRange: [number, number];
        instruction: string;
        boxTitle: string;
        groups: {
          heading?: string;
          lines: {
            prefix?: string;
            questionNumber?: number;
            suffix?: string;
            indent?: boolean;
          }[];
        }[];
      }
    | {
        kind: "tfng";
        questionRange: [number, number];
        instruction: string;
        items: { number: number; statement: string }[];
      }
    | {
        kind: "matching_headings";
        questionRange: [number, number];
        instruction: string;
        boxTitle: string;
        headings: { key: string; text: string }[];
        items: { number: number; label: string }[];
      }
    | {
        kind: "multi_two";
        questionNumbers: [number, number];
        instruction: string;
        prompt: string;
        options: { key: string; text: string }[];
      }
    | {
        kind: "summary_input";
        questionRange: [number, number];
        instruction: string;
        title: string;
        paragraphs: Array<
          Array<
            | { type: "text"; value: string }
            | { type: "blank"; questionNumber: number }
          >
        >;
      }
    | {
        kind: "matching_paragraph";
        questionRange: [number, number];
        instruction: string;
        letters: string[];
        items: { number: number; statement: string }[];
      }
    | {
        kind: "matching_endings";
        questionRange: [number, number];
        instruction: string;
        items: { number: number; stem: string }[];
        endings: { key: string; text: string }[];
      }
    | {
        kind: "summary_box";
        questionRange: [number, number];
        instruction: string;
        blocks: {
          heading: string;
          segments: Array<
            | { type: "text"; value: string }
            | { type: "blank"; questionNumber: number }
          >;
        }[];
        wordBox: { key: string; text: string }[];
      }
  >;
}

export interface WritingChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface WritingChartDatum {
  season: string;
  values: Record<string, number>;
}

export interface WritingTask1Config {
  title: string;
  prompt: string;
  minWords: number;
  durationSeconds: number; // 1200 = 20:00
  chartTitle: string;
  yMax: number;
  yStep: number;
  series: WritingChartSeries[];
  data: WritingChartDatum[];
}

export interface WritingTask2Config {
  title: string;
  prompt: string;
  minWords: number;
}

export interface MockExamConfig {
  id: string;
  title: string;
  subtitle: string;
  password: string;
  startMode: ExamStartMode;
  status: ExamRoomStatus;
  startedAt: string | null;
  writingMode: ExamWritingMode;
  readingDurationSeconds: number; // 3600 = 60:00
  writingDurationSeconds: number; // 1200 = 20:00 for Task 1 only
  listeningParts: ListeningPartData[];
  readingPassages: ReadingPassageData[];
  writingTask1: WritingTask1Config;
  writingTask2?: WritingTask2Config | null;
  listeningKey: ExamAnswerItem[];
  readingKey: ExamAnswerItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MockExamPublicPayload
  extends Omit<MockExamConfig, "password" | "listeningKey" | "readingKey"> {
  hasPassword: boolean;
}

export interface LobbyParticipant {
  id: string;
  mockId: string;
  fullName: string;
  joinedAt: string;
  lastSeenAt: string;
  status: "waiting" | "in_exam" | "submitted";
}

export interface GradedQuestionDetail {
  number: number;
  part: number;
  partLabel: string;
  questionType: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface AnalyticsBucket {
  label: string;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

export interface SectionGradeReport {
  rawScore: number;
  total: number;
  band: number;
  details: GradedQuestionDetail[];
  byPart: AnalyticsBucket[];
  byType: AnalyticsBucket[];
}

export interface ExamSubmissionRecord {
  id: string;
  mockId: string;
  mockTitle: string;
  participantId: string;
  fullName: string;
  submittedAt: string;
  tabSwitchCount: number;
  listening: SectionGradeReport;
  reading: SectionGradeReport;
  writingTask1Text: string;
  writingTask1WordCount: number;
  writingTask2Text?: string;
  writingTask2WordCount?: number;
  writingBand: number | null;
  teacherFeedback: string;
  gradedBy: string | null;
  gradedAt: string | null;
}

export interface TeacherAccount {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "teacher";
  createdAt: string;
}
