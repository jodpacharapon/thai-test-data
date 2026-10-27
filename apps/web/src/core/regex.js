// Regex helpers shared by the result search and the Validator's custom pattern mode.

const VALID_FLAGS = /^[dgimsuyv]*$/;

/**
 * Compile a user-typed pattern. Never throws: returns { re } or { error }.
 * @param {string} pattern
 * @param {string} [flags]
 * @returns {{ re?: RegExp, error?: string }}
 */
export function compileRegex(pattern, flags = "") {
  if (!VALID_FLAGS.test(flags)) return { error: `flag ไม่ถูกต้อง: ${flags.replace(/[dgimsuyv]/g, "")}` };
  try {
    return { re: new RegExp(pattern, [...new Set(flags)].join("")) };
  } catch (e) {
    return { error: e instanceof Error ? e.message.replace(/^Invalid regular expression: /, "") : "pattern ไม่ถูกต้อง" };
  }
}

/**
 * Every match of `re` in `text` with its position and capture groups.
 * Without the g flag only the first match is returned, like String#match.
 * @param {RegExp} re
 * @param {string} text
 * @returns {{ start: number, end: number, text: string, groups: (string|undefined)[], named: Record<string,string>|undefined }[]}
 */
export function findMatches(re, text) {
  const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  const out = [];
  for (const m of text.matchAll(global)) {
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0], groups: m.slice(1), named: m.groups });
    if (!re.flags.includes("g")) break;
  }
  return out;
}

/** Escape text so it matches literally inside a RegExp. */
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
