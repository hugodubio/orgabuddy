import { z } from "zod";

export const bandSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(240).optional().or(z.literal("")),
});

export const memberAssignmentSchema = z.object({
  bandId: z.string().cuid(),
  userId: z.string().cuid(),
  roleName: z.string().max(40).optional().or(z.literal("")),
  isRequired: z.boolean().default(true),
});

export const updateBandMemberStatusSchema = z.object({
  bandMemberId: z.string().cuid(),
  isRequired: z.boolean(),
});
