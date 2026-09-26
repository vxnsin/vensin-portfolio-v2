import { z } from "zod";

const Timestamps = z.object({ start: z.number().optional(), end: z.number().optional() });

export const ActivitySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.number().optional(),
  state: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
  application_id: z.string().optional(),
  timestamps: Timestamps.optional(),
  assets: z
    .object({
      large_image: z.string().optional(),
      large_text: z.string().optional(),
      small_image: z.string().optional(),
      small_text: z.string().optional(),
    })
    .optional(),
  emoji: z.object({ name: z.string(), id: z.string().optional(), animated: z.boolean().optional() }).optional().nullable(),
});

export const LanyardDataSchema = z.object({
  discord_user: z.object({
    id: z.string(),
    username: z.string(),
    global_name: z.string().optional().nullable(),
    display_name: z.string().optional().nullable(),
    avatar: z.string().optional().nullable(),
  }),
  discord_status: z.enum(["online", "idle", "dnd", "offline"]),
  activities: z.array(ActivitySchema).default([]),
  spotify: z
    .object({
      song: z.string(),
      artist: z.string(),
      album: z.string().optional(),
      album_art_url: z.string().optional().nullable(),
      track_id: z.string().optional().nullable(),
      timestamps: Timestamps.optional(),
    })
    .nullable()
    .optional(),
});

export type Activity = z.infer<typeof ActivitySchema>;
export type LanyardData = z.infer<typeof LanyardDataSchema>;
