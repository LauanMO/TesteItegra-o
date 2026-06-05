export interface User {
  id: number;
  name: string;
  email: string;
  hskLevel: number;
  streak?: number;
}

export interface Word {
  id: number;
  hanzi: string;
  pinyin: string;
  translation: string;
  hskLevel: number;
  example: string | null;
  progress: { status: string; box: number; nextReview: string } | null;
}

export interface Stats {
  totalWords: number;
  learned: number;
  learning: number;
  studied: number;
  pending: number;
  dueNow: number;
}

export interface Progress {
  stats: Stats;
  streak: number;
  lastStudyDate: string | null;
  byLevel: { level: number; total: number; learned: number; studied: number; boxSum: number; maxBox: number }[];
  dueWords: { id: number; hanzi: string; pinyin: string; translation: string; level: number }[];
}

export interface Exercise {
  source: 'gemini' | 'mock' | 'fallback' | 'ia';
  type?: string;
  question: string;
  options: string[];
  answer: string;
  word: { hanzi: string; pinyin: string; translation: string };
}
