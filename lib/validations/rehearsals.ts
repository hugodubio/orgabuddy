import { z } from "zod";

export const suggestionGenerationSchema = z.object({
  bandId: z.string().cuid(),
  rangeStart: z.coerce.date(),
  rangeEnd: z.coerce.date(),
  durationMinutes: z.number().min(30).max(360).default(120),
});

export const confirmRehearsalSchema = z.object({
  bandId: z.string().cuid(),
  suggestionId: z.string().cuid().optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const cancelRehearsalSchema = z.object({
  rehearsalId: z.string().cuid(),
});
