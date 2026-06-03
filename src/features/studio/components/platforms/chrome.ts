export type Lang = "ar" | "en";

/**
 * In-mockup chrome strings. These localize the parts of each app that the real
 * apps localize too (header presence, date dividers, input placeholder, receipt
 * labels) so switching the site language makes the mockup feel like a genuine
 * Arabic or English install of the app.
 */
export interface ChromeStrings {
  today: string;
  online: string;
  typing: string;
  message: string; // input placeholder
  voiceMessage: string;
  // receipts
  sent: string;
  delivered: string;
  read: string;
  // instagram
  activeNow: string;
  seen: string;
  // snapchat
  snapDelivered: string;
  snapOpened: string;
  snapReceived: string;
  // telegram
  lastSeenRecently: string;
  // generic helpers
  search: string;
}

export const CHROME: Record<Lang, ChromeStrings> = {
  ar: {
    today: "اليوم",
    online: "متصل الآن",
    typing: "يكتب…",
    message: "رسالة",
    voiceMessage: "رسالة صوتية",
    sent: "تم الإرسال",
    delivered: "تم التسليم",
    read: "تمت القراءة",
    activeNow: "نشط الآن",
    seen: "شوهدت",
    snapDelivered: "تم التسليم",
    snapOpened: "تم الفتح",
    snapReceived: "تم الاستلام",
    lastSeenRecently: "آخر ظهور مؤخراً",
    search: "بحث",
  },
  en: {
    today: "Today",
    online: "online",
    typing: "typing…",
    message: "Message",
    voiceMessage: "Voice message",
    sent: "Sent",
    delivered: "Delivered",
    read: "Read",
    activeNow: "Active now",
    seen: "Seen",
    snapDelivered: "Delivered",
    snapOpened: "Opened",
    snapReceived: "Received",
    lastSeenRecently: "last seen recently",
    search: "Search",
  },
};
