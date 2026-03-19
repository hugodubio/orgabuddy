"use server";

import { revalidatePath } from "next/cache";
import { addDays, endOfWeek, startOfWeek } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { requireAdminUser, requireCurrentUser } from "@/lib/auth/session";
import { bandSchema, memberAssignmentSchema, updateBandMemberStatusSchema } from "@/lib/validations/bands";
import { confirmRehearsalSchema, cancelRehearsalSchema, suggestionGenerationSchema } from "@/lib/validations/rehearsals";
import { saveAvailabilitySchema } from "@/lib/validations/availability";
import { generateSuggestions } from "@/lib/scheduling/generateSuggestions";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createBand(formData: FormData) {
  const admin = await requireAdminUser();
  const parsed = bandSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  const band = await prisma.band.create({
    data: {
      name: parsed.name,
      slug: `${slugify(parsed.name)}-${Date.now().toString().slice(-4)}`,
      description: parsed.description || null,
      createdById: admin.id,
    },
  });

  revalidatePath("/bands");
}

export async function updateBand(bandId: string, formData: FormData) {
  await requireAdminUser();
  const parsed = bandSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  await prisma.band.update({
    where: { id: bandId },
    data: {
      name: parsed.name,
      description: parsed.description || null,
    },
  });

  revalidatePath(`/bands/${bandId}`);
  revalidatePath("/bands");
}

export async function addBandMember(input: {
  bandId: string;
  userId: string;
  roleName?: string;
  isRequired: boolean;
}) {
  await requireAdminUser();
  const parsed = memberAssignmentSchema.parse(input);

  await prisma.bandMember.create({
    data: {
      bandId: parsed.bandId,
      userId: parsed.userId,
      roleName: parsed.roleName || null,
      isRequired: parsed.isRequired,
    },
  });

  revalidatePath(`/bands/${parsed.bandId}`);
  revalidatePath(`/bands/${parsed.bandId}/members`);
}

export async function removeBandMember(bandMemberId: string, bandId: string) {
  await requireAdminUser();

  await prisma.bandMember.delete({
    where: { id: bandMemberId },
  });

  revalidatePath(`/bands/${bandId}`);
  revalidatePath(`/bands/${bandId}/members`);
}

export async function updateBandMemberRequiredStatus(input: {
  bandMemberId: string;
  isRequired: boolean;
}) {
  await requireAdminUser();
  const parsed = updateBandMemberStatusSchema.parse(input);

  const updated = await prisma.bandMember.update({
    where: { id: parsed.bandMemberId },
    data: { isRequired: parsed.isRequired },
  });

  revalidatePath(`/bands/${updated.bandId}/members`);
}

export async function saveAvailabilityBlocks(input: {
  weekStart: Date;
  blocks: Array<{
    startAt: Date;
    endAt: Date;
    status: "AVAILABLE" | "PREFERRED" | "UNAVAILABLE";
  }>;
}) {
  const user = await requireCurrentUser();
  const parsed = saveAvailabilitySchema.parse(input);
  const weekStart = startOfWeek(parsed.weekStart, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(parsed.weekStart, { weekStartsOn: 1 });

  await prisma.availabilityBlock.deleteMany({
    where: {
      userId: user.id,
      startAt: { gte: weekStart },
      endAt: { lte: weekEnd },
    },
  });

  if (parsed.blocks.length) {
    await prisma.availabilityBlock.createMany({
      data: parsed.blocks.map((block) => ({
        userId: user.id,
        startAt: block.startAt,
        endAt: block.endAt,
        status: block.status,
      })),
    });
  }

  revalidatePath("/availability");
}

export async function getAvailabilityForWeek(weekStart: Date) {
  const user = await requireCurrentUser();
  const start = startOfWeek(weekStart, { weekStartsOn: 1 });
  const end = addDays(start, 7);

  return prisma.availabilityBlock.findMany({
    where: {
      userId: user.id,
      startAt: { gte: start },
      endAt: { lte: end },
    },
    orderBy: {
      startAt: "asc",
    },
  });
}

export async function generateBandSuggestions(input: {
  bandId: string;
  rangeStart: Date;
  rangeEnd: Date;
  durationMinutes: number;
}) {
  await requireAdminUser();
  const parsed = suggestionGenerationSchema.parse(input);
  const suggestions = await generateSuggestions(parsed);

  revalidatePath(`/bands/${parsed.bandId}/suggestions`);
  revalidatePath("/dashboard");
  return suggestions;
}

export async function confirmRehearsal(input: {
  bandId: string;
  suggestionId?: string;
  startAt: Date;
  endAt: Date;
  notes?: string;
}) {
  const admin = await requireAdminUser();
  const parsed = confirmRehearsalSchema.parse(input);

  const bandMembers = await prisma.bandMember.findMany({
    where: { bandId: parsed.bandId },
  });

  const conflicts = await prisma.rehearsal.findMany({
    where: {
      status: "CONFIRMED",
      startAt: { lt: parsed.endAt },
      endAt: { gt: parsed.startAt },
      OR: [
        { bandId: parsed.bandId },
        {
          band: {
            members: {
              some: {
                userId: { in: bandMembers.map((member) => member.userId) },
              },
            },
          },
        },
      ],
    },
  });

  if (conflicts.length) {
    throw new Error("This rehearsal overlaps an existing confirmed rehearsal.");
  }

  const rehearsal = await prisma.rehearsal.create({
    data: {
      bandId: parsed.bandId,
      startAt: parsed.startAt,
      endAt: parsed.endAt,
      status: "CONFIRMED",
      notes: parsed.notes || null,
      createdById: admin.id,
      attendances: {
        create: bandMembers.map((member) => ({
          userId: member.userId,
          status: member.isRequired ? "CONFIRMED" : "PENDING",
        })),
      },
    },
  });

  if (parsed.suggestionId) {
    await prisma.rehearsalSuggestion.delete({
      where: { id: parsed.suggestionId },
    });
  }

  revalidatePath(`/bands/${parsed.bandId}/rehearsals`);
  revalidatePath(`/bands/${parsed.bandId}/suggestions`);
  revalidatePath("/rehearsals");
  revalidatePath("/dashboard");

  return rehearsal;
}

export async function cancelRehearsal(input: { rehearsalId: string }) {
  await requireAdminUser();
  const parsed = cancelRehearsalSchema.parse(input);

  const rehearsal = await prisma.rehearsal.update({
    where: {
      id: parsed.rehearsalId,
    },
    data: {
      status: "CANCELLED",
    },
  });

  revalidatePath(`/bands/${rehearsal.bandId}/rehearsals`);
  revalidatePath("/rehearsals");
  revalidatePath("/dashboard");
}
