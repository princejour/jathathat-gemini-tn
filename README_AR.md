# مولّد الجذاذات التربوية — Firebase + Gemini

هذا المشروع يحتوي على مولّد جذاذات تربوية باللغة العربية يعمل بواجهة HTML وFirebase Cloud Function آمنة لاستدعاء Gemini.

## البنية

- `public/index.html` واجهة التطبيق.
- `functions/index.js` دالة آمنة تستدعي Gemini من السيرفر.
- `firebase.json` إعداد Firebase Hosting وربط `/api/generateLessonPlan` بالدالة.
- `.firebaserc` يضبط المشروع الافتراضي: `jathathat-gemini-tn`.

## لماذا هذه النسخة آمنة؟

مفتاح Gemini API لا يوجد داخل ملف HTML ولا يظهر للزوار. يتم حفظه داخل Firebase Secret Manager باسم:

```bash
GEMINI_API_KEY
```

## أوامر النشر

من Google Cloud Shell أو جهازك:

```bash
npm install -g firebase-tools
firebase login
firebase use jathathat-gemini-tn
cd functions
npm install
cd ..
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions,hosting
```

عند تنفيذ أمر secret سيطلب منك لصق مفتاح Gemini API. احصل عليه من Google AI Studio.

## مهم

- التوليد يعمل دون رفع الدرس، من خلال المادة + المستوى + عنوان الدرس.
- توجد خانة اختيارية للصق نص الدرس إذا أردت جذاذة أدق.
- إذا ظهر خطأ حول Secret، نفّذ أمر `firebase functions:secrets:set GEMINI_API_KEY` ثم أعد النشر.
- إذا كان Project ID مختلفًا، غيّر القيمة داخل `.firebaserc`.

## المطوّر

walid ben jemaa
