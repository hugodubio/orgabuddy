import { endOfWeek, startOfWeek } from "date-fns";
import { prisma } from "@/lib/db/prisma";

export async function getSidebarBands(userId: string, role: "ADMIN" | "MEMBER") {
  return prisma.band.findMany({
    where:
      role === "ADMIN"
        ? undefined
        : {
            members: {
              some: {
                userId,
              },
            },
          },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      rehearsals: {
        where: {
          status: "CONFIRMED",
        },
        orderBy: {
          startAt: "asc",
        },
        take: 1,
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getDashboardData(userId: string, role: "ADMIN" | "MEMBER") {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const bandWhere =
    role === "ADMIN"
      ? {}
      : {
          members: {
            some: {
              userId,
            },
          },
        };

  const [bands, rehearsals, suggestions] = await Promise.all([
    prisma.band.findMany({
      where: bandWhere,
      include: {
        members: {
          include: { user: true },
        },
      },
    }),
    prisma.rehearsal.findMany({
      where: {
        status: "CONFIRMED",
        band: bandWhere,
      },
      include: {
        band: true,
      },
      orderBy: {
        startAt: "asc",
      },
      take: 8,
    }),
    prisma.rehearsalSuggestion.findMany({
      where: {
        band: bandWhere,
      },
      include: {
        band: true,
      },
      orderBy: [{ score: "desc" }, { startAt: "asc" }],
      take: 6,
    }),
  ]);

  const memberIds = new Set(bands.flatMap((band) => band.members.map((member) => member.userId)));
  const memberIdList = Array.from(memberIds);

  const [weeklyAvailability, memberUsers] = await Promise.all([
    prisma.availabilityBlock.findMany({
      where: {
        userId: { in: memberIdList },
        startAt: { gte: thisWeekStart },
        endAt: { lte: thisWeekEnd },
      },
    }),
    prisma.user.findMany({
      where: { id: { in: memberIdList } },
    }),
  ]);

  const missingAvailabilityMembers = memberUsers.filter(
    (user) => !weeklyAvailability.some((block) => block.userId === user.id),
  );

  return {
    totalBands: bands.length,
    totalMembers: memberIds.size,
    confirmedThisWeek: rehearsals.filter((rehearsal) => rehearsal.startAt >= thisWeekStart && rehearsal.startAt <= thisWeekEnd).length,
    missingAvailability: missingAvailabilityMembers.length,
    bands,
    upcomingRehearsals: rehearsals.filter((rehearsal) => rehearsal.startAt >= now).slice(0, 8),
    topSuggestions: suggestions,
    missingAvailabilityMembers,
  };
}

export async function getBandDetail(bandId: string) {
  return prisma.band.findUnique({
    where: { id: bandId },
    include: {
      members: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      rehearsals: {
        where: {
          status: "CONFIRMED",
          startAt: {
            gte: new Date(),
          },
        },
        orderBy: {
          startAt: "asc",
        },
      },
      suggestions: {
        orderBy: [{ score: "desc" }, { startAt: "asc" }],
      },
    },
  });
}

export async function getUsers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
  });
}
