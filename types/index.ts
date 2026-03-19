export type AppRole = "ADMIN" | "MEMBER";

export type AvailabilityStatus = "AVAILABLE" | "PREFERRED" | "UNAVAILABLE";

export type RehearsalStatus = "CONFIRMED" | "CANCELLED";

export type AttendanceStatus = "PENDING" | "CONFIRMED" | "DECLINED";

export type NavItem = {
  href: string;
  label: string;
};
