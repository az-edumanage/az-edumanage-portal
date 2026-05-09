# BILLING_DASHBOARD_PLAN

## Goal
عرض جميع بيانات الفواتير والمدفوعات بشكل كامل وعملي داخل صفحة:
`http://localhost:4200/owner/billing`

## Scope (Phase 1)
1. عرض قائمة الفواتير (Invoices).
2. عرض قائمة المدفوعات (Payments/Transactions).
3. دعم البحث، الفلترة، والترتيب.
4. دعم pagination حقيقي من الباك اند.
5. عرض حالة الدفع بشكل واضح (PAID / PENDING / FAILED / EXPIRED).
6. إمكانية فتح تفاصيل الفاتورة/المعاملة.

## Data To Show
### Invoices Table
- Invoice ID (internal/provider)
- Reference / Transaction Ref
- Customer Name
- Customer Email
- Customer Phone
- Plan Name
- Billing Cycle (Monthly/Annual)
- Amount
- Currency
- Status
- Created At
- Updated At
- Paid At
- Next Renewal At

### Payments Table
- Payment ID / Transaction Ref
- Provider (Fawaterk)
- Provider Transaction ID
- Payment Channel (Card / Wallet / Fawry)
- Payment Method ID
- Amount
- Currency
- Status
- Provider Message
- Created At
- Updated At
- Paid At

## Backend Requirements
1. Endpoint لإرجاع invoices/payout data بشكل paginated.
2. Endpoint للتفاصيل حسب transactionRef أو invoiceId.
3. دعم query params للبحث والفلترة:
   - status
   - dateFrom/dateTo
   - paymentChannel
   - billingCycle
   - keyword
4. توحيد response contract للاستخدام في الداشبورد.

## Frontend Architecture (Dashboard)
1. إنشاء `BillingApiService`.
2. إضافة models/DTOs للفواتير والمدفوعات.
3. ربط صفحة `/owner/billing` بجدول رئيسي + tabs (Invoices / Payments).
4. إضافة search box + filters panel.
5. إضافة pagination component مع page size selector.
6. إضافة details drawer/modal.

## UX / UI Behavior
1. Default view = آخر المعاملات أولاً.
2. Status badges بألوان واضحة:
   - PAID: أخضر
   - PENDING: أصفر
   - FAILED: أحمر
   - EXPIRED: برتقالي
3. Empty states واضحة عند عدم وجود بيانات.
4. Loading skeleton أثناء التحميل.
5. Error state مع زر Retry.

## Security & Access
1. صفحة `/owner/billing` تكون محمية بصلاحيات owner/admin فقط.
2. أي endpoint للبيانات يتأكد من role-based access.
3. عدم إظهار أي secrets أو raw payload غير آمن في الواجهة العامة.

## Implementation Steps
1. مراجعة العقود الحالية للباك اند الخاصة بـ `ps_web_payment_tx`.
2. إنشاء/تعديل endpoints المطلوبة للـ listing + details + filters + pagination.
3. بناء `BillingApiService` وربطها بصفحة `/owner/billing`.
4. تنفيذ الجداول والتبويبات والفلترة والpagination.
5. اختبار البيانات الواقعية (Card/Fawry/Wallet) داخل الداشبورد.
6. تحسين الرسائل والحالات (loading/empty/error).

## Verification Checklist
- [ ] البيانات تظهر في `/owner/billing` من الباك اند الحقيقي.
- [ ] pagination يعمل بشكل صحيح.
- [ ] البحث والفلترة يرجعوا نتائج دقيقة.
- [ ] حالات الدفع تظهر بشكل صحيح.
- [ ] التفاصيل تفتح وتعرض نفس البيانات المخزنة.
- [ ] لا يوجد تسريب معلومات حساسة.

## Out of Scope (Now)
- تصدير PDF/Excel.
- Refund/void actions.
- تحليلات مالية متقدمة (charts/revenue analytics).

