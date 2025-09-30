import { GoogleGenAI } from "@google/genai";
import { Message, Sender } from "../types";

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
  { keywords: ["كشري", "أكلة", "أكل"], answer: "الكشري هو أشهر أكلة شعبية في مصر، وهو خليط من الأرز والمكرونة والعدس والحمص، ويعلوه صلصة الطماطم والبصل المقلي." },
  { keywords: ["نيل", "نهر"], answer: "نهر النيل هو شريان الحياة في مصر، وهو أطول نهر في العالم ويمر عبر القاهرة ومدن أخرى كثيرة." },
  { keywords: ["مثل", "شائع", "يقولوا"], answer: "مثل مصري شهير يقول: 'القرد في عين أمه غزال'، ويعني أن كل شخص يرى أحباءه في أجمل صورة." },
  { keywords: ["ملوخية"], answer: "الملوخية طبق مصري أصيل، وهي شوربة خضراء تُطهى بالثوم والكزبرة، وتقدم غالبًا مع الأرز أو الخبز." },
  { keywords: ["خان الخليلي"], answer: "خان الخليلي هو حي وسوق تاريخي شهير في القاهرة، معروف بالتحف والهدايا التذكارية والأجواء التراثية." },
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


export async function askRafeeq(question: string, history: Message[]): Promise<string> {
  try {
    const systemInstruction = `
    أنت "رفيق"، مساعد ذكي تجسد شخصية حكيم مصري قديم، صبور وشاعري. أنت لست مجرد آلة، بل حكواتي ينسج الكلمات بحكمة ودفء.
    
    **شخصيتك وقواعدك الأساسية:**
    1.  **الأسلوب:** تحدث بلغة عربية فصيحة، بليغة، لكنها قريبة من القلب ودافئة. تجنب الإنجليزية تمامًا. تخيل أنك تشارك خلاصة خبرتك مع صديق عزيز.
    2.  **العمق:** لا تقدم إجابات سطحية. غص في أعماق السؤال، استكشف جوانبه المختلفة، وقدم رؤية شاملة تكشف عن جوهرة مخبأة.
    3.  **السياق:** انتبه جيدًا للمحادثة السابقة لتبني على ما قيل وتقدم إجابات متصلة وذات معنى.
    4.  **النصيحة العملية (قاعدة إلزامية):** عند الإجابة على أي سؤال يتعلق بالصحة، الدين، أو الدراسة، **يجب** أن تختم إجابتك بفقرة خاصة تتبع هذا التنسيق حرفيًا:
        **النصيحة العملية:** [نصيحة واضحة ومباشرة يمكن تنفيذها فورًا].
        **السبب:** [شرح بسيط ومقنع لأهمية النصيحة].
    5.  **الأمان:** ارفض بأدب ولطف أي طلبات ضارة أو غير أخلاقية.
    6.  **الخاتمة:** اختم دائمًا بسؤال مفتوح يدعو للتفكير، أو بتشجيع يفتح آفاقًا جديدة للمستخدم.
    `;

    const contents = [
      ...history.map(msg => ({
        role: msg.sender === Sender.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      { role: 'user', parts: [{ text: question }] }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
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