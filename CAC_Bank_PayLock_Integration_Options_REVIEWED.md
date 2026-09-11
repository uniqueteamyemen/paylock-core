# CAC Bank × PayLock

خيارات الربط التقني في PoC

دليل عملي لفهم ما قد يعرضه CAC بعد اختيار العملية

الهدف: التفريق بين «بيئة التشغيل» و«وسيلة النقل/التكامل». هذه نقطة تقنية مهمة: Sandbox/Staging ليستا بروتوكول ربط، وWebhook/Queue/API ليست بيئات. قد يجمع CAC بين أي بيئة مناسبة ووسيلة نقل مناسبة.

## 1. المستويات التي قد يختار منها CAC

| المستوى | أمثلة | السؤال التقني |
| --- | --- | --- |
| بيئة | Sandbox / Staging / Test | أين يمكن تشغيل lifecycle دون أموال أو بيانات إنتاجية؟ |
| Transport / Interface | REST/SOAP API / Webhook / Queue / ESB / File | كيف تصل الأحداث أو الطلبات بين CAC والـAdapter؟ |
| اختبار/محاكاة | Synthetic / Mock / Simulated lifecycle | هل نستطيع تشغيل أحداث كاملة ومترابطة دون نظام مصرفي حقيقي؟ |
| قراءة فقط | Reporting/API/Feed | هل توجد قناة قراءة تعطي الأحداث المطلوبة دون write-back؟ |

## 2. خيارات الواجهة المحتملة

| الواجهة | كيف تعمل تقنيًا | ما نحتاجه من CAC | ملاءمتها للـPoC |
| --- | --- | --- | --- |
| REST/SOAP Test API | Adapter يستدعي أو يستهلك API موثقة في الاختبار. | API spec، endpoints، auth، payloads، test credentials. | ممتاز إذا كانت العمليات والأحداث واضحة. |
| Webhook / Event Callback | CAC يرسل حدثًا إلى endpoint لدى الـAdapter. | Event schema، source authentication/signature، retry، delivery ID. | ممتاز للأحداث اللحظية. |
| Message Queue / Event Bus | الأحداث تصل عبر وسيط رسائل مؤسسي. | نوع الوسيط، topic/queue، schema، consumer access، security، ordering. | قوي مؤسسيًا، لكنه يحتاج تنسيقًا أكبر. |
| ESB / Integration Gateway | تكامل عبر طبقة مؤسسية تدير الربط بين الأنظمة. | Contract، routing، auth، transformation، test route. | ممتاز إذا كان هو المسار القياسي للبنك. |
| File / Batch | تبادل ملفات اختبارية أو نتائج دورية. | schema، النقل الآمن، identifiers، cadence، failure handling. | ممكن، لكنه أقل فورية. |
| Read-only Feed | قراءة أحداث/حالات من interface لا تسمح بالكتابة. | حقول البيانات، freshness، identifiers، صلاحيات القراءة. | مفيد إذا كانت الأحداث كافية لإعادة lifecycle. |
| Synthetic / Mock lifecycle | محاكاة كاملة للأحداث والنتائج. | fixtures، السيناريوهات، expected results، آلية تشغيلها. | ممتاز كبداية عند غياب Sandbox كامل. |

## 3. ما لا ينبغي الخلط بينه

Webhook لا يعني بالضرورة أن PayLock يستطيع الوثوق بالحدث؛ يجب توثيق مصدره وآلية التوقيع/المصادقة وdelivery ID.

IP address ليس هوية نظام أو مستخدم. يمكن استخدامه كبيان سياقي إذا كانت سياسة البنك تسمح، لكن الثقة تأتي من قناة المصادقة والضوابط الشبكية.

Device fingerprint ليس authentication. إذا كان مطلوبًا كجزء من evidence، يجب تحديد مصدره، طريقة جمعه، وعلاقته العملية بالجلسة.

H1 ليس instruction مالية. أي استخدام لاحق له ضمن settlement أو debit هو قرار تكامل منفصل يخضع لضوابط البنك.

## 4. ما الذي سيبنيه المبرمج حسب الخيار؟

| إذا اختار CAC | المكوّن التقني المتوقع |
| --- | --- |
| Test API | API client + auth + schema validation + correlation + mapping |
| Webhook | HTTPS receiver + auth/signature validation + deduplication + mapping |
| Message Queue/Event Bus | Secure consumer + message validation + ordering/correlation + deduplication |
| ESB/Gateway | Connector مع contract التحويل الذي يقدمه البنك + security integration |
| File/Batch | Secure intake + schema validation + correlation + replay handling |
| Read-only Feed | Read connector + extraction + freshness checks + mapping |
| Synthetic/Mock | Fixtures + scenario runner + lifecycle assertions + failure/replay tests |

## 5. ما الذي يهم المختص المالي/التشغيلي؟

| الخيار | المغزى التشغيلي |
| --- | --- |
| Sandbox/Staging + API/Webhook | اختبار قريب من الواقع مع عزل عن الإنتاج. |
| Synthetic/Mock | إثبات الفكرة بدون مخاطرة مالية، لكنه لا يثبت التكامل مع النظام الحقيقي إلا بقدر ما تُغطيه المحاكاة. |
| Queue/ESB | يناسب بيئات مؤسسية إذا كانت الأحداث أصلًا تمر عبر هذه الطبقات. |
| File/Batch | يناسب الأنظمة الدورية، لكن يجب تقييم دقة التوقيت إذا كان proof يعتمد على ترتيب زمني. |
| Read-only | أقل تدخلًا؛ لكن قد لا يكفي إذا كان الـPoC يحتاج إشارات لحظية أو confirmation من نقطة التنفيذ. |

## 6. إذا قال البنك...

| رد CAC | ما يعنيه | خطوتك التالية |
| --- | --- | --- |
| لدينا Sandbox | بيئة اختبار معزولة. | اطلب contract العملية والأحداث والبيانات التجريبية. |
| لدينا Test API فقط | واجهة اختبار رسمية. | اطلب OpenAPI/WSDL أو ما يعادلها + auth + samples. |
| نرسل Webhooks | حدث يخرج من CAC إلى الخارج. | اطلب event signature/verification وretry/delivery IDs. |
| لدينا Message Queue | تكامل event-driven داخلي. | اطلب consumer contract وtest topic/queue وsecurity model. |
| لا يوجد Sandbox كامل | لا يعني توقف الـPoC. | اسأل عن staging أو synthetic/test interface. |
| لا نستطيع إعطاء وصول مباشر | أمر طبيعي في بنك. | اطلب interface موثقة بدل access داخلي. |
| لدينا بيانات اختبار فقط | يمكن محاكاة جزء من lifecycle. | تحقق هل يمكن تشغيل أحداث مترابطة لا مجرد ملفات ثابتة. |

## 7. أفضلية عملية، وليست قاعدة

إذا كان لدى CAC عدة بدائل، فالأفضل عادةً اختيار أقرب مسار إلى الواجهة القياسية الموجودة لديهم مع أقل صلاحيات وأقل تغيير. لا نفضل تقنية بعينها على حساب سياسة البنك. والاختيار النهائي يجب أن يُبنى على جودة الحدث، أصالته، correlation، وإمكانية اختبار حالات الفشل والتكرار.

## 8. ما نريد الخروج به من الاجتماع

العملية المختارة للـPoC.

بيئة الاختبار أو طريقة المحاكاة.

الواجهة/transport المعتمدة.

مخطط lifecycle ومصادر الأحداث.

الشخص التقني المسؤول من CAC.
