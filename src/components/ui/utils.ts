import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "";
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    if (!isValid(date)) return String(dateStr);
    return format(date, "dd-MM-yyyy", { locale: es });
  } catch (e) {
    return String(dateStr);
  }
}
