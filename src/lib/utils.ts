import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calculateDurationHours(pickup: Date | string, returnDate: Date | string): number {
  const start = new Date(pickup).getTime();
  const end = new Date(returnDate).getTime();
  if (end <= start) return 24;
  const hours = (end - start) / (1000 * 60 * 60);
  return Math.max(1, Math.round(hours));
}

export function calculateDurationDays(pickup: Date | string, returnDate: Date | string): number {
  const hours = calculateDurationHours(pickup, returnDate);
  return Math.max(1, Math.ceil(hours / 24));
}

export function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `RS-${year}-${random}`;
}

export function generateTicketId(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TKT-${random}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
