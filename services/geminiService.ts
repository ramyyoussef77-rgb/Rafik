
import { GoogleGenAI } from "@google/genai";
import { Message, Sender } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Offline FAQ data for fallback functionality
const faq = [
  { keywords: ["عصر"], answer: "صلاة العصر في القاهرة النهاردة الساعة ٤:١٢. متتأخرش!" },
  { keywords: ["فجر"], answer: "الفجر بيبدأ مع الأذان وبيخلص مع شروق الشمس." },
  { keywords: ["مطر", "طقس", "جو"], answer: "مفيش مطر متوقع النهاردة في القاهرة. الجو تمام!" },
  { keywords: ["نصيحة"], answer: "اشرب كوباية مية كل ساعة—جسمك هيدعيلك بعدين! 💧" },
  { keywords: ["دولار", "سعر"], answer: "يا غالي، السعر ده بيتغير كل ثانية. الأحسن تبص على موقع البنك الرسمي عشان تاخد الزتونة." },
  { keywords: ["عمرو دياب"], answer: "فنان مصري عالمي, معروف بـ'الهضبة', من مواليد 1961." },
  { keywords: ["أركز", "تركيز", "امتحان"], answer: "ألف سلامة! اشرب مية كتير، واقعد في أوضة ضلمة شوية. لو استمر، يبقى لازم دكتور." },
  { keywords: ["أول آية", "قرآن"], answer: "بسم الله الرحمن الرحيم." },
  { keywords: ["أهرامات", "تقع", "فين"], answer: "في الجيزة، يا باشا — ودي طبعًا من عجائب الدنيا السبع." },
  { keywords: ["رمضان", "أيام"], answer: "يا إما 29 أو 30 يوم، على حسب رؤية الهلال." },
  { keywords: ["مشروع", "صغير", "أبدأ"], answer: "ابدأ بفكرة بتحل مشكلة لناس كتير، وجربها بأقل فلوس ممكنة الأول." },
  { keywords: ["صداع", "علاج"], answer: "ألف سلامة! اشرب مية، ارتاح في أوضة ضلمة، ودلّك صدغك بالراحة. لو استمر، يبقى لازم دكتور." },
  { keywords: ["قرآن", "أحفظ"], answer: "ابدأ بجزء عمّ، وكرر الآيات 10 مرات كل يوم وحاول تفهم معناها." },
  { keywords: ["كشري", "أكلة", "أكل"], answer: "الكشري أشهر أكلة شعبية في مصر، ده خليط رز ومكرونة وعدس وحمص، وعليه صلصة وتقلية." },
  { keywords: ["نيل", "نهر"], answer: "النيل هو أساس الحياة في مصر، وأطول نهر في العالم. بيعدي على القاهرة ومدن تانية كتير." },
  { keywords: ["مثل", "شائع", "يقولوا"], answer: "فيه مثل مصري مشهور بيقول: 'القرد في عين أمه غزال'." },
  { keywords: ["ملوخية"], answer: "الملوخية دي أكلة مصرية أصيلة، شوربة خضرا بتتعمل بالتوم والكزبرة، وبتتاكل مع رز أو عيش." },
  { keywords: ["خان الخليلي"], answer: "خان الخليلي ده حي وسوق تاريخي في القاهرة القديمة، مشهور بالتحف والهدايا والأجواء التراثية." },
];


function getOfflineAnswer(question: string): string {
  const lowerCaseQuestion = question.toLowerCase();
  for (const item of faq) {
    if (item.keywords.some(keyword => lowerCaseQuestion.includes(keyword))) {
      return item.answer;
    }
  }
  return "معلش يا غالي، النت فاصل عندي حاليًا فمش هعرف أجاوب على دي. بس أنا بتعلم كل يوم!";
}

interface ImagePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export async function generateTitle(firstMessage: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `اقترح عنوان قصير جدًا (3 أو 4 كلمات بالكتير) ومناسب للمحادثة دي باللهجة المصرية: "${firstMessage}"`
        });
        let title = response.text.trim().replace(/"/g, '');
        // Limit title length for UI
        if (title.length > 50) {
            title = title.substring(0, 47) + '...';
        }
        return title;
    } catch (error) {
        console.error("Failed to generate title:", error);
        return "شات جديد"; // Fallback title
    }
}


/**
 * Streams a response from the Gemini API.
 * @param question The user's question.
 * @param history The recent conversation history.
 * @param image The optional image part for multimodal input.
 * @returns An async generator that yields chunks of the AI's response.
 */
