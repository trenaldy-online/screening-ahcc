import { Question, CancerType } from './types';

export const CANCER_TYPES: CancerType[] = [
  // Laki-laki
  { id: 'paru_pria', label: 'Kanker Paru', gender: 'male' },
  { id: 'kolorektal_pria', label: 'Kanker Kolorektal (Usus Besar)', gender: 'male' },
  { id: 'hati_pria', label: 'Kanker Hati', gender: 'male' },
  { id: 'nasofaring_pria', label: 'Kanker Nasofaring', gender: 'male' },
  { id: 'prostat_pria', label: 'Kanker Prostat', gender: 'male' },
  { id: 'limfoma_pria', label: 'Limfoma Non-Hodgkin', gender: 'male' },
  { id: 'leukemia_pria', label: 'Leukemia', gender: 'male' },
  { id: 'kandung_kemih_pria', label: 'Kanker Kandung Kemih', gender: 'male' },

  // Perempuan
  { id: 'payudara_wanita', label: 'Kanker Payudara', gender: 'female' },
  { id: 'leher_rahim_wanita', label: 'Kanker Leher Rahim (Serviks)', gender: 'female' },
  { id: 'ovarium_wanita', label: 'Kanker Ovarium', gender: 'female' },
  { id: 'kolorektal_wanita', label: 'Kanker Kolorektal (Usus Besar)', gender: 'female' },
  { id: 'tiroid_wanita', label: 'Kanker Tiroid', gender: 'female' },
  { id: 'paru_wanita', label: 'Kanker Paru', gender: 'female' },
  { id: 'korpus_uteri_wanita', label: 'Kanker Korpus Uteri', gender: 'female' },
  { id: 'hati_wanita', label: 'Kanker Hati', gender: 'female' },
];

export const INFO_SOURCES = [
  "Instagram",
  "Facebook",
  "TikTok",
  "Teman / Keluarga",
  "Google Search",
  "Event Kesehatan",
  "Lainnya"
];

// --- Follow Up Blocks ---

const SMOKING_FOLLOW_UP: Question[] = [
  {
    id: "smk_1",
    text: "Berapa batang rokok yang Anda hisap rata-rata per hari?",
    type: "single",
    options: [
      { id: "s_light", label: "Kurang dari 10 batang", value: "<10 batang" },
      { id: "s_mod", label: "10 - 20 batang (1 bungkus)", value: "10-20 batang" },
      { id: "s_heavy", label: "Lebih dari 20 batang", value: ">20 batang" }
    ]
  },
  {
    id: "smk_2",
    text: "Sudah berapa tahun Anda merokok?",
    type: "single",
    options: [
      { id: "y_short", label: "Kurang dari 5 tahun", value: "<5 tahun" },
      { id: "y_med", label: "5 - 10 tahun", value: "5-10 tahun" },
      { id: "y_long", label: "Lebih dari 10 tahun", value: ">10 tahun" }
    ]
  }
];

const FAMILY_FOLLOW_UP: Question[] = [
  {
    id: "fam_1",
    text: "Siapa anggota keluarga yang memiliki riwayat kanker?",
    type: "multi", // Note: In App.tsx simple handling, treating as single for now or needs upgrade, but text keeps it flexible
    options: [
      { id: "rel_1", label: "Orang Tua (Ayah/Ibu)", value: "Orang Tua" },
      { id: "rel_2", label: "Saudara Kandung", value: "Saudara Kandung" },
      { id: "rel_3", label: "Kakek/Nenek", value: "Kakek/Nenek" },
      { id: "rel_4", label: "Keluarga Jauh", value: "Keluarga Jauh" }
    ]
  },
  {
    id: "fam_2",
    text: "Jenis kanker apa yang diderita anggota keluarga tersebut?",
    type: "text",
    placeholder: "Contoh: Kanker Payudara, Kanker Paru, dll..."
  }
];

const BASE_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Berapa usia Anda saat ini?",
    type: "single",
    options: [
      { id: "u1", label: "Di bawah 20 tahun", value: "<20" },
      { id: "u2", label: "20 - 39 tahun", value: "20-39" },
      { id: "u3", label: "40 - 59 tahun", value: "40-59" },
      { id: "u4", label: "60 tahun ke atas", value: ">=60" },
    ]
  },
  {
    id: 2,
    text: "Bagaimana status merokok Anda?",
    type: "single",
    options: [
      { id: "s1", label: "Tidak pernah merokok", value: "Tidak pernah" },
      { id: "s2", label: "Perokok aktif", value: "Perokok aktif" },
      { id: "s3", label: "Perokok pasif (sering terpapar)", value: "Perokok pasif" },
      { id: "s4", label: "Mantan perokok (sudah berhenti)", value: "Mantan perokok" },
    ],
    followUp: {
      triggerValues: ["Perokok aktif"],
      questions: SMOKING_FOLLOW_UP
    }
  },
  {
    id: 3,
    text: "Apakah ada riwayat kanker dalam keluarga inti?",
    type: "single",
    options: [
      { id: "f1", label: "Tidak ada", value: "Tidak" },
      { id: "f2", label: "Ya, ada", value: "Ya" },
      { id: "f3", label: "Tidak tahu", value: "Tidak tahu" },
    ],
    followUp: {
      triggerValues: ["Ya", "Ya, ada"],
      questions: FAMILY_FOLLOW_UP
    }
  }
];

export const getQuestionsForCancer = (cancerId: string): Question[] => {
  let specificQuestion: Question | null = null;

  // --- Specific Deep Dives ---

  if (cancerId.includes('paru')) {
    specificQuestion = {
      id: 99,
      text: "Apakah Anda mengalami gejala pernapasan berikut?",
      type: "single",
      options: [
        { id: "p1", label: "Tidak ada keluhan napas", value: "Tidak" },
        { id: "p2", label: "Batuk lama (>2 minggu) tidak sembuh", value: "Batuk kronis" },
        { id: "p3", label: "Napas pendek / sesak saat aktivitas ringan", value: "Sesak napas" }
      ],
      followUp: {
        triggerValues: ["Batuk kronis", "Sesak napas"],
        questions: [
          {
            id: "paru_detail_1",
            text: "Apakah batuk disertai darah atau lendir berwarna karat?",
            type: "single",
            options: [
              { id: "pd1", label: "Tidak", value: "Tidak" },
              { id: "pd2", label: "Ya, kadang berdarah", value: "Ya" }
            ]
          },
          {
            id: "paru_detail_2",
            text: "Apakah dada terasa nyeri (tajam/tumpul) yang memburuk saat menarik napas dalam?",
            type: "single",
            options: [
              { id: "pd3", label: "Tidak", value: "Tidak" },
              { id: "pd4", label: "Ya, terasa nyeri", value: "Ya" }
            ]
          }
        ]
      }
    };
  } else if (cancerId.includes('payudara')) {
    specificQuestion = {
      id: 99,
      text: "Lakukan perabaan (SADARI). Apakah Anda merasakan kelainan?",
      type: "single",
      options: [
        { id: "b1", label: "Tidak ada kelainan", value: "Normal" },
        { id: "b2", label: "Teraba benjolan keras", value: "Benjolan" },
        { id: "b3", label: "Perubahan kulit (kerut/kemerahan) atau puting", value: "Perubahan fisik" }
      ],
      followUp: {
        triggerValues: ["Benjolan", "Perubahan fisik"],
        questions: [
          {
            id: "payudara_detail_1",
            text: "Apakah benjolan tersebut terasa nyeri saat ditekan?",
            type: "single",
            options: [
              { id: "bd1", label: "Tidak nyeri", value: "Tidak nyeri" },
              { id: "bd2", label: "Ya, nyeri", value: "Nyeri" }
            ]
          },
          {
            id: "payudara_detail_2",
            text: "Apakah benjolan tersebut bisa digerakkan atau terasa kaku/menempel?",
            type: "single",
            options: [
              { id: "bd3", label: "Bisa digerakkan (Mobile)", value: "Mobile" },
              { id: "bd4", label: "Kaku / Menempel di dalam (Fixed)", value: "Fixed" }
            ]
          }
        ]
      }
    };
  } else if (cancerId.includes('kolorektal')) {
    specificQuestion = {
      id: 99,
      text: "Bagaimana pola Buang Air Besar (BAB) Anda akhir-akhir ini?",
      type: "single",
      options: [
        { id: "c1", label: "Normal dan teratur", value: "Normal" },
        { id: "c2", label: "Berubah-ubah (Sembelit lalu Diare)", value: "Berubah pola" },
        { id: "c3", label: "BAB disertai darah", value: "BAB Berdarah" }
      ],
      followUp: {
        triggerValues: ["Berubah pola", "BAB Berdarah"],
        questions: [
          {
            id: "kolo_detail_1",
            text: "Apa warna darah pada feses?",
            type: "single",
            options: [
              { id: "kd1", label: "Merah segar menetes", value: "Merah segar" },
              { id: "kd2", label: "Merah gelap bercampur feses", value: "Merah gelap" },
              { id: "kd3", label: "Hitam pekat (seperti aspal)", value: "Hitam/Melena" },
              { id: "kd4", label: "Tidak yakin/Tidak melihat", value: "Tidak yakin" }
            ]
          },
          {
            id: "kolo_detail_2",
            text: "Apakah perut sering terasa kembung, penuh, atau nyeri kram?",
            type: "single",
            options: [
              { id: "kd5", label: "Jarang", value: "Jarang" },
              { id: "kd6", label: "Sering/Terus menerus", value: "Sering" }
            ]
          }
        ]
      }
    };
  } else {
    // Default specific question
    specificQuestion = {
      id: 99,
      text: "Apakah ada keluhan fisik lain yang mencurigakan di tubuh Anda?",
      type: "single",
      options: [
        { id: "g1", label: "Saya merasa sehat", value: "Sehat" },
        { id: "g2", label: "Ada keluhan ringan (hilang timbul)", value: "Ringan" },
        { id: "g3", label: "Ada keluhan berat yang menetap", value: "Berat" }
      ],
      followUp: {
        triggerValues: ["Berat"],
        questions: [
          {
            id: "gen_detail_1",
            text: "Apakah Anda mengalami penurunan berat badan drastis tanpa diet?",
            type: "single",
            options: [
              { id: "gd1", label: "Tidak", value: "Tidak" },
              { id: "gd2", label: "Ya, >5kg dalam 3 bulan", value: "Ya" }
            ]
          }
        ]
      }
    };
  }

  const finalOpenQuestion: Question = {
    id: 100,
    text: "Ceritakan keluhan lain yang belum tercakup di atas secara detail:",
    type: "text",
    placeholder: "Contoh: Demam naik turun setiap malam, keringat dingin, dll..."
  };

  return [...BASE_QUESTIONS, specificQuestion, finalOpenQuestion];
};

export const DISCLAIMER_TEXT = "Hasil ini dihasilkan oleh AI sebagai screening awal dan BUKAN merupakan diagnosis medis. Selalu konsultasikan kondisi kesehatan Anda dengan dokter.";