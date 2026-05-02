I need to update the Modules Features management page:

Path:
 /owner/settings/modules-features

Goal:
Replace the current hardcoded/static features data with the full new features catalog provided below.

Requirements:
1. Keep the same current UI/UX and current behavior of the page.
2. Preserve existing columns/fields:
   - price
   - status
   - action
3. Do not remove existing actions or status handling.
4. The features must be stored/seeded from the backend, not hardcoded in the frontend.
5. The frontend should load the modules/features from the backend API.
6. Each feature must have:
   - English name
   - Arabic translation/name
   - module/category it belongs to
   - price
   - status
7. Add Arabic translations for every feature.
8. If backend already has a seed/migration/data table for module features, replace/update it properly.
9. If no backend structure exists, create the correct backend model/entity/DTO/API/seed needed for this page.
10. Keep the implementation aligned with the current project architecture and patterns.

Modules and features to seed:

Academic Structure:
- Academic Years Management — إدارة السنوات الدراسية
- Terms / Semesters — إدارة الفصول الدراسية / الترمات
- Levels / Grades — إدارة المراحل / الصفوف الدراسية
- Classes / Groups — إدارة الفصول / المجموعات
- Subjects Management — إدارة المواد الدراسية
- Subject Assignment to Levels — ربط المواد بالمراحل الدراسية
- Teacher Assignment to Subjects — ربط المدرسين بالمواد
- Classroom / Room Management — إدارة القاعات / الفصول
- Multi-branch structure — هيكل متعدد الفروع
- Curriculum templates (reuse across tenants) — قوالب المناهج القابلة لإعادة الاستخدام بين المستأجرين
- Custom subject weighting — أوزان مخصصة للمواد

Students Management:
- Student Profile — ملف الطالب
- Enrollment — التسجيل / الالتحاق
- Student documents (uploads) — مستندات الطالب والمرفقات
- Behavior notes / disciplinary logs — ملاحظات السلوك والسجلات التأديبية
- Medical notes — الملاحظات الطبية
- Bulk import/export — استيراد وتصدير جماعي
- Academic History — السجل الأكاديمي
- Attendance Tracking — تتبع الحضور
- Student Status (active / suspended / graduated) — حالة الطالب: نشط / موقوف / متخرج
- Guardian/Parent linking — ربط ولي الأمر / الوصي

Scheduling & Timetable:
- Class Scheduling — جدولة الحصص
- Teacher Allocation — توزيع المدرسين
- Student Allocation — توزيع الطلاب
- Weekly Timetable — الجدول الأسبوعي
- Conflict Detection (teacher / room / student) — كشف التعارضات للمدرس / القاعة / الطالب
- Auto scheduling engine — محرك جدولة تلقائي
- Recurring schedules — الجداول المتكررة
- Substitute teacher handling — إدارة المدرس البديل
- Real-time updates — تحديثات لحظية

Users Management:
- Users CRUD — إدارة المستخدمين إضافة / تعديل / حذف / عرض
- Roles (Admin / Teacher / Staff) — الأدوار: مدير / مدرس / موظف
- Permissions (granular) — صلاحيات تفصيلية
- Authentication (login/logout) — تسجيل الدخول والخروج
- Custom roles — أدوار مخصصة
- Permission templates — قوالب الصلاحيات
- Activity tracking per user — تتبع نشاط كل مستخدم
- Multi-factor auth — المصادقة متعددة العوامل

Audit Logs:
- Track all actions (CRUD operations) — تتبع كل العمليات
- Login/logout logs — سجلات الدخول والخروج
- Who did what & when — من فعل ماذا ومتى
- Export logs — تصدير السجلات
- Filtering/search — البحث والتصفية
- Security alerts — تنبيهات أمنية
- Immutable logs (compliance mode) — سجلات غير قابلة للتعديل لوضع الامتثال

Exams & Grades:
- Exam creation — إنشاء الامتحانات
- Assign exams to classes — ربط الامتحانات بالفصول
- Marks entry — إدخال الدرجات
- Grade calculation — حساب التقديرات
- Report cards — بطاقات / تقارير النتائج
- Weighted grading system — نظام درجات موزون
- GPA calculation — حساب المعدل التراكمي
- Exam scheduling integration — تكامل جدولة الامتحانات
- Result analytics — تحليلات النتائج

Finance:
- Student billing — فواتير الطلاب
- Payment tracking — تتبع المدفوعات
- Invoices — الفواتير
- Discounts — الخصومات
- Payment status — حالة الدفع
- Installments plans — خطط التقسيط
- Multi-currency — تعدد العملات
- Financial reports — التقارير المالية
- Expense tracking — تتبع المصروفات

SMS Integration:
- Send SMS to students/parents — إرسال رسائل SMS للطلاب وأولياء الأمور
- Templates (basic) — قوالب رسائل أساسية
- Manual notifications — إشعارات يدوية
- Event-based triggers — إرسال تلقائي حسب الأحداث
- Bulk messaging — إرسال جماعي
- Provider routing (Twilio / local SMS gateway) — توجيه مزودي الخدمة مثل Twilio أو بوابة SMS محلية
- Delivery tracking — تتبع التسليم

Advanced Analytics:
- Basic dashboards — لوحات متابعة أساسية
- Custom reports builder — منشئ تقارير مخصص
- Predictive analytics (dropout risk) — تحليلات تنبؤية لمخاطر التسرب
- Teacher performance metrics — مؤشرات أداء المدرسين
- Financial insights — رؤى مالية
- Export (Excel / PDF) — تصدير Excel / PDF

Parent Portal:
- View student profile — عرض ملف الطالب
- Attendance — الحضور
- Grades — الدرجات
- Schedule — الجدول
- Notifications — الإشعارات
- Payment tracking — تتبع المدفوعات
- Messaging with center — التواصل مع السنتر
- Multi-child support — دعم أكثر من طفل

LMS:
- Course content (videos / PDFs) — محتوى الدورات: فيديوهات / ملفات PDF
- Lesson structure — هيكل الدروس
- Assignments — الواجبات
- Progress tracking — تتبع التقدم
- Live classes integration — تكامل الحصص المباشرة
- Video streaming — بث الفيديو
- Quizzes — الاختبارات القصيرة
- Certificates — الشهادات
- Discussion forums — منتديات النقاش

Question Bank:
- Create questions — إنشاء الأسئلة
- Categorize by subject/level — تصنيف حسب المادة / المرحلة
- Difficulty levels — مستويات الصعوبة
- Reuse questions — إعادة استخدام الأسئلة
- Random exam generation — توليد امتحانات عشوائية
- Question tagging (skills/topics) — وسوم الأسئلة حسب المهارات / الموضوعات
- Import/export — استيراد وتصدير
- AI-generated questions — أسئلة مولدة بالذكاء الاصطناعي

Acceptance Criteria:
- /owner/settings/modules-features displays the new catalog from backend API.
- No feature data remains hardcoded in the frontend.
- Every feature has Arabic + English labels.
- Existing price/status/action columns still work.
- Existing page layout and interaction style remains unchanged.
- Backend tests/build pass.
- Frontend build passes.
- Add/update a short execution note in the related task/plan markdown if the project uses one.