export type Platform =
  | "whatsapp"
  | "telegram"
  | "instagram"
  | "snapchat"
  | "imessage"
  | "messenger"
  | "tiktok"
  | "x"
  | "signal"
  | "discord"
  | "viber";

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

/** User-controlled status-bar icons. */
export interface StatusBarConfig {
  wifi: boolean;
  /** cellular coverage (signal bars + 4G+/VoLTE on Samsung) */
  cellular: boolean;
  /** show the battery percentage number */
  batteryPct: boolean;
  /** clock shown in the status bar, e.g. "9:41" (device default when unset) */
  time?: string;
  /** battery level 1–100 (device default when unset) */
  battery?: number;
}

export const DEFAULT_STATUS_BAR: StatusBarConfig = {
  wifi: true,
  cellular: false,
  batteryPct: false,
};

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
  /**
   * Emoji reaction attached to this message (e.g. "❤️"). On "me" messages it
   * is the other party's reaction; on "them" messages it is mine.
   */
  reaction?: string | null;
  /** id of an earlier message this one replies to (rendered as a quote) */
  replyToId?: string | null;
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
  /** which icons appear in the status bar */
  statusBar: StatusBarConfig;
  /**
   * During playback/export my text messages are typed into the composer
   * before they are sent (undefined = on).
   */
  composeTyping?: boolean;
  /** physical finish of the phone shell (DeviceFrame colour id; device default when unset) */
  deviceColor?: string;
  messages: Message[];
}
