import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'ezrm.lang';

export const strings = {
  ar: {
    dir: 'rtl',
    appName: 'EZRM',
    tagline: 'تتبع الديزل والرحلات',

    // Auth
    login: 'تسجيل الدخول',
    loggingIn: 'جارٍ الدخول…',
    logout: 'خروج',
    employeeId: 'رقم الموظف',
    phoneOrPassword: 'رقم الهاتف / كلمة المرور',
    wrongCredentials: 'رقم الموظف أو كلمة المرور غير صحيحة',
    unknownRole: 'هذا الحساب غير مرتبط بوظيفة. يجب أن يبدأ البريد بـ driver أو mechanic أو manager.',
    loginNeedsInternet: 'تسجيل الدخول يحتاج إلى إنترنت. بعد الدخول مرة واحدة يعمل التطبيق بدون إنترنت.',
    welcome: 'أهلاً',

    // Roles
    driver: 'سائق',
    mechanic: 'ميكانيكي',
    manager: 'مدير',

    // Navigation
    back: 'رجوع',
    chooseAction: 'اختر ما تريد تسجيله',

    // Shared form
    truck: 'الشاحنة',
    noTrucks: 'لا توجد شاحنات. اطلب من المدير إضافة شاحنة.',
    odometer: 'العداد (آخر ٤ أرقام)',
    odometerHint: 'اكتب آخر أربعة أرقام',
    save: 'حفظ',
    saving: 'جارٍ الحفظ…',
    savedOnline: 'تم الحفظ ✅',
    savedOffline: 'تم الحفظ على الجهاز ✅ سيتم الإرسال عند عودة الإنترنت',
    required: 'هذا الحقل مطلوب',
    optional: 'اختياري',
    recentEntries: 'آخر التسجيلات',
    noEntries: 'لا توجد تسجيلات بعد',

    // Log types
    dieselLog: 'تعبئة ديزل',
    liters: 'اللترات',
    ureaLog: 'تعبئة يوريا',
    gallons: 'الجالونات',
    tripLog: 'رحلة',
    origin: 'من',
    destination: 'إلى',
    tonnage: 'الحمولة (طن)',
    maintenanceLog: 'صيانة',
    workPerformed: 'العمل المنفذ',
    notes: 'ملاحظات',

    // Manager
    managerPanel: 'لوحة المدير',
    trucks: 'الشاحنات',
    manageTrucks: 'إضافة وحذف الشاحنات',
    allLogs: 'كل السجلات',
    viewAllLogs: 'عرض وتصدير جميع التسجيلات',
    payments: 'الدفعات',
    managePayments: 'تسجيل المبالغ المدفوعة',

    truckNumber: 'رقم الشاحنة',
    truckPlate: 'رقم اللوحة',
    addTruck: 'إضافة شاحنة',
    deleteTruck: 'حذف',
    confirmDeleteTruck: 'هل تريد حذف هذه الشاحنة؟',
    truckExists: 'رقم الشاحنة موجود مسبقاً',

    paidTo: 'المدفوع له',
    amount: 'المبلغ',
    paymentNote: 'الوصف',
    addPayment: 'تسجيل دفعة',
    paymentsList: 'سجل الدفعات',

    // Logs table
    type: 'النوع',
    dateTime: 'التاريخ والوقت',
    user: 'المستخدم',
    details: 'التفاصيل',
    all: 'الكل',
    filterType: 'النوع',
    filterTruck: 'الشاحنة',
    from: 'من تاريخ',
    to: 'إلى تاريخ',
    exportCsv: '⬇️ تصدير Excel',
    refresh: '🔄 تحديث',
    resultsCount: 'النتائج',
    loading: 'جارٍ التحميل…',

    // Connectivity
    offline: 'لا يوجد إنترنت — تابع العمل، سيتم الإرسال تلقائياً',
    pendingSync: 'بانتظار الإرسال',

    genericError: 'حدث خطأ. حاول مرة أخرى.',

    // Password
    changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور الجديدة',
    passwordTooShort: 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل',
    passwordMismatch: 'كلمتا المرور غير متطابقتين',
    passwordChanged: 'تم تغيير كلمة المرور ✅',
    wrongCurrentPassword: 'كلمة المرور الحالية غير صحيحة',

    // Manager: staff accounts
    staffAccounts: 'حسابات السائقين والميكانيكي',
    manageStaffAccounts: 'تغيير كلمات مرور السائقين والميكانيكي',
    setNewPasswordFor: 'كلمة مرور جديدة لـ',
    setPassword: 'تعيين',
    passwordSetFor: 'تم تعيين كلمة المرور ✅',
    noStaffAccounts: 'لا توجد حسابات بعد',
    adminNotConfigured:
      'هذه الميزة تحتاج إعداد إضافي على الخادم (مفتاح Firebase Admin). راجع ملف README.',
  },

  en: {
    dir: 'ltr',
    appName: 'EZRM',
    tagline: 'Diesel & trip tracking',

    login: 'Log in',
    loggingIn: 'Logging in…',
    logout: 'Log out',
    employeeId: 'Employee ID',
    phoneOrPassword: 'Phone number / password',
    wrongCredentials: 'Wrong employee ID or password',
    unknownRole:
      'This account has no role. Its email must start with driver, mechanic or manager.',
    loginNeedsInternet: 'Logging in needs internet. After the first login the app works offline.',
    welcome: 'Welcome',

    driver: 'Driver',
    mechanic: 'Mechanic',
    manager: 'Manager',

    back: 'Back',
    chooseAction: 'What do you want to log?',

    truck: 'Truck',
    noTrucks: 'No trucks yet. Ask the manager to add one.',
    odometer: 'Odometer (last 4 digits)',
    odometerHint: 'Enter the last four digits',
    save: 'Save',
    saving: 'Saving…',
    savedOnline: 'Saved ✅',
    savedOffline: 'Saved on this device ✅ It will upload when you are back online',
    required: 'This field is required',
    optional: 'optional',
    recentEntries: 'Recent entries',
    noEntries: 'Nothing logged yet',

    dieselLog: 'Diesel',
    liters: 'Litres',
    ureaLog: 'Urea',
    gallons: 'Gallons',
    tripLog: 'Trip',
    origin: 'From',
    destination: 'To',
    tonnage: 'Tonnage (tons)',
    maintenanceLog: 'Maintenance',
    workPerformed: 'Work performed',
    notes: 'Notes',

    managerPanel: 'Manager panel',
    trucks: 'Trucks',
    manageTrucks: 'Add and delete trucks',
    allLogs: 'All logs',
    viewAllLogs: 'View and export every entry',
    payments: 'Payments',
    managePayments: 'Record cash paid to workers',

    truckNumber: 'Truck number',
    truckPlate: 'Plate number',
    addTruck: 'Add truck',
    deleteTruck: 'Delete',
    confirmDeleteTruck: 'Delete this truck?',
    truckExists: 'That truck number already exists',

    paidTo: 'Paid to',
    amount: 'Amount',
    paymentNote: 'Description',
    addPayment: 'Record payment',
    paymentsList: 'Payment history',

    type: 'Type',
    dateTime: 'Date & time',
    user: 'User',
    details: 'Details',
    all: 'All',
    filterType: 'Type',
    filterTruck: 'Truck',
    from: 'From date',
    to: 'To date',
    exportCsv: '⬇️ Export to Excel',
    refresh: '🔄 Refresh',
    resultsCount: 'Results',
    loading: 'Loading…',

    offline: 'No internet — keep going, everything uploads automatically',
    pendingSync: 'Waiting to upload',

    genericError: 'Something went wrong. Please try again.',

    changePassword: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordMismatch: 'Passwords do not match',
    passwordChanged: 'Password changed ✅',
    wrongCurrentPassword: 'Current password is incorrect',

    staffAccounts: 'Driver & mechanic accounts',
    manageStaffAccounts: 'Change a driver or mechanic password',
    setNewPasswordFor: 'New password for',
    setPassword: 'Set',
    passwordSetFor: 'Password set ✅',
    noStaffAccounts: 'No accounts yet',
    adminNotConfigured:
      'This feature needs one more server setup step (a Firebase Admin key). See the README.',
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('ar');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved === 'ar' || saved === 'en') setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang;
    document.documentElement.dir = strings[lang].dir;
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => {
    const dict = strings[lang];
    return {
      lang,
      dir: dict.dir,
      isRtl: dict.dir === 'rtl',
      setLang,
      toggle: () => setLang(lang === 'ar' ? 'en' : 'ar'),
      t: (key) => dict[key] ?? key,
    };
  }, [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
