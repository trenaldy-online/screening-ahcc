export interface Option {
  id: string;
  label: string;
  value: string;
}

export interface Question {
  id: number | string; // Changed to support string IDs for sub-questions
  text: string;
  type: 'single' | 'text' | 'multi';
  options?: Option[];
  placeholder?: string;
  // New: Logic for deeper screening
  followUp?: {
    triggerValues: string[]; // Answers that trigger these questions (e.g. ["Ya", "Perokok aktif"])
    questions: Question[];   // The new questions to insert
  };
}

export interface UserResponse {
  questionId: number | string;
  questionText: string;
  answer: string | string[];
}

export interface UserData {
  name: string;
  whatsapp: string;
  email: string;
  infoSource: string;
  marketingOptIn: boolean;
}

export interface CancerType {
  id: string;
  label: string;
  gender: 'male' | 'female' | 'both';
}

export interface AnalysisResult {
  riskLevel: 'Rendah' | 'Sedang' | 'Tinggi';
  summary: string;
  recommendations: string[];
  medicalDisclaimer: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  cancerLabel: string;
  riskLevel: 'Rendah' | 'Sedang' | 'Tinggi';
  summary: string;
  recommendations: string[];
}

// New: Data structure for Admin Dashboard
export interface AdminSubmission {
  id: string;
  timestamp: number;
  userData: UserData;
  cancerType: string;
  riskLevel: string;
  summary: string; // Short summary
}

export enum AppStep {
  WELCOME = 'WELCOME',
  CANCER_SELECTION = 'CANCER_SELECTION',
  QUIZ = 'QUIZ',
  LEAD_FORM = 'LEAD_FORM',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  HISTORY = 'HISTORY',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
}