import { addMinutes, eachMinuteOfInterval, isAfter, isBefore, max, min } from "date-fns";
import { AvailabilityStatus, RehearsalStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type GenerateSuggestionsInput = {
  bandId: string;
  rangeStart: Date;
  rangeEnd: Date;
  durationMinutes: number;
};

type MemberAvailabilityInfo = {
  memberId: string;
  name: string;
  isRequired: boolean;
  roleName: string | null;
  status: AvailabilityStatus | null;
  isAvailable: boolean;
  blockedByConflict: boolean;
};

function slotCovered(startAt: Date, endAt: Date, blockStart: Date, blockEnd: Date) {
  return (isBefore(blockStart, startAt) || blockStart.getTime() === startAt.getTime()) &&
    (isAfter(blockEnd, endAt) || blockEnd.getTime() === endAt.getTime());
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  const overlapStart = max([aStart, bStart]);
  const overlapEnd = min([aEnd, bEnd]);
  return overlapStart.getTime() < overlapEnd.getTime();
}

export async function generateSuggestions({
  bandId,
  rangeStart,
  rangeEnd,
  durationMinutes,
}: GenerateSuggestionsInput) {
  const band = await prisma.band.findUnique({
    where: { id: bandId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!band) {
    throw new Error("Band not found.");
  }

  if (!band.members.length) {
    return [];
  }

  const userIds = band.members.map((member) => member.userId);

  const [blocks, rehearsals] = await Promise.all([
    prisma.availabilityBlock.findMany({
      where: {
        userId: { in: userIds },
        startAt: { lt: rangeEnd },
        endAt: { gt: rangeStart },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.rehearsal.findMany({
      where: {
        status: RehearsalStatus.CONFIRMED,
        startAt: { lt: rangeEnd },
        endAt: { gt: rangeStart },
        OR: [
          { bandId },
          {
            band: {
              members: {
                some: {
                  userId: { in: userIds },
                },
              },
            },
          },
        ],
      },
      include: {
        band: {
          include: {
            members: true,
          },
        },
      },
    }),
  ]);

  const candidateStarts = eachMinuteOfInterval(
    { start: rangeStart, end: addMinutes(rangeEnd, -30) },
    { step: 30 },
  );

  const rawSuggestions: Array<{
    bandId: string;
    startAt: Date;
    endAt: Date;
    score: number;
    availableMembersCount: number;
    requiredMembersAvailable: boolean;
    metadata: {
      members: MemberAvailabilityInfo[];
      preferredMembersCount: number;
      nearbyConflictPressure: number;
      summary: string;
    };
  }> = [];

  for (const startAt of candidateStarts) {
    const endAt = addMinutes(startAt, durationMinutes);
    if (endAt.getTime() > rangeEnd.getTime()) {
      continue;
    }

    const sameBandConflict = rehearsals.some(
      (rehearsal) => rehearsal.bandId === bandId && intervalsOverlap(startAt, endAt, rehearsal.startAt, rehearsal.endAt),
    );

    if (sameBandConflict) {
      continue;
    }

    let preferredMembersCount = 0;
    let nearbyConflictPressure = 0;
    const members: MemberAvailabilityInfo[] = band.members.map((member) => {
      const coveringBlock = blocks.find(
        (block) =>
          block.userId === member.userId &&
          block.status !== AvailabilityStatus.UNAVAILABLE &&
          slotCovered(startAt, endAt, block.startAt, block.endAt),
      );

      const memberConflict = rehearsals.some(
        (rehearsal) =>
          rehearsal.band.members.some((item) => item.userId === member.userId) &&
          intervalsOverlap(startAt, endAt, rehearsal.startAt, rehearsal.endAt),
      );

      const nearbyConflict = rehearsals.some((rehearsal) => {
        if (!rehearsal.band.members.some((item) => item.userId === member.userId)) {
          return false;
        }

        const pressureWindowStart = addMinutes(startAt, -60);
        const pressureWindowEnd = addMinutes(endAt, 60);
        return intervalsOverlap(pressureWindowStart, pressureWindowEnd, rehearsal.startAt, rehearsal.endAt);
      });

      if (nearbyConflict) {
        nearbyConflictPressure += 1;
      }

      if (coveringBlock?.status === AvailabilityStatus.PREFERRED) {
        preferredMembersCount += 1;
      }

      return {
        memberId: member.userId,
        name: member.user.name,
        isRequired: member.isRequired,
        roleName: member.roleName,
        status: coveringBlock?.status ?? null,
        isAvailable: Boolean(coveringBlock) && !memberConflict,
        blockedByConflict: memberConflict,
      };
    });

    const requiredMembersAvailable = members
      .filter((member) => member.isRequired)
      .every((member) => member.isAvailable);

    if (!requiredMembersAvailable) {
      continue;
    }

    const availableMembersCount = members.filter((member) => member.isAvailable).length;
    const score =
      100 +
      availableMembersCount * 10 +
      preferredMembersCount * 10 -
      nearbyConflictPressure * 20;

    rawSuggestions.push({
      bandId,
      startAt,
      endAt,
      score,
      availableMembersCount,
      requiredMembersAvailable,
      metadata: {
        members,
        preferredMembersCount,
        nearbyConflictPressure,
        summary: `${availableMembersCount}/${members.length} members are free and every required player is covered.`,
      },
    });
  }

  const uniqueSuggestions = rawSuggestions
    .sort((a, b) => b.score - a.score || a.startAt.getTime() - b.startAt.getTime())
    .slice(0, 5);

  await prisma.rehearsalSuggestion.deleteMany({
    where: {
      bandId,
    },
  });

  if (!uniqueSuggestions.length) {
    return [];
  }

  await prisma.rehearsalSuggestion.createMany({
    data: uniqueSuggestions.map((suggestion) => ({
      bandId: suggestion.bandId,
      startAt: suggestion.startAt,
      endAt: suggestion.endAt,
      score: suggestion.score,
      availableMembersCount: suggestion.availableMembersCount,
      requiredMembersAvailable: suggestion.requiredMembersAvailable,
      metadata: suggestion.metadata,
    })),
  });

  return prisma.rehearsalSuggestion.findMany({
    where: {
      bandId,
    },
    orderBy: [{ score: "desc" }, { startAt: "asc" }],
    take: 5,
  });
}