export async function* streamRafeeq(
  question: string, 
  history: Message[], 
  image?: ImagePart
): AsyncGenerator<string> {
  const systemInstruction = `
    أنت "الغالي"، مساعد ذكي وشخصيتك هي الصديق المصري المثقف، الجدع، خفيف الظل، واللي بيعرف يتكلم زي "ولاد البلد". أنت مش روبوت ولا موظف رسمي. هدفك تساعد وتدردش مع المستخدم كأنكم أصحاب قاعدين مع بعض.

    **شخصيتك وقواعدك الأساسية ("الزتونة"):**

    1.  **الاسم واللهجة:**
        *   اسمك "الغالي".
        *   كلامك 100% مصري عامي. استخدم كلمات زي "إيه"، "إزاي"، "عشان"، "دلوقتي"، "عايز/عايزة"، "فلوس"، "شوية"، "أوي".
        *   استخدم النفي بـ "مش" أو "ما...ش" (مثال: "مش كويس"، "معرفتش").
        *   استخدم "هـ" أو "حـ" للمستقبل (مثال: "هروح بكرة").
        *   خلي كلمات الاستفهام في آخر الجملة (مثال: "أنت عايز إيه؟").
        *   الضمائر الإشارية بتيجي بعد الاسم (مثال: "الراجل ده"، "البنت دي").
        *   النطق (مهم للكتابة): الـ "ج" دايماً G (زي كلمة "جبنة"). الـ "ق" بتبقى همزة (زي كلمة "قلم" بتتنطق "ألم"). الـ "ث" بتبقى "س" أو "ت".

    2.  **الأسلوب (ابن بلد ومثقف):**
        *   **ودود ومش رسمي:** كلم المستخدم كأنه صاحبك. استخدم تعبيرات زي "يا غالي" أو "يا باشا" عشان الكلام يبقى ودي.
        *   **ممنوع الفوقية:** **إياك** تستخدم أي تعبيرات أبوية. أنت والمستخدم زي بعض.
        *   **خفيف الظل:** عندك حس فكاهة مصري. ممكن ترمي إفيه أو مثل في نص الكلام بس يكون في محله. استخدم تعبيرات زي "يا سلام!" أو "طب..." أو "ماشي".

    3.  **شريك في الحوار (مش مجرد google):**
        *   **خليك فضولي ومبادر:** مش بس تجاوب وتقف. اسأل أسئلة متابعة ذكية بتدل إنك مهتم بجد وبتفكر معاه. خلي الحوار رايح جاي.
        *   **مثال (وصفة أكل):** لو سأل عن وصفة، اسأله: "**عينيا ليك يا غالي! بس قول لي الأول، بتعرف تطبخ كويس ولا دي أول مرة تجرب عشان أقولك على شوية تكات؟**"
        *   **مثال (ترشيح فيلم):** لو طلب ترشيح فيلم، اسأله: "**أكيد! بس مودك إيه دلوقتي؟ عايز حاجة كوميدي تفرفشك ولا فيلم يخليك تفكر؟**"

    4.  **الجدعنة (المواساة أولاً):**
        *   لو حسيت المستخدم متضايق أو متوتر، أول حاجة تعملها هي الطبطبة بـ "معلش". اهتم بمشاعره قبل ما تدي له حلول.
        *   **مثال:** "**سلامتك ألف سلامة، إيه اللي مضايقك بس؟**" أو "**معلش، كلنا بيعدي علينا أيام صعبة. فضفضلي لو حابب.**"

    5.  **الأمانة والأخطاء:**
        *   لو اتطلب منك حاجة غلط أو مؤذية، ارفض بذوق وجدعنة، ووضح ليه ده مش صح.
        *   لو مفهمتش السؤال، قول بصراحة: "**معلش يا غالي، مفهمتش أوي. ممكن تقولها بطريقة تانية؟**"

    6.  **بداية ونهاية الحوار:**
        *   **التحية:** ابدأ بترحيب دافي زي "**أهلاً بيك يا غالي! إزيك؟ أنا في خدمتك، أؤمرني.**"
        *   **الخاتمة:** انهي كلامك بشكل ودي زي "**يلا، مع السلامة. لو احتجت أي حاجة تانية، أنا موجود.**"
    `;

    const contents = [
      ...history.map(msg => {
        const parts: any[] = [{ text: msg.text }];
        // Note: For simplicity, this history mapping doesn't re-include images from past messages.
        // A more advanced implementation might handle this.
        return {
          role: msg.sender === Sender.USER ? 'user' : 'model',
          parts: parts,
        };
      }),
    ];

    const userParts: any[] = [{ text: question }];
    if (image) {
      userParts.push(image);
    }
    contents.push({ role: 'user', parts: userParts });


  try {
    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.85,
            topP: 0.92,
            thinkingConfig: { thinkingBudget: 100 },
        }
    });
    
    for await (const chunk of responseStream) {
        yield chunk.text;
    }

  } catch (error) {
    console.error("Error calling Gemini API, falling back to offline:", error);
    yield getOfflineAnswer(question);
  }
}
