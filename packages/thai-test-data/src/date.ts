import { int, type Rng } from "./random.js";

const BE_OFFSET = 543;

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

export const toBuddhistYear = (ceYear: number) => ceYear + BE_OFFSET;
export const toChristianYear = (beYear: number) => beYear - BE_OFFSET;

/** YYYY-MM-DD from local date parts (unlike toISOString, which shifts the day in UTC+7). */
export function formatIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** DD/MM/YYYY in the Buddhist Era, e.g. 26/10/2569. */
export function formatThaiDate(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${toBuddhistYear(date.getFullYear())}`;
}

/** Long Thai form, e.g. 26 ตุลาคม 2569. */
export function formatThaiDateLong(date: Date): string {
  return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${toBuddhistYear(date.getFullYear())}`;
}

/** A birth date for someone aged between minAge and maxAge (inclusive) relative to `today`. */
export function birthDate(rng: Rng, minAge = 18, maxAge = 65, today = new Date()): Date {
  const latest = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const earliest = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate() + 1);
  const days = Math.floor((latest.getTime() - earliest.getTime()) / 86_400_000);
  const d = new Date(earliest);
  d.setDate(d.getDate() + int(rng, 0, days));
  return d;
}

export function ageOn(birth: Date, today = new Date()): number {
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age--;
  return age;
}
