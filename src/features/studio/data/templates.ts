import type {
  CallEntry,
  ChatTheme,
  DeliveryStatus,
  FileShare,
  GroupChat,
  LocationShare,
  Message,
  MessageType,
  Platform,
  PresenceStatus,
  Scenario,
} from "../types";
import { applyNaturalTiming } from "../services/smart-timing";
import { draftLinkPreview, firstUrl } from "../services/link-preview";
import { SCENARIO_VERSION, createId } from "./defaults";
import { mediaSrc } from "./media-library";

/**
 * Ready-made marketing conversations for the template gallery. Each one ships
 * in natural Gulf Arabic and in English, with a suggested platform, a
 * realistic clock and reactions / quoted replies where people would use them.
 * Timing (delays + typing) is generated from message length on use.
 */

export type TemplateLang = "ar" | "en";

export type TemplateId =
  | "ecommerce"
  | "restaurant"
  | "realEstate"
  | "clinic"
  | "support"
  | "abandonedCart"
  | "course"
  | "carRental"
  | "testimonial"
  | "flashSale"
  | "familyGroup"
  | "teamOrder"
  | "supportCall"
  | "deliveryLive";

type Who = "m" | "t";
type LineOpts = {
  /** reaction emoji on this message (from the other side) */
  r?: string;
  /** index of an earlier line this one quotes */
  q?: number;
  /** voice note duration — makes the line a voice message */
  v?: string;
  /** final delivery status for my messages (default read) */
  st?: DeliveryStatus;
  /** group chats: index of the member who wrote a "them" line */
  a?: number;
  /** shows the app's "Edited" label */
  ed?: true;
  /** link preview for the first URL of the text (image = media library id) */
  ln?: { title: string; d?: string; img?: string; site?: string };
  /** media library id — makes the line an image (text = caption) */
  img?: string;
  /** sticker: 1–3 emoji, or a media library id prefixed with "lib:" */
  stk?: string;
  loc?: LocationShare;
  f?: FileShare;
  c?: CallEntry;
  /** "This message was deleted" */
  del?: true;
};
type Line = [Who, string, string, LineOpts?];

interface TemplateContent {
  me: string;
  them: string;
  /** media library ids for the participants' photos */
  meAvatar?: string;
  themAvatar?: string;
  /** group chat: name, photo (library id) and members as [name, avatar id] */
  group?: { name: string; avatar?: string; members: [string, string?][] };
  lines: Line[];
}

export interface ScenarioTemplate {
  id: TemplateId;
  platform: Platform;
  theme: ChatTheme;
  presence: PresenceStatus;
  content: Record<TemplateLang, TemplateContent>;
}

