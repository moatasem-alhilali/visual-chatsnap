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

export type MessageType =
  | "text"
  | "voice"
  | "image"
  /** big sticker without a bubble: imageSrc, or 1–3 emoji in text */
  | "sticker"
  /** shared location: map card with Message.location */
  | "location"
  /** document attachment: Message.file */
  | "file"
  /** voice/video call entry (missed or connected): Message.call */
  | "call"
  /** "This message was deleted" placeholder */
  | "deleted";

/** Link preview card attached to a text message. */
export interface LinkPreview {
  url: string;
  title: string;
  description?: string;
  /** e.g. "example.com" (derived from url when empty) */
  siteName?: string;
  /** data URL of the preview image */
  image?: string | null;
}

export interface LocationShare {
  /** place name, e.g. "Noon Store – Olaya" */
  title: string;
  /** address or coordinates line */
  subtitle?: string;
  /** live location (apps show their "Live location" styling) */
  live?: boolean;
}

export interface FileShare {
  /** file name with extension, e.g. "Invoice-48213.pdf" */
  name: string;
  /** human size label, e.g. "245 KB" */
  size?: string;
  /** page count label for PDFs, e.g. "2 pages" */
  pages?: string;
}

export interface CallEntry {
  video: boolean;
  missed: boolean;
  /** duration label for a connected call, e.g. "4:12" */
  duration?: string;
}

/** Group chat: the other participants (me is Scenario.me). */
export interface GroupChat {
  name: string;
  /** data URL of the group picture, or null for the app default */
  avatar: string | null;
  /** other members, in order; "them" messages pick one via Message.authorIndex */
  members: Person[];
}

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
  /** shows the app's "Edited" label */
  edited?: boolean;
  /** link preview card for a text message containing a URL */
  link?: LinkPreview | null;
  location?: LocationShare | null;
  file?: FileShare | null;
  call?: CallEntry | null;
  /**
   * Group chats only: which member (index into Scenario.group.members) wrote
   * this "them" message (default 0).
   */
  authorIndex?: number;
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
  /**
   * Show the OS keyboard while my messages are typed into the composer
   * (undefined = on). Only matters when compose typing is on.
   */
  keyboard?: boolean;
  /**
   * Group chat. When set, the conversation is a group: the header shows the
   * group, "them" messages carry sender names/avatars as the app does, and
   * Scenario.them is ignored in favour of group.members.
   */
  group?: GroupChat | null;
  messages: Message[];
}
