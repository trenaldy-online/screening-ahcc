import { GoogleGenAI, Type } from "@google/genai";
import { UserResponse, AnalysisResult, UserData, CancerType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeScreeningData = async (
  responses: UserResponse[], 
  userData: UserData,
  cancerType: CancerType
): Promise<AnalysisResult> => {
  const modelId = "gemini-3-flash-preview";
  
  const formattedResponses = responses.map(r => 
    `- Tanya: ${r.questionText}\n  Jawab: ${Array.isArray(r.answer) ? r.answer.join(", ") : r.answer}`
  ).join("\n");

  const prompt = `
    Anda adalah onkolog (dokter ahli kanker) AI. Pengguna bernama ${userData.name} sedang melakukan screening mandiri khusus untuk risiko ${cancerType.label}.

    Data Profil Pengguna:
    ${formattedResponses}

    Instruksi:
    1. Analisis risiko pengguna secara spesifik terhadap ${cancerType.label}.
    2. Jika pengguna memilih gejala yang spesifik mengarah ke ${cancerType.label} (misal batuk darah untuk paru, benjolan untuk payudara), naikkan tingkat risiko.
    3. Gunakan bahasa yang empatik, profesional, dan personal (sapa pengguna dengan nama ${userData.name}).
    4. Berikan rekomendasi yang relevan dengan ${cancerType.label}.

    Output JSON:
    {
      "riskLevel": "Rendah" | "Sedang" | "Tinggi",
      "summary": "Penjelasan analisis...",
      "recommendations": ["Saran 1", "Saran 2"...],
      "medicalDisclaimer": "Disclaimer bahasa Indonesia"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: {
              type: Type.STRING,
              enum: ["Rendah", "Sedang", "Tinggi"],
            },
            summary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            medicalDisclaimer: { type: Type.STRING }
          },
          required: ["riskLevel", "summary", "recommendations", "medicalDisclaimer"],
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response");

    return JSON.parse(resultText) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      riskLevel: "Rendah",
      summary: `Halo ${userData.name}, mohon maaf sistem sedang sibuk. Namun berdasarkan data umum, jika Anda tidak memiliki gejala berat, risiko cenderung rendah.`,
      recommendations: ["Silakan konsultasi ke dokter spesialis onkologi terdekat."],
      medicalDisclaimer: "Terjadi kesalahan analisis sistem."
    };
  }
};
