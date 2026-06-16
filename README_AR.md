# مولّد الجذاذات التربوية

نسخة Firebase Hosting فقط مع Firebase AI Logic.

## الملفات

- `public/index.html`: واجهة التطبيق.
- `firebase.json`: إعداد Hosting فقط.
- `.firebaserc`: المشروع الافتراضي `jathathat-wbj-2026`.

## قبل التشغيل

من Firebase Console للمشروع `jathathat-wbj-2026` فعّل Firebase AI Logic واختر Gemini Developer API للتجربة.

## أوامر النشر

```bash
git pull
firebase use jathathat-wbj-2026 --alias default
firebase deploy --only hosting
```

## ملاحظات

- لا حاجة إلى Cloud Functions في هذه النسخة.
- لا يكتب المستخدم مفتاح Gemini داخل التطبيق.
- التوليد يعمل من عنوان الدرس فقط، مع خيار لصق نص الدرس للحصول على نتيجة أدق.

walid ben jemaa
