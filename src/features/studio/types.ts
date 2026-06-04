export type Platform =
  | "whatsapp"
  | "telegram"
  | "instagram"
  | "snapchat"
  | "imessage";

export type Device = "iphone" | "android";

export type Sender = "me" | "them";

export type MessageType = "text" | "voice" | "image";

export type DeliveryStatus = "sent" | "delivered" | "read";

export type ChatTheme = "light" | "dark";

export type PresenceStatus = "online" | "typing" | "lastseen";

export interface Person {
  name: string;
  /** data URL of uploaded avatar, or null for the default placeholder */
  avatar: string | null;
}

export interface Message {
  id: string;
  sender: Sender;
  type: MessageType;
  /** message body (text). For voice it is ignored, for image it is an optional caption */
  text: string;
  /** displayed clock label next to the bubble, e.g. "10:42" */
  time: string;
  /** delay in ms before this step starts during playback */
  delayMs: number;
  /** typing-indicator duration in ms shown before the message is revealed (only for "them") */
  typingMs: number;
  /** final delivery status the message should settle on (only meaningful for "me") */
  status: DeliveryStatus;
  /** voice message length label, e.g. "0:14" */
  voiceDuration?: string;
  /** data URL of an attached image */
  imageSrc?: string | null;
}

export interface Scenario {
  version: number;
  platform: Platform;
  device: Device;
  theme: ChatTheme;
  me: Person;
  them: Person;
  /** presence shown for the other party in the header */
  presence: PresenceStatus;
  /** custom "last seen" text used when presence === "lastseen" */
  lastSeenText: string;
  /** font id for the Samsung/Android mockup (Samsung can change its system font) */
  androidFont: string;
  messages: Message[];
}