export const TEMPLATES: ScenarioTemplate[] = [
  {
    id: "ecommerce",
    platform: "whatsapp",
    theme: "light",
    presence: "online",
    content: {
      ar: {
        me: "متجر لمسة",
        them: "نورة",
        lines: [
          ["t", "مساء الخير، طلبت أمس فستان من موقعكم ورقم الطلب 48213، متى يوصل؟", "4:12"],
          ["m", "مساء النور نورة 🌷 لحظات أتأكد لك من الطلب", "4:12"],
          ["m", "طلبك طلع مع المندوب اليوم الصبح 🚚 وبيوصلك قبل الساعة ٦ المسا", "4:13"],
          ["t", "واو بهالسرعة! 😍", "4:13", { r: "❤️" }],
          ["t", "طيب لو المقاس ما ضبط أقدر أبدله؟", "4:14"],
          ["m", "أكيد، الاستبدال مجاني خلال ١٤ يوم وتطلبينه من رابط التتبع بضغطة وحدة", "4:14", { q: 4 }],
          ["t", "", "5:51", { v: "0:07" }],
          ["t", "وصل الفستان وجنننن 😭❤️ شكراً على السرعة", "5:52", { r: "🙏" }],
          ["m", "يسعدنا ذوقك يا نورة 🤍 استخدمي كود NOURA10 على طلبك الجاي وخصم ١٠٪ لك", "5:53", { r: "❤️" }],
        ],
      },
      en: {
        me: "Bloom & Co.",
        them: "Sarah",
        lines: [
          ["t", "Hi! I ordered a dress yesterday, order #48213. Any idea when it arrives?", "4:12"],
          ["m", "Hi Sarah 🌷 one sec, let me check that for you", "4:12"],
          ["m", "Good news, it left with the courier this morning 🚚 You'll have it before 6 pm today", "4:13"],
          ["t", "Wow, that fast! 😍", "4:13", { r: "❤️" }],
          ["t", "And if the size isn't right, can I swap it?", "4:14"],
          ["m", "Of course. Exchanges are free for 14 days, one tap from your tracking link", "4:14", { q: 4 }],
          ["t", "", "5:51", { v: "0:07" }],
          ["t", "It's here and it's PERFECT 😭❤️ thank you!", "5:52", { r: "🙏" }],
          ["m", "So happy you love it 🤍 Here's 10% off your next order: SARAH10", "5:53", { r: "❤️" }],
        ],
      },
    },
  },
  {
    id: "restaurant",
    platform: "instagram",
    theme: "light",
    presence: "online",
    content: {
      ar: {
        me: "مطعم سُفرة",
        them: "ريم",
        lines: [
          ["t", "هلا، عندكم مكان لـ ٦ أشخاص الخميس الساعة ٩ بالليل؟", "8:03"],
          ["m", "هلا والله ريم 🌿 عندنا طاولة في التراس الخارجي أو قسم العوائل، وش تفضلين؟", "8:04"],
          ["t", "التراس أكيد 😍 الجو صاير حلو", "8:04"],
          ["m", "تم الحجز ✅\nالخميس ٩:٠٠ م · ٦ أشخاص · التراس", "8:05", { r: "❤️" }],
          ["t", "عندنا عيد ميلاد، ينفع نجيب كيكة من برا؟", "8:06"],
          ["m", "أكيد! ونجهز لكم الشموع والأغنية من عندنا مجاناً 🎂", "8:06", { q: 4, r: "😍" }],
          ["t", "يا حلوكم 🥹", "8:07"],
          ["m", "ننتظركم الخميس، وإذا تغير العدد بلغينا هنا 🙏", "8:07"],
          ["t", "أكيد، يعطيكم العافية 🌷", "8:08", { r: "❤️" }],
        ],
      },
      en: {
        me: "Olive & Ember",
        them: "Maya",
        lines: [
          ["t", "Hey! Do you have a table for 6 this Thursday at 9 pm?", "8:03"],
          ["m", "Hi Maya 🌿 We have a spot on the terrace or in the main hall. Which do you prefer?", "8:04"],
          ["t", "Terrace for sure 😍 the weather is perfect now", "8:04"],
          ["m", "You're booked ✅\nThursday 9:00 pm · 6 guests · Terrace", "8:05", { r: "❤️" }],
          ["t", "It's a birthday, can we bring our own cake?", "8:06"],
          ["m", "Absolutely! We'll add candles and a little song on the house 🎂", "8:06", { q: 4, r: "😍" }],
          ["t", "You guys are the best 🥹", "8:07"],
          ["m", "See you Thursday! If the headcount changes, just message us here 🙏", "8:07"],
          ["t", "Will do, thank you! 🌷", "8:08", { r: "❤️" }],
        ],
      },
    },
  },
  {
    id: "realEstate",
    platform: "whatsapp",
    theme: "light",
    presence: "online",
    content: {
      ar: {
        me: "عقارات الرواد",
        them: "أبو فيصل",
        lines: [
          ["t", "السلام عليكم، شفت إعلان الشقة في حي الياسمين، للحين متوفرة؟", "4:20"],
          ["m", "وعليكم السلام أبو فيصل، إيه متوفرة ✅\n٣ غرف وصالة · ١٨٠ م² · الدور الثاني مع مصعد", "4:21"],
          ["t", "كم الإيجار السنوي؟", "4:21"],
          ["m", "٦٥ ألف سنوي، وتقدر تدفعها على دفعتين", "4:22"],
          ["t", "فيه موقف خاص؟", "4:22"],
          ["m", "فيه موقفين خاصة مظللة، وغرفة سائق مستقلة 🚗", "4:23", { q: 4 }],
          ["t", "", "4:24", { v: "0:12" }],
          ["m", "أبشر، المعاينة متاحة بكرة العصر من ٤ إلى ٧، وش يناسبك؟", "4:25", { q: 6 }],
          ["t", "الساعة ٥ ممتاز", "4:25"],
          ["m", "تم ✅ أرسلت لك اللوكيشن، وسعد من فريقنا بيكون بانتظارك 📍", "4:26", { r: "👍" }],
        ],
      },
      en: {
        me: "Skyline Realty",
        them: "Daniel",
        lines: [
          ["t", "Hi, is the apartment on Marina Walk still available?", "4:20"],
          ["m", "Hi Daniel, yes it is ✅\n3 bedrooms · 1,940 sq ft · 2nd floor with elevator", "4:21"],
          ["t", "What's the yearly rent?", "4:21"],
          ["m", "$28,800 a year, and you can pay in two installments", "4:22"],
          ["t", "Is there private parking?", "4:22"],
          ["m", "Two covered private spots, plus a separate storage room 🚗", "4:23", { q: 4 }],
          ["t", "", "4:24", { v: "0:12" }],
          ["m", "Sure! Viewings are open tomorrow from 4 to 7 pm. What time suits you?", "4:25", { q: 6 }],
          ["t", "5 pm works great", "4:25"],
          ["m", "Done ✅ I've sent you the location. Sam from our team will meet you there 📍", "4:26", { r: "👍" }],
        ],
      },
    },
  },
  {
    id: "clinic",
    platform: "imessage",
    theme: "light",
    presence: "online",
    content: {
      ar: {
        me: "عيادات ابتسامة",
        them: "سارة",
        lines: [
          ["t", "مرحبا، أبغى أحجز موعد تنظيف أسنان هالأسبوع", "11:02"],
          ["m", "أهلاً سارة 😊 عندنا مواعيد الأربعاء ١١:٣٠ ص أو الخميس ٤:١٥ م", "11:03"],
          ["t", "الخميس ٤:١٥ يناسبني", "11:03"],
          ["m", "تم تأكيد موعدك ✅\nالخميس ٤:١٥ م مع د. هند العتيبي\nالعيادة ٣ – الدور الأول", "11:04", { r: "❤️" }],
          ["t", "كم التكلفة تقريباً؟", "11:05"],
          ["m", "التنظيف والتلميع ٢٥٠ ريال، وهالشهر عليه خصم ٢٠٪ 🎉", "11:05"],
          ["t", "ممتاز، تقبلون التأمين؟", "11:06"],
          ["m", "نعم، نقبل بوبا والتعاونية وميدغلف، بس أحضري بطاقة التأمين", "11:06", { q: 6 }],
          ["t", "تمام شكراً لكم 🙏", "11:07", { r: "👍" }],
          ["m", "العفو! بنرسل لك تذكير قبل الموعد بيوم 🦷", "11:07", { st: "delivered" }],
        ],
      },
      en: {
        me: "BrightSmile Dental",
        them: "Emma",
        lines: [
          ["t", "Hi, I'd like to book a teeth cleaning this week", "11:02"],
          ["m", "Hi Emma 😊 We have Wednesday 11:30 am or Thursday 4:15 pm", "11:03"],
          ["t", "Thursday 4:15 works for me", "11:03"],
          ["m", "You're confirmed ✅\nThursday 4:15 pm with Dr. Laura Kim\nRoom 3, first floor", "11:04", { r: "❤️" }],
          ["t", "Roughly how much will it be?", "11:05"],
          ["m", "Cleaning and polish is $120, and it's 20% off this month 🎉", "11:05"],
          ["t", "Great, do you take insurance?", "11:06"],
          ["m", "Yes, we accept most major plans. Just bring your insurance card", "11:06", { q: 6 }],
          ["t", "Perfect, thank you 🙏", "11:07", { r: "👍" }],
          ["m", "You're welcome! We'll text you a reminder the day before 🦷", "11:07", { st: "delivered" }],
        ],
      },
    },
  },
  {
    id: "support",
    platform: "messenger",
    theme: "light",
    presence: "online",
    content: {
      ar: {
        me: "دعم نت لاين",
        them: "عبدالله",
        lines: [
          ["t", "النت عندي فاصل من الصبح! 😤 وعندي اجتماع بعد ساعة", "9:31"],
          ["m", "نعتذر منك يا عبدالله 🙏 ممكن رقم الجوال المسجل بالحساب؟", "9:31"],
          ["t", "0551234567", "9:32"],
          ["m", "شكراً لك. فيه عطل بالكيبل الرئيسي في حيّك، والفريق الفني موجود بالموقع الحين 🛠️", "9:33"],
          ["m", "المتوقع يرجع الخط خلال ٢٠ دقيقة", "9:33"],
          ["t", "طيب والاجتماع؟ 😕", "9:34"],
          ["m", "فعّلنا لك ٢٠ جيجا بيانات جوال مجانية تستخدمها الحين لين يرجع الخط 📶", "9:34", { q: 5, r: "❤️" }],
          ["t", "والله ممتاز، وصلت", "9:35"],
          ["t", "رجع النت ✅ ما شاء الله سريعين", "9:52", { r: "👍" }],
          ["m", "يسعدنا! وأضفنا لك خصم ٥٠٪ على فاتورة الشهر الجاي تعويضاً عن الانقطاع 💙", "9:53", { r: "😮" }],
        ],
      },
      en: {
        me: "Nimbus Fiber Support",
        them: "James",
        lines: [
          ["t", "My internet has been down all morning 😤 and I have a meeting in an hour", "9:31"],
          ["m", "So sorry about that, James 🙏 Could you share the phone number on your account?", "9:31"],
          ["t", "555 0142 873", "9:32"],
          ["m", "Thanks. There's a fault on the main cable in your area and our technicians are on site now 🛠️", "9:33"],
          ["m", "We expect you back online within 20 minutes", "9:33"],
          ["t", "And my meeting? 😕", "9:34"],
          ["m", "We've added 20 GB of free mobile data to your line so you can join right now 📶", "9:34", { q: 5, r: "❤️" }],
          ["t", "That's great, got it", "9:35"],
          ["t", "Internet's back ✅ that was quick", "9:52", { r: "👍" }],
          ["m", "Glad to hear it! We've also taken 50% off next month's bill for the trouble 💙", "9:53", { r: "😮" }],
        ],
      },
    },
  },
  {
    id: "abandonedCart",
    platform: "whatsapp",
    theme: "light",
    presence: "online",
    content: {
      ar: {
        me: "متجر أناقة",
        them: "لمى",
        lines: [
          ["m", "مرحبا لمى 👋 لاحظنا إنك تركتي ساعة «ميرا» الذهبية في السلة 👀", "7:40"],
          ["m", "حجزناها لك ٢٤ ساعة، وهذا كود خصم ١٥٪ خاص فيك: LAMA15 🎁", "7:40"],
          ["t", "ههههه كنت مترددة بسعرها صراحة", "7:52"],
          ["m", "نفهمك 😊 بعد الخصم تصير ٤٢٥ ريال بدل ٥٠٠، والتوصيل مجاني", "7:53", { q: 2 }],
          ["t", "وفيه تقسيط؟", "7:53"],
          ["m", "أكيد، تقدرين تقسمينها على ٤ دفعات بدون فوايد 💳", "7:54"],
          ["t", "خلاص اقتنعت 😂 طلبتها الحين", "7:56", { r: "😂" }],
          ["m", "اختيار موفّق 💛 طلبك رقم 77104 وبيوصلك خلال يومين", "7:56", { r: "❤️" }],
        ],
      },
      en: {
        me: "Northwind Store",
        them: "Olivia",
        lines: [
          ["m", "Hi Olivia 👋 We noticed the gold Mira watch is still waiting in your cart 👀", "7:40"],
          ["m", "We've held it for 24 hours, plus here's 15% off just for you: OLIVIA15 🎁", "7:40"],
          ["t", "Haha honestly I was on the fence about the price", "7:52"],
          ["m", "Totally get it 😊 With the code it's $170 instead of $200, and shipping is free", "7:53", { q: 2 }],
          ["t", "Can I pay in installments?", "7:53"],
          ["m", "Of course, split it into 4 interest-free payments at checkout 💳", "7:54"],
          ["t", "Ok you convinced me 😂 just ordered it", "7:56", { r: "😂" }],
          ["m", "Great choice 💛 Order #77104 is on its way, arriving in 2 days", "7:56", { r: "❤️" }],
        ],
      },
    },
  },
  {
    id: "course",
    platform: "telegram",
    theme: "light",
    presence: "online",
    content: {
      ar: {
        me: "أكاديمية مهارة",
        them: "محمد",
        lines: [
          ["t", "السلام عليكم، دورة تحليل البيانات تناسب المبتدئين؟", "6:10"],
          ["m", "وعليكم السلام محمد 👋 إيه مصممة للمبتدئين، تبدأ من Excel وتوصل لـ Python وPower BI", "6:11"],
          ["t", "كم مدتها؟ أنا موظف ودوامي لين ٤", "6:11"],
          ["m", "٨ أسابيع، والمحاضرات مسائية الساعة ٨ وكل محاضرة مسجلة 🎥", "6:12", { q: 2 }],
          ["t", "حلو، وفيه شهادة؟", "6:12"],
          ["m", "شهادة معتمدة + مشروع تخرج تضيفه لملفك المهني 📜", "6:13", { r: "👍" }],
          ["t", "كم السعر؟", "6:13"],
          ["m", "١٬٢٠٠ ريال، وللمسجلين هالأسبوع ٩٠٠ فقط 🔥 باقي ٧ مقاعد", "6:14"],
          ["t", "سجلني 🙌", "6:14", { r: "🎉" }],
          ["m", "تم تسجيلك ✅ أرسلنا لك رابط الدفع ومجموعة الطلاب على الإيميل", "6:15", { r: "❤️" }],
        ],
      },
      en: {
        me: "SkillUp Academy",
        them: "Ryan",
        lines: [
          ["t", "Hi, is the Data Analytics course OK for beginners?", "6:10"],
          ["m", "Hi Ryan 👋 Yes, it's built for beginners. You go from Excel to Python and Power BI", "6:11"],
          ["t", "How long is it? I work until 4", "6:11"],
          ["m", "8 weeks, live classes at 8 pm, and every session is recorded 🎥", "6:12", { q: 2 }],
          ["t", "Nice, do I get a certificate?", "6:12"],
          ["m", "An accredited certificate plus a capstone project for your portfolio 📜", "6:13", { r: "👍" }],
          ["t", "What's the price?", "6:13"],
          ["m", "$320, or $240 if you enroll this week 🔥 Only 7 seats left", "6:14"],
          ["t", "Sign me up 🙌", "6:14", { r: "🎉" }],
          ["m", "You're in ✅ We've emailed your payment link and the student group invite", "6:15", { r: "❤️" }],
        ],
      },
    },
  },
  {
    id: "carRental",
    platform: "snapchat",
    theme: "light",
    presence: "online",
    content: {
      ar: {
        me: "درايف لتأجير السيارات",
        them: "تركي",
        lines: [
          ["t", "هلا، أبي سيارة SUV من الجمعة للأحد", "1:15"],
          ["m", "هلا تركي 🚙 عندنا تاهو ٢٠٢٥ أو لاندكروزر ٢٠٢٤، وش تفضل؟", "1:16"],
          ["t", "التاهو، كم السعر؟", "1:16"],
          ["m", "٣٥٠ ريال لليوم، والثلاث أيام بـ ٩٠٠ شامل التأمين الشامل", "1:17"],
          ["t", "فيه توصيل للمطار؟", "1:17"],
          ["m", "إيه، نسلمك السيارة في المطار مجاناً ✈️ بس أرسل رقم الرحلة", "1:18", { q: 4 }],
          ["t", "SV1024 توصل ٣:٤٠ العصر", "1:19"],
          ["m", "تم الحجز ✅ المندوب بيكون عند البوابة ٢ ومعه لوحة باسمك", "1:20", { r: "🔥" }],
          ["t", "خدمة VIP 😎", "1:20", { r: "😂" }],
        ],
      },
      en: {
        me: "DriveNow Rentals",
        them: "Alex",
        lines: [
          ["t", "Hey, I need an SUV from Friday to Sunday", "1:15"],
          ["m", "Hey Alex 🚙 We have a 2025 Tahoe or a 2024 Land Cruiser. Which one?", "1:16"],
          ["t", "The Tahoe, how much?", "1:16"],
          ["m", "$95 a day, or $250 for all three days with full insurance", "1:17"],
          ["t", "Can you deliver to the airport?", "1:17"],
          ["m", "Yep, airport handover is free ✈️ just send your flight number", "1:18", { q: 4 }],
          ["t", "UA1024, landing 3:40 pm", "1:19"],
          ["m", "Booked ✅ Our driver will be at gate 2 with a sign with your name", "1:20", { r: "🔥" }],
          ["t", "VIP service 😎", "1:20", { r: "😂" }],
        ],
      },
    },
  },
  {
    id: "testimonial",
    platform: "x",
    theme: "light",
    presence: "online",
    content: {
      ar: {
        me: "عطور ليال",
        them: "هيا",
        lines: [
          ["t", "حبيت أشكركم! عطر «ليالي العود» صار أكثر شي ينسأل عنه 😍", "10:05", { r: "❤️" }],
          ["t", "حتى زوجي صار يتطيّب منه 😂", "10:05", { r: "😂" }],
          ["m", "هيا، كلامك أسعد يومنا كله 🤍 شكراً لك", "10:07"],
          ["m", "تسمحين ننشر تجربتك في حسابنا؟", "10:07"],
          ["t", "أكيد! وبعد بكتب تقييم بالموقع", "10:08", { q: 3 }],
          ["t", "⭐⭐⭐⭐⭐", "10:09"],
          ["m", "تستاهلين هدية 🎁 بنرسل لك عينة من مجموعتنا الجديدة مع طلبك الجاي", "10:10", { r: "😍" }],
          ["t", "يا ربيه 🥹 أحسن متجر تعاملت معه", "10:10", { r: "❤️" }],
        ],
      },
      en: {
        me: "Aurora Perfumes",
        them: "Chloe",
        lines: [
          ["t", "Just wanted to say thank you! Everyone keeps asking what perfume I'm wearing 😍", "10:05", { r: "❤️" }],
          ["t", "Even my husband started borrowing it 😂", "10:05", { r: "😂" }],
          ["m", "Chloe, this made our whole day 🤍 thank you", "10:07"],
          ["m", "Would you mind if we shared your words on our page?", "10:07"],
          ["t", "Of course! I'll leave a review on the site too", "10:08", { q: 3 }],
          ["t", "⭐⭐⭐⭐⭐", "10:09"],
          ["m", "You deserve a treat 🎁 We'll add a sample from our new collection to your next order", "10:10", { r: "😍" }],
          ["t", "Stop 🥹 best shop ever", "10:10", { r: "❤️" }],
        ],
      },
    },
  },
  {
    id: "flashSale",
    platform: "tiktok",
    theme: "dark",
    presence: "online",
    content: {
      ar: {
        me: "كيكس لاب",
        them: "يوسف",
        lines: [
          ["t", "شفت الفيديو حقكم! الخصم ٥٠٪ للحين شغال؟ 🔥", "9:47"],
          ["m", "إيه شغال! بس باقي عليه ٣ ساعات ⏳", "9:47"],
          ["t", "أبي Air Max مقاس ٤٣", "9:48"],
          ["m", "متوفر بالأبيض والأسود 👟 السعر بعد الخصم ٣٤٩ بدل ٦٩٨", "9:48"],
          ["t", "الأسود 🖤", "9:49"],
          ["m", "اختيار نار 🔥 هذا رابط الطلب السريع: kickslab.sa/am43", "9:49", { q: 4 }],
          ["t", "طلبت ✅", "9:51", { r: "🔥" }],
          ["m", "وصلنا طلبك 🙌 والشحن مجاني لأنك من متابعينا", "9:51", { r: "❤️" }],
          ["t", "أسطورة 😂❤️", "9:52", { r: "😂" }],
        ],
      },
      en: {
        me: "Kicks Lab",
        them: "Jordan",
        lines: [
          ["t", "Saw your video! Is the 50% off still on? 🔥", "9:47"],
          ["m", "It is! Only 3 hours left though ⏳", "9:47"],
          ["t", "I want the Air Max in size 10", "9:48"],
          ["m", "We have it in white and black 👟 $89 instead of $178", "9:48"],
          ["t", "Black 🖤", "9:49"],
          ["m", "Fire choice 🔥 Here's your quick checkout link: kickslab.co/am10", "9:49", { q: 4 }],
          ["t", "Ordered ✅", "9:51", { r: "🔥" }],
          ["m", "Got it 🙌 Shipping's free because you follow us", "9:51", { r: "❤️" }],
          ["t", "Legend 😂❤️", "9:52", { r: "😂" }],
        ],
      },
    },
  },
];

