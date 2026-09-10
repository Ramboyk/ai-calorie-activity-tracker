import type { GeminiMealAnalysisResult } from "@/types/meal";

export const MEAL_ANALYSIS_SYSTEM_INSTRUCTION = `
Sen profesyonel, yapay zekâ destekli bir klinik beslenme ve görsel analiz uzmanısın (NutriTrack AI Vision Core).
Kullanıcının gönderdiği yemek fotoğrafını inceleyerek görseldeki tüm besin bileşenlerini tespit etmeli, porsiyon ve gramaj tahmini yapmalı, makro besin ve kalori değerlerini hesaplamalısın.

YAPILMASI GEREKENLER:
1. Görseldeki yiyecek ve içecekleri tespit et.
2. Tabak boyutu, derinliği, porsiyon yoğunluğu ve çatal/bıçak gibi referans nesnelerinden faydalanarak her besin için tahmini gramajı (estimatedWeightGrams) ve porsiyon ifadesini (estimatedPortion, örn: "150g", "1 porsiyon", "2 dilim") belirle.
3. Her besin maddesinin kalori (kcal), protein (g), karbonhidrat (g) ve yağ (g) değerlerini hesapla.
4. Toplam kalori, protein, karbonhidrat ve yağ değerlerini doğrula (kalemlerin toplamı ile total değerler birbiriyle tutarlı olmalıdır).
5. Tüm isimleri ve notları Türkçe olarak sun.

GÜVENLİK, ETİK VE SINIRLILIK KURALLARI:
- Asla kesin laboratuvar ölçümü iddiasında bulunma; her zaman görsel üzerinden yapılan akıllı bir tahmin olduğunu vurgula.
- Görselde net olarak seçilemeyen veya emin olunmayan besin maddelerini uydurma.
- Görselde hiç yemek yoksa veya görsel çok karanlık/belirsiz ise: confidence değerini "low" yap ve notes listesinde "Görselde net bir yemek tespit edilemedi, lütfen daha aydınlık bir fotoğraf deneyin." uyarısını ekle.
- KESİNLİKLE tıbbi teşhis, tedavi edici reçete, katı zayıflama vaadi veya klinik diyet tavsiyesi verme.
`.trim();

export const MEAL_ANALYSIS_PROMPT = `
Lütfen bu görseldeki yemeği analiz et. Besin maddelerini, porsiyon tahminlerini, kalorileri ve makroları çıkararak yanıtını belirtilen JSON şemasına birebir uygun biçimde üret.
`.trim();

export const MEAL_ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    mealName: {
      type: "STRING",
      description: "Yemeğin genel Türkçe başlığı, örn: 'Izgara Tavuklu Kinoa Salatası'",
    },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Besin maddesi adı" },
          estimatedPortion: { type: "STRING", description: "Porsiyon tanımı, örn: '150 g' veya '1 kase'" },
          estimatedWeightGrams: { type: "NUMBER", description: "Tahmini gramaj (g)" },
          calories: { type: "NUMBER", description: "Kalori miktarı (kcal)" },
          protein: { type: "NUMBER", description: "Protein miktarı (g)" },
          carbs: { type: "NUMBER", description: "Karbonhidrat miktarı (g)" },
          fat: { type: "NUMBER", description: "Yağ miktarı (g)" },
        },
        required: [
          "name",
          "estimatedPortion",
          "estimatedWeightGrams",
          "calories",
          "protein",
          "carbs",
          "fat",
        ],
      },
    },
    totalCalories: { type: "NUMBER", description: "Tabağın toplam kalorisi (kcal)" },
    totalProtein: { type: "NUMBER", description: "Toplam protein miktarı (g)" },
    totalCarbs: { type: "NUMBER", description: "Toplam karbonhidrat miktarı (g)" },
    totalFat: { type: "NUMBER", description: "Toplam yağ miktarı (g)" },
    confidence: {
      type: "STRING",
      enum: ["low", "medium", "high"],
      description: "Görsel tespitinin güven düzeyi",
    },
    notes: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Kullanıcı için bilgilendirme ve tahmin metodolojisi notları",
    },
  },
  required: [
    "mealName",
    "items",
    "totalCalories",
    "totalProtein",
    "totalCarbs",
    "totalFat",
    "confidence",
    "notes",
  ],
};

export const FALLBACK_MEAL_ANALYSIS: GeminiMealAnalysisResult = {
  mealName: "Izgara Tavuklu Pirinç ve Sebze Kasesi",
  items: [
    {
      name: "Izgara Tavuk Göğsü",
      estimatedPortion: "180 g",
      estimatedWeightGrams: 180,
      calories: 290,
      protein: 44,
      carbs: 0,
      fat: 6,
    },
    {
      name: "Yasemin Pirinci (Pişmiş)",
      estimatedPortion: "150 g (1 orta porsiyon)",
      estimatedWeightGrams: 150,
      calories: 210,
      protein: 4,
      carbs: 48,
      fat: 1,
    },
    {
      name: "Buharda Brokoli & Havuç",
      estimatedPortion: "100 g",
      estimatedWeightGrams: 100,
      calories: 60,
      protein: 2,
      carbs: 14,
      fat: 6,
    },
  ],
  totalCalories: 560,
  totalProtein: 50,
  totalCarbs: 62,
  totalFat: 13,
  confidence: "high",
  notes: [
    "Görseldeki tabak derinliği ve porsiyon dağılımı referans alınarak hesaplanmıştır.",
    "Sos veya ek yağ miktarı göz kararı tahmin edilmiştir.",
  ],
};
