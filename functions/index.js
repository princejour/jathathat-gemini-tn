const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

const ALLOWED_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite"
]);

exports.generateLessonPlan = onRequest({
  region: "europe-west1",
  secrets: [GEMINI_API_KEY],
  timeoutSeconds: 60,
  memory: "512MiB",
  cors: true
}, async (req, res) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const input = sanitizeInput(req.body || {});
    validateInput(input);

    const apiKey = GEMINI_API_KEY.value();
    if (!apiKey) {
      res.status(500).json({ error: "GEMINI_API_KEY secret is not configured." });
      return;
    }

    const model = ALLOWED_MODELS.has(input.model) ? input.model : "gemini-2.5-flash";
    const prompt = buildPrompt(input);
    const text = await generateWithGemini({ apiKey, model, prompt });

    res.status(200).json({ text, model });
  } catch (error) {
    logger.error("generateLessonPlan failed", error);
    const status = error.status || 500;
    res.status(status).json({ error: readableError(error) });
  }
});

function sanitizeInput(body) {
  const clean = {};
  const fields = ["matiere", "niveau", "titre", "duree", "effectif", "approche", "prereq", "moyens", "notes", "lessonText", "model", "mode"];

  for (const key of fields) {
    const max = key === "lessonText" ? 12000 : 900;
    clean[key] = String(body[key] || "").trim().slice(0, max);
  }

  clean.duree = clean.duree || "45 دقيقة";
  clean.effectif = clean.effectif || "20–30 تلميذاً";
  clean.approche = clean.approche || "المقاربة بالكفاءات";
  clean.mode = clean.mode === "source" ? "source" : "title";
  clean.model = clean.model || "gemini-2.5-flash";
  return clean;
}

function validateInput(input) {
  if (!input.matiere || !input.niveau || !input.titre) {
    const err = new Error("يرجى ملء الحقول الإلزامية: المادة والمستوى وعنوان الدرس.");
    err.status = 400;
    throw err;
  }
}

function buildPrompt(input) {
  const useSource = input.mode === "source" && input.lessonText;

  return `أنت خبير تربوي متخصص في إعداد الجذاذات. أنشئ جذاذة تربوية كاملة باللغة العربية الفصحى فقط.

قيود إلزامية:
- التزم حصراً بعنوان الدرس: ${input.titre}
- لا تضف دروساً أخرى ولا تخرج عن المادة: ${input.matiere}
- اجعل اللغة بسيطة ومناسبة لمستوى ${input.niveau}
- اجعل المحتوى عملياً وصالحاً مباشرة لكراس إعداد الدروس والطباعة.
- إذا وُجد نص درس أو مصدر في الأسفل فاعتمد عليه أساساً ولا تخالفه.
- إذا لم يوجد نص درس، أنشئ جذاذة من العنوان فقط مع تجنب الادعاء بأنها مأخوذة من وثيقة رسمية.

المعطيات:
- المادة: ${input.matiere}
- المستوى: ${input.niveau}
- الدرس: ${input.titre}
- المدة: ${input.duree}
- الفوج: ${input.effectif}
- الطريقة: ${input.approche}
- المكتسبات القبلية: ${input.prereq || "غير محددة"}
- الوسائل: ${input.moyens || "وسائل القسم المعتادة"}
${input.notes ? "- ملاحظات خاصة: " + input.notes : ""}
${useSource ? "\nنص الدرس/المصدر المعتمد:\n" + input.lessonText : ""}

اكتب الجذاذة وفق هذا الهيكل بالضبط:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        الجذاذة التربوية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◈ المعلومات العامة
  المادة    : ${input.matiere}
  المستوى   : ${input.niveau}
  الدرس     : ${input.titre}
  المدة     : ${input.duree}
  الطريقة   : ${input.approche}
  الفوج     : ${input.effectif}

◈ الكفاءة المستهدفة
[صغ كفاءة رئيسية دقيقة قابلة للملاحظة]

◈ الأهداف الإجرائية
في نهاية الحصة يكون التلميذ قادراً على:
١. [هدف معرفي دقيق]
٢. [هدف مهاري دقيق]
٣. [هدف وجداني أو تقييمي دقيق]

◈ المكتسبات القبلية
[اذكر المكتسبات الضرورية، وإن لم تُذكر فاستنتجها من الدرس]

◈ الوسائل والأدوات
[اذكر الوسائل التعليمية المناسبة والمتاحة]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         سير الدرس
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◈ أولاً — التمهيد والتهيئة  [~8 دقائق]
 نشاط المعلم:
 [خطوات واضحة]
 نشاط التلميذ:
 [ردود وأفعال متوقعة]
 أسئلة التمهيد:
 [2-3 أسئلة محفزة]

◈ ثانياً — بناء التعلمات  [~20 دقيقة]
 المحتوى المعرفي:
 [شرح دقيق للمفاهيم والمعارف الجديدة مناسب للمستوى]
 أمثلة توضيحية:
 [أمثلة ملموسة أو محلولة]
 نشاط التلميذ:
 [أنشطة فردية أو ثنائية أو جماعية]

◈ ثالثاً — الترسيخ والتطبيق  [~12 دقيقة]
 تمرين ١:
 [تمرين تطبيقي مناسب]
 تمرين ٢:
 [تمرين أعمق قليلاً]
 نشاط تعاوني:
 [نشاط تعاوني مضبوط]

◈ رابعاً — التقييم والخلاصة  [~5 دقائق]
 أسئلة التقييم:
 [3 أسئلة تقيس بلوغ الأهداف]
 ملخص السبورة:
 [ملخص موجز وواضح]
 الواجب المنزلي:
 [واجب مناسب ومحدود]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     توجيهات بيداغوجية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[3-4 نصائح مهنية للمعلم حول الفوارق الفردية، الصعوبات المتوقعة، وتفادي الأخطاء الشائعة]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
اكتب النتيجة النهائية مباشرة دون مقدمة خارجية ودون اعتذار.`;
}

async function generateWithGemini({ apiKey, model, prompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const payload = {
    systemInstruction: {
      parts: [{ text: "أنت مساعد تربوي محترف. التزم بالعربية الفصحى، بالدقة البيداغوجية، وبهيكل الجذاذة المطلوب دون خروج عن عنوان الدرس." }]
    },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.35,
      topP: 0.9,
      maxOutputTokens: 4500
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }

  if (!response.ok) {
    const err = new Error(data.error?.message || data.raw || `Gemini HTTP ${response.status}`);
    err.status = response.status;
    throw err;
  }

  const text = (data.candidates?.[0]?.content?.parts || [])
    .map(part => part.text || "")
    .join("")
    .trim();

  if (!text) {
    const err = new Error(data.promptFeedback?.blockReason ? `Blocked: ${data.promptFeedback.blockReason}` : "No text returned from Gemini.");
    err.status = 502;
    throw err;
  }

  return text;
}

function readableError(error) {
  const msg = error.message || "Unknown error";
  if (/API key|GEMINI_API_KEY/i.test(msg)) return "لم يتم ضبط مفتاح Gemini داخل Firebase Secret Manager.";
  if (/quota|429|rate/i.test(msg)) return "تم تجاوز حد الاستعمال أو الحصة المجانية لـ Gemini.";
  if (/permission|401|403|unauth/i.test(msg)) return "مفتاح Gemini غير صحيح أو لا يملك الصلاحية.";
  if (/model|404/i.test(msg)) return "النموذج المختار غير متاح لهذا المفتاح.";
  return msg.slice(0, 500);
}