/** Messages of a template (fresh ids, natural timing). */
export function templateMessages(tpl: ScenarioTemplate, lang: TemplateLang): Message[] {
  const lines = tpl.content[lang].lines;
  const ids = lines.map(() => createId());
  const group = !!tpl.content[lang].group;
  const messages: Message[] = lines.map(([who, text, time, o = {}], i) => {
    const type: MessageType = o.del
      ? "deleted"
      : o.c
        ? "call"
        : o.f
          ? "file"
          : o.loc
            ? "location"
            : o.stk
              ? "sticker"
              : o.img
                ? "image"
                : o.v
                  ? "voice"
                  : "text";
    const sticker = o.stk?.startsWith("lib:") ? mediaSrc(o.stk.slice(4)) : null;
    const url = o.ln ? firstUrl(text) : null;
    return {
      id: ids[i],
      sender: who === "m" ? "me" : "them",
      type,
      text: type === "sticker" ? (sticker ? "" : (o.stk ?? "")) : text,
      time,
      delayMs: 800,
      typingMs: 0,
      status: o.st ?? "read",
      ...(o.v ? { voiceDuration: o.v } : {}),
      ...(o.r ? { reaction: o.r } : {}),
      ...(o.q !== undefined && o.q < i ? { replyToId: ids[o.q] } : {}),
      ...(group && who === "t" ? { authorIndex: o.a ?? 0 } : {}),
      ...(o.ed ? { edited: true } : {}),
      ...(o.img ? { imageSrc: mediaSrc(o.img) } : {}),
      ...(sticker ? { imageSrc: sticker } : {}),
      ...(o.loc ? { location: o.loc } : {}),
      ...(o.f ? { file: o.f } : {}),
      ...(o.c ? { call: o.c } : {}),
      ...(o.ln && url
        ? {
            link: {
              ...draftLinkPreview(url),
              title: o.ln.title,
              description: o.ln.d ?? "",
              ...(o.ln.site ? { siteName: o.ln.site } : {}),
              image: o.ln.img ? mediaSrc(o.ln.img) : null,
            },
          }
        : {}),
    };
  });
  return applyNaturalTiming(messages);
}

