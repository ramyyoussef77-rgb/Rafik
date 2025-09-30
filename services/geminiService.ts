import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Offline FAQ data for fallback functionality, merged from provided lists.
const faq = [
  { keywords: ["عصر"], answer: "صلاة العصر اليوم في القاهرة الساعة ٤:١٢ مساءً." },
  { keywords: ["فجر"], answer: "الفجر يبدأ عند الأذان وينتهي عند شروق الشمس." },
  { keywords: ["مطر", "طقس", "جو"], answer: "لا أمطار متوقعة اليوم في القاهرة. الجو صحو!" },
  { keywords: ["نصيحة"], answer: "اشرب كوب ماء كل ساعة — جسمك يشكرك لاحقًا! 💧" },
  { keywords: ["دولار", "سعر"], answer: "السعر يتغير يوميًّا. تحقق من البنك المركزي المصري." },
  { keywords: ["عمرو دياب"], answer: "فنان مصري عالمي، لُقّب بـ'الهضبة'، من مواليد 1961." },
  { keywords: ["أركز", "تركيز", "امتحان"], answer: "نَم 8 ساعات، وتناول فطورًا خفيفًا، وتنفّس بعمق قبل البدء." },
  { keywords: ["أول آية", "قرآن"], answer: "بسم الله الرحمن الرحيم." },
  { keywords: ["أهرامات", "تقع"], answer: "في الجيزة، مصر — وتعتبر من عجائب الدنيا السبع." },
  { keywords: ["رمضان", "أيام"], answer: "إما 29 أو 30 يومًا، حسب رؤية الهلال." },
  { keywords: ["مشروع", "صغير", "أبدأ"], answer: "ابدأ بفكرة تحل مشكلة، واختبرها بـ100 جنيه قبل أن تستثمر أكثر." },
  { keywords: ["صداع", "علاج"], answer: "اشرب ماء، استرح في غرفة مظلمة، ودلّك صدغيك بلطف." },
  { keywords: ["قرآن", "أحفظ"], answer: "ابدأ بجزء عمّ، وكرّر 10 مرات يوميًّا مع فهم المعنى." },
];


/**
 * Searches the local FAQ for a relevant answer based on keywords.
 * @param question The user's question.
 * @returns A relevant answer from the FAQ or a default offline message.
 */
function getOfflineAnswer(question: string): string {
  const lowerCaseQuestion = question.toLowerCase();
  for (const item of faq) {
    if (item.keywords.some(keyword => lowerCaseQuestion.includes(keyword))) {
      return item.answer;
    }
  }
  return "عذرًا، هذا خارج نطاق معرفتي حاليًّا وأنا غير متصل بالإنترنت. لكنني أتعلم كل يوم!";
}


export async function askRafeeq(question: string): Promise<string> {
  try {
    const systemInstruction = `
    أنت رفيق، مساعد ذكي باللغة العربية فقط، وصديقٌ ودود يحب أن يفيد.
    - أجب بتفصيل كافٍ (حتى 15–20 سطرًا إذا لزم الأمر)، مع أمثلة واقعية.
    - عندما يطلب المستخدم قائمة أو عددًا محددًا من الأفكار (مثل "10 أفكار")، يجب أن تقدم العدد المطلوب بالضبط، مع تفصيل كل فكرة في فقرة منفصلة وواضحة.
    - استخدم لغة فصيحة واضحة، لكنها قريبة من القلب — كأنك تتحدث مع صديق عزيز.
    - تجنّب الإنجليزية تمامًا. لا تختصر الردود.
    - إذا كان السؤال عن دين أو صحة أو دراسة، اذكر نصيحة عملية + سببها.
    - لا تكرر نفس العبارات. كن مبدعًا في كل رد.
    - اختم دائمًا بسؤال لطيف أو تشجيع.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: question,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.85,
            topP: 0.92,
            maxOutputTokens: 500,
            thinkingConfig: { thinkingBudget: 100 },
        }
    });
    
    return response.text.trim();

  } catch (error) {
    console.error("Error calling Gemini API, falling back to offline:", error);
    // Fallback to offline FAQ
    return getOfflineAnswer(question);
  }
}