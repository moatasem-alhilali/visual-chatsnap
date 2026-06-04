export interface StudioLabels {
  appTitle: string;
  appSubtitle: string;
  platform: string;
  device: string;
  iphone: string;
  android: string;
  font: string;
  statusBarTitle: string;
  sbWifi: string;
  sbCellular: string;
  sbBatteryPct: string;
  chatTheme: string;
  light: string;
  dark: string;
  people: string;
  me: string;
  them: string;
  name: string;
  photo: string;
  upload: string;
  remove: string;
  swapRoles: string;
  presence: string;
  online: string;
  typing: string;
  lastSeen: string;
  lastSeenText: string;
  messages: string;
  addMessage: string;
  addFromMe: string;
  addFromThem: string;
  empty: string;
  text: string;
  sender: string;
  type: string;
  typeText: string;
  typeVoice: string;
  typeImage: string;
  time: string;
  delay: string;
  typingDur: string;
  status: string;
  sent: string;
  delivered: string;
  read: string;
  voiceLen: string;
  duplicate: string;
  delete: string;
  moveUp: string;
  moveDown: string;
  play: string;
  pause: string;
  resume: string;
  restart: string;
  reset: string;
  record: string;
  exitRecord: string;
  recordHint: string;
  save: string;
  load: string;
  clear: string;
  exportJson: string;
  importJson: string;
  newScenario: string;
  saved: string;
  loaded: string;
  noSave: string;
  cleared: string;
  timeline: string;
  seconds: string;
  data: string;
  messagePlaceholder: string;
  hideControls: string;
  showControls: string;
  exportVideo: string;
  exportStart: string;
  exportRendering: string;
  exportDone: string;
  exportAgain: string;
  exportCancel: string;
  exportError: string;
  exportUnsupported: string;
  exportHint: string;
  exportBackground: string;
  exportFps: string;
}

export const STUDIO_LABELS: Record<"ar" | "en", StudioLabels> = {
  ar: {
    appTitle: "استوديو سيناريو المحادثات",
    appSubtitle: "اصنع محادثة واقعية ثم شغّلها وسجّل شاشتك",
    platform: "المنصة",
    device: "الجهاز",
    iphone: "آيفون",
    android: "سامسونج",
    font: "خط سامسونج",
    statusBarTitle: "شريط الحالة",
    sbWifi: "واي‑فاي",
    sbCellular: "تغطية الجوّال",
    sbBatteryPct: "نسبة البطارية",
    chatTheme: "ثيم المحادثة",
    light: "فاتح",
    dark: "داكن",
    people: "الأشخاص",
    me: "أنا (صاحب الجهاز)",
    them: "الطرف الآخر",
    name: "الاسم",
    photo: "الصورة",
    upload: "رفع صورة",
    remove: "حذف",
    swapRoles: "تبديل الأدوار",
    presence: "حالة الطرف الآخر",
    online: "متصل الآن",
    typing: "يكتب…",
    lastSeen: "آخر ظهور",
    lastSeenText: "نص آخر ظهور",
    messages: "الرسائل",
    addMessage: "إضافة رسالة",
    addFromMe: "+ مني",
    addFromThem: "+ من الطرف الآخر",
    empty: "لا توجد رسائل بعد. أضف أول رسالة.",
    text: "النص",
    sender: "المُرسِل",
    type: "النوع",
    typeText: "نص",
    typeVoice: "صوت",
    typeImage: "صورة",
    time: "الوقت الظاهر",
    delay: "التأخير قبل الظهور (ث)",
    typingDur: "مدة الكتابة (ث)",
    status: "الحالة",
    sent: "أُرسلت",
    delivered: "سُلّمت",
    read: "قُرئت",
    voiceLen: "مدة الصوت",
    duplicate: "تكرار",
    delete: "حذف",
    moveUp: "أعلى",
    moveDown: "أسفل",
    play: "تشغيل",
    pause: "إيقاف مؤقت",
    resume: "متابعة",
    restart: "إعادة",
    reset: "تصفير",
    record: "وضع التسجيل",
    exitRecord: "خروج",
    recordHint: "شاشة نظيفة جاهزة لتسجيل الشاشة",
    save: "حفظ محلي",
    load: "تحميل المحفوظ",
    clear: "مسح البيانات",
    exportJson: "تصدير JSON",
    importJson: "استيراد JSON",
    newScenario: "مثال جديد",
    saved: "تم الحفظ ✓",
    loaded: "تم التحميل ✓",
    noSave: "لا يوجد محفوظ",
    cleared: "تم المسح",
    timeline: "الخط الزمني",
    seconds: "ث",
    data: "البيانات",
    messagePlaceholder: "اكتب نص الرسالة…",
    hideControls: "إخفاء الأزرار",
    showControls: "إظهار الأزرار",
    exportVideo: "تصدير فيديو",
    exportStart: "ابدأ التصدير",
    exportRendering: "جارٍ توليد الفيديو…",
    exportDone: "تم إنشاء الفيديو وبدأ التنزيل ✓",
    exportAgain: "تصدير مرة أخرى",
    exportCancel: "إلغاء",
    exportError: "حدث خطأ:",
    exportUnsupported: "متصفحك لا يدعم توليد الفيديو. استخدم Chrome أو Edge، أو استخدم وضع التسجيل وسجّل شاشتك.",
    exportHint: "يتم توليد الفيديو بالكامل داخل متصفحك بدون رفع أي بيانات.",
    exportBackground: "الخلفية",
    exportFps: "الإطارات/الثانية",
  },
  en: {
    appTitle: "Chat Scenario Studio",
    appSubtitle: "Build a realistic chat, play it, and record your screen",
    platform: "Platform",
    device: "Device",
    iphone: "iPhone",
    android: "Samsung",
    font: "Samsung font",
    statusBarTitle: "Status bar",
    sbWifi: "Wi‑Fi",
    sbCellular: "Cellular",
    sbBatteryPct: "Battery %",
    chatTheme: "Chat theme",
    light: "Light",
    dark: "Dark",
    people: "People",
    me: "Me (phone owner)",
    them: "The other person",
    name: "Name",
    photo: "Photo",
    upload: "Upload",
    remove: "Remove",
    swapRoles: "Swap roles",
    presence: "Their status",
    online: "Online",
    typing: "Typing…",
    lastSeen: "Last seen",
    lastSeenText: "Last seen text",
    messages: "Messages",
    addMessage: "Add message",
    addFromMe: "+ From me",
    addFromThem: "+ From them",
    empty: "No messages yet. Add the first one.",
    text: "Text",
    sender: "Sender",
    type: "Type",
    typeText: "Text",
    typeVoice: "Voice",
    typeImage: "Image",
    time: "Shown time",
    delay: "Delay before show (s)",
    typingDur: "Typing duration (s)",
    status: "Status",
    sent: "Sent",
    delivered: "Delivered",
    read: "Read",
    voiceLen: "Voice length",
    duplicate: "Duplicate",
    delete: "Delete",
    moveUp: "Up",
    moveDown: "Down",
    play: "Play",
    pause: "Pause",
    resume: "Resume",
    restart: "Restart",
    reset: "Reset",
    record: "Recording mode",
    exitRecord: "Exit",
    recordHint: "Clean stage ready for screen recording",
    save: "Save",
    load: "Load",
    clear: "Clear data",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    newScenario: "New example",
    saved: "Saved ✓",
    loaded: "Loaded ✓",
    noSave: "Nothing saved",
    cleared: "Cleared",
    timeline: "Timeline",
    seconds: "s",
    data: "Data",
    messagePlaceholder: "Type message text…",
    hideControls: "Hide controls",
    showControls: "Show controls",
    exportVideo: "Export video",
    exportStart: "Start export",
    exportRendering: "Generating video…",
    exportDone: "Video created — download started ✓",
    exportAgain: "Export again",
    exportCancel: "Cancel",
    exportError: "Error:",
    exportUnsupported: "Your browser can't generate video. Use Chrome or Edge, or use Recording Mode and capture your screen.",
    exportHint: "The video is generated entirely in your browser — nothing is uploaded.",
    exportBackground: "Background",
    exportFps: "Frames/sec",
  },
};
