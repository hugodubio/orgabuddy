import { addDays, addHours, setHours, setMinutes, startOfWeek } from "date-fns";
import { PrismaClient, AvailabilityStatus, AttendanceStatus, RehearsalStatus, UserRole } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { generateSuggestions } from "@/lib/scheduling/generateSuggestions";

const prisma = new PrismaClient();

type SeedUser = {
  email: string;
  name: string;
  role: UserRole;
};

const users: SeedUser[] = [
  { email: "admin@orgabuddy.app", name: "Marta Silva", role: UserRole.ADMIN },
  { email: "alex@orgabuddy.app", name: "Alex Reed", role: UserRole.MEMBER },
  { email: "nina@orgabuddy.app", name: "Nina Costa", role: UserRole.MEMBER },
  { email: "leo@orgabuddy.app", name: "Leo Harper", role: UserRole.MEMBER },
  { email: "sara@orgabuddy.app", name: "Sara Valente", role: UserRole.MEMBER },
  { email: "jules@orgabuddy.app", name: "Jules Bennett", role: UserRole.MEMBER },
  { email: "rui@orgabuddy.app", name: "Rui Ferreira", role: UserRole.MEMBER },
  { email: "maya@orgabuddy.app", name: "Maya Flores", role: UserRole.MEMBER },
];

const seedPassword = "DemoPass123!";

async function maybeProvisionAuthUsers() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    console.warn("Skipping Supabase Auth seed because NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
    return;
  }

  const supabase = createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  for (const user of users) {
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing.users.find((entry) => entry.email === user.email);

    if (!found) {
      await supabase.auth.admin.createUser({
        email: user.email,
        password: seedPassword,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role,
        },
      });
    }
  }
}

function atDayHour(base: Date, dayOffset: number, hour: number, minutes = 0) {
  return setMinutes(setHours(addDays(base, dayOffset), hour), minutes);
}

