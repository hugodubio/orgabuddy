import { z } from "zod";

export const availabilityBlockSchema = z.object({
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  status: z.enum(["AVAILABLE", "PREFERRED", "UNAVAILABLE"]).default("AVAILABLE"),
});

export const saveAvailabilitySchema = z.object({
  weekStart: z.coerce.date(),
  blocks: z.array(availabilityBlockSchema),
});
