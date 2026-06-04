import type { Message, Scenario } from "../types";

export const SCENARIO_VERSION = 1;

export function createId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** A ready-to-use marketing scenario (Arabic) shown on first load. */
function defaultMessages(): Message[] {
  return [
    {
      id: createId(),
      sender: "them",
      type: "text",
      text: "السلام عليكم، شفت إعلانكم عن عرض نهاية الأسبوع 🌟",
      time: "10:41",
      delayMs: 600,
      typingMs: 1400,
      status: "read",
    },
    {
      id: createId(),
      sender: "me",
      type: "text",
      text: "وعليكم السلام! أهلاً فيك 👋 نعم العرض شغّال لين يوم الجمعة",
      time: "10:41",
      delayMs: 700,
      typingMs: 0,
      status: "read",
    },
    {
      id: createId(),
      sender: "them",
      type: "text",
      text: "كم يطلع السعر بعد الخصم؟",
      time: "10:42",
      delayMs: 800,
      typingMs: 1100,
      status: "read",
    },
    {
      id: createId(),
      sender: "me",
      type: "text",
      text: "بدل ٢٩٩ ريال صار ١٩٩ ريال فقط، ويشمل التوصيل المجاني 🚚",
      time: "10:42",
      delayMs: 900,
      typingMs: 0,
      status: "read",
    },
    {
      id: createId(),
      sender: "them",
      type: "text",
      text: "حلو… بس أنا متردد صراحة 🤔",
      time: "10:43",
      delayMs: 1100,
      typingMs: 1300,
      status: "read",
    },
    {
      id: createId(),
      sender: "me",
      type: "text",
      text: "لا تتردد، فيه ضمان استرجاع ١٤ يوم. تجربتك مضمونة 100%",
      time: "10:43",
      delayMs: 900,
      typingMs: 0,
      status: "read",
    },
    {
      id: createId(),
      sender: "them",
      type: "voice",
      text: "",
      time: "10:44",
      delayMs: 1000,
      typingMs: 900,
      status: "read",
      voiceDuration: "0:09",
    },
    {
      id: createId(),
      sender: "me",
      type: "text",
      text: "تمام! بسجّل طلبك الحين وبيوصلك خلال يومين ✅",
      time: "10:44",
      delayMs: 900,
      typingMs: 0,
      status: "read",
    },
    {
      id: createId(),
      sender: "them",
      type: "text",
      text: "زين، اطلبه لي 🙏 شكراً على الذوق",
      time: "10:45",
      delayMs: 1000,
      typingMs: 1000,
      status: "read",
    },
  ];
}

export function createDefaultScenario(): Scenario {
  return {
    version: SCENARIO_VERSION,
    platform: "whatsapp",
    device: "iphone",
    theme: "light",
    me: { name: "متجر نون", avatar: null },
    them: { name: "خالد", avatar: null },
    presence: "online",
    lastSeenText: "آخر ظهور اليوم 10:30 ص",
    androidFont: "roboto",
    messages: defaultMessages(),
  };
}

export function createBlankMessage(sender: "me" | "them" = "me"): Message {
  return {
    id: createId(),
    sender,
    type: "text",
    text: "",
    time: nowClock(),
    delayMs: 800,
    typingMs: sender === "them" ? 1000 : 0,
    status: "read",
  };
}

export function nowClock(): string {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${m}`;
}
