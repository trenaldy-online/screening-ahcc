export enum AppStep {
  WELCOME = "WELCOME",
  VALIDATION_FORM = "VALIDATION_FORM",
  CHAT = "CHAT",
  RESULT = "RESULT",
  REJECTED = "REJECTED", // Tipe baru untuk user iseng
}

export interface UserData {
  name: string;
  age: string;
  gender: "Laki-laki" | "Perempuan" | "";
  whatsapp: string;
  email: string;
  chiefComplaint: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  images?: string[];
}
