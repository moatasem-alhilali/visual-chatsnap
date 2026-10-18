import { z } from "zod";

import { DEFAULT_STATUS_BAR, type Scenario } from "../types";

const platformSchema = z.enum([
  "whatsapp",
  "telegram",
  "instagram",
  "snapchat",
  "imessage",
  "messenger",
  "tiktok",
  "x",
  "signal",
  "discord",
  "viber",
]);

const deviceSchema = z.enum(["iphone", "android"]);
const senderSchema = z.enum(["me", "them"]);
const messageTypeSchema = z.enum(["text", "voice", "image"]);
const deliveryStatusSchema = z.enum(["sent", "delivered", "read"]);
const chatThemeSchema = z.enum(["light", "dark"]);
const presenceStatusSchema = z.enum(["online", "typing", "lastseen"]);

const statusBarSchema = z
  .object({
    wifi: z.boolean().catch(DEFAULT_STATUS_BAR.wifi),
    cellular: z.boolean().catch(DEFAULT_STATUS_BAR.cellular),
    batteryPct: z.boolean().catch(DEFAULT_STATUS_BAR.batteryPct),
    time: z.string().max(8).optional().catch(undefined),
    battery: z.coerce.number().int().min(1).max(100).optional().catch(undefined),
  })
  .catch(DEFAULT_STATUS_BAR);

const personSchema = z.object({
  name: z.string().catch(""),
  avatar: z.string().nullable().catch(null),
});

const messageSchema = z.object({
  id: z.string().min(1),
  sender: senderSchema,
  type: messageTypeSchema,
  text: z.string().catch(""),
  time: z.string().catch(""),
  delayMs: z.coerce.number().min(0).catch(0),
  typingMs: z.coerce.number().min(0).catch(0),
  status: deliveryStatusSchema.catch("read"),
  voiceDuration: z.string().optional(),
  imageSrc: z.string().nullable().optional(),
  reaction: z.string().max(16).nullable().optional().catch(null),
  replyToId: z.string().nullable().optional().catch(null),
});

export const scenarioSchema = z.object({
  version: z.coerce.number().int().min(1).catch(1),
  platform: platformSchema.catch("whatsapp"),
  device: deviceSchema.catch("iphone"),
  theme: chatThemeSchema.catch("light"),
  me: personSchema,
  them: personSchema,
  presence: presenceStatusSchema.catch("online"),
  lastSeenText: z.string().catch(""),
  androidFont: z.string().catch("roboto"),
  statusBar: statusBarSchema,
  composeTyping: z.boolean().optional().catch(undefined),
  deviceColor: z.string().max(32).optional().catch(undefined),
  messages: z.array(messageSchema).catch([]),
});

export function parseScenario(input: unknown): Scenario {
  return scenarioSchema.parse(input);
}