/** Group chat of a template (null for a 1:1 conversation). */
export function templateGroup(tpl: ScenarioTemplate, lang: TemplateLang): GroupChat | null {
  const g = tpl.content[lang].group;
  if (!g) return null;
  return {
    name: g.name,
    avatar: g.avatar ? mediaSrc(g.avatar) : null,
    members: g.members.map(([name, avatar]) => ({ name, avatar: avatar ? mediaSrc(avatar) : null })),
  };
}

/**
 * Build a scenario from a template, keeping the user's device, fonts, status
 * bar and device colour (only the conversation, platform and theme change).
 */
export function buildFromTemplate(tpl: ScenarioTemplate, lang: TemplateLang, base: Scenario): Scenario {
  const c = tpl.content[lang];
  const group = templateGroup(tpl, lang);
  return {
    ...base,
    version: SCENARIO_VERSION,
    platform: tpl.platform,
    theme: tpl.theme,
    presence: tpl.presence,
    me: { name: c.me, avatar: c.meAvatar ? mediaSrc(c.meAvatar) : null },
    // in a group the first member doubles as the 1:1 contact (used if the group is turned off)
    them: group ? group.members[0] : { name: c.them, avatar: c.themAvatar ? mediaSrc(c.themAvatar) : null },
    group,
    messages: templateMessages(tpl, lang),
  };
}