async function main() {
  await maybeProvisionAuthUsers();

  await prisma.rehearsalAttendance.deleteMany();
  await prisma.rehearsal.deleteMany();
  await prisma.rehearsalSuggestion.deleteMany();
  await prisma.availabilityBlock.deleteMany();
  await prisma.bandMember.deleteMany();
  await prisma.band.deleteMany();
  await prisma.user.deleteMany();

  const createdUsers = new Map<string, Awaited<ReturnType<typeof prisma.user.create>>>();

  for (const user of users) {
    const created = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    createdUsers.set(user.email, created);
  }

  const admin = createdUsers.get("admin@orgabuddy.app");
  if (!admin) {
    throw new Error("Admin user seed failed.");
  }

  const nightOwls = await prisma.band.create({
    data: {
      name: "Night Owls",
      slug: "night-owls",
      description: "Alternative indie quartet rehearsing for summer festival dates.",
      createdById: admin.id,
    },
  });

  const brassSignal = await prisma.band.create({
    data: {
      name: "Brass Signal",
      slug: "brass-signal",
      description: "Neo-soul horn project with rotating guest players.",
      createdById: admin.id,
    },
  });

  const membershipData = [
    { bandId: nightOwls.id, email: "alex@orgabuddy.app", roleName: "Vocals", isRequired: true },
    { bandId: nightOwls.id, email: "nina@orgabuddy.app", roleName: "Guitar", isRequired: true },
    { bandId: nightOwls.id, email: "leo@orgabuddy.app", roleName: "Bass", isRequired: true },
    { bandId: nightOwls.id, email: "sara@orgabuddy.app", roleName: "Drums", isRequired: true },
    { bandId: brassSignal.id, email: "jules@orgabuddy.app", roleName: "Keys", isRequired: true },
    { bandId: brassSignal.id, email: "rui@orgabuddy.app", roleName: "Sax", isRequired: true },
    { bandId: brassSignal.id, email: "maya@orgabuddy.app", roleName: "Trumpet", isRequired: false },
    { bandId: brassSignal.id, email: "sara@orgabuddy.app", roleName: "Percussion", isRequired: true },
  ];

  for (const item of membershipData) {
    const user = createdUsers.get(item.email);
    if (!user) continue;

    await prisma.bandMember.create({
      data: {
        bandId: item.bandId,
        userId: user.id,
        roleName: item.roleName,
        isRequired: item.isRequired,
      },
    });
  }

  const baseWeek = startOfWeek(new Date(), { weekStartsOn: 1 });

  const availabilityTemplates: Record<string, Array<{ day: number; start: number; end: number; preferred?: boolean }>> = {
    "admin@orgabuddy.app": [
      { day: 1, start: 18, end: 22 },
      { day: 2, start: 18, end: 22, preferred: true },
      { day: 4, start: 18, end: 21 },
      { day: 6, start: 11, end: 16 },
    ],
    "alex@orgabuddy.app": [
      { day: 1, start: 18, end: 22, preferred: true },
      { day: 3, start: 19, end: 23 },
      { day: 5, start: 18, end: 22 },
      { day: 6, start: 14, end: 19 },
    ],
    "nina@orgabuddy.app": [
      { day: 1, start: 18, end: 23 },
      { day: 2, start: 19, end: 22, preferred: true },
      { day: 5, start: 18, end: 21 },
      { day: 6, start: 13, end: 18 },
    ],
    "leo@orgabuddy.app": [
      { day: 1, start: 17, end: 22 },
      { day: 3, start: 18, end: 22, preferred: true },
      { day: 5, start: 19, end: 23 },
      { day: 6, start: 11, end: 18 },
    ],
    "sara@orgabuddy.app": [
      { day: 1, start: 18, end: 21 },
      { day: 3, start: 18, end: 22 },
      { day: 4, start: 19, end: 23 },
      { day: 6, start: 15, end: 21, preferred: true },
    ],
    "jules@orgabuddy.app": [
      { day: 2, start: 18, end: 22, preferred: true },
      { day: 4, start: 18, end: 22 },
      { day: 6, start: 12, end: 18 },
    ],
    "rui@orgabuddy.app": [
      { day: 2, start: 18, end: 21 },
      { day: 4, start: 18, end: 22, preferred: true },
      { day: 6, start: 13, end: 19 },
    ],
    "maya@orgabuddy.app": [
      { day: 2, start: 19, end: 22 },
      { day: 5, start: 18, end: 21 },
      { day: 6, start: 15, end: 19, preferred: true },
    ],
  };

  for (const [email, blocks] of Object.entries(availabilityTemplates)) {
    const user = createdUsers.get(email);
    if (!user) continue;

    for (const block of blocks) {
      await prisma.availabilityBlock.create({
        data: {
          userId: user.id,
          startAt: atDayHour(baseWeek, block.day, block.start),
          endAt: atDayHour(baseWeek, block.day, block.end),
          status: block.preferred ? AvailabilityStatus.PREFERRED : AvailabilityStatus.AVAILABLE,
        },
      });
    }
  }

  const existingRehearsal = await prisma.rehearsal.create({
    data: {
      bandId: nightOwls.id,
      startAt: atDayHour(baseWeek, 2, 20),
      endAt: atDayHour(baseWeek, 2, 22),
      status: RehearsalStatus.CONFIRMED,
      createdById: admin.id,
      notes: "Tighten transitions before showcase.",
    },
  });

  const secondRehearsal = await prisma.rehearsal.create({
    data: {
      bandId: brassSignal.id,
      startAt: atDayHour(baseWeek, 4, 19),
      endAt: atDayHour(baseWeek, 4, 21),
      status: RehearsalStatus.CONFIRMED,
      createdById: admin.id,
      notes: "Horn section voicings and rhythm breakdown.",
    },
  });

  const allMembers = await prisma.bandMember.findMany({
    where: {
      bandId: {
        in: [nightOwls.id, brassSignal.id],
      },
    },
  });

  for (const member of allMembers.filter((entry) => entry.bandId === nightOwls.id)) {
    await prisma.rehearsalAttendance.create({
      data: {
        rehearsalId: existingRehearsal.id,
        userId: member.userId,
        status: member.isRequired ? AttendanceStatus.CONFIRMED : AttendanceStatus.PENDING,
      },
    });
  }

  for (const member of allMembers.filter((entry) => entry.bandId === brassSignal.id)) {
    await prisma.rehearsalAttendance.create({
      data: {
        rehearsalId: secondRehearsal.id,
        userId: member.userId,
        status: AttendanceStatus.PENDING,
      },
    });
  }

  const rangeStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  await generateSuggestions({
    bandId: nightOwls.id,
    rangeStart,
    rangeEnd: addDays(rangeStart, 14),
    durationMinutes: 120,
  });
  await generateSuggestions({
    bandId: brassSignal.id,
    rangeStart,
    rangeEnd: addDays(rangeStart, 14),
    durationMinutes: 120,
  });

  console.log("Seed complete.");
  console.log(`Demo login password: ${seedPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
