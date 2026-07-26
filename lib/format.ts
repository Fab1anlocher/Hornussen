/**
 * Swiss thousands grouping with a straight apostrophe: 13793 → 13'793.
 * Done by hand rather than via toLocaleString so the server render and the
 * client count-up produce byte-identical strings on every ICU version.
 */
export function formatCH(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/** Signed percentage as shown in the story: 50 → "+50 %". */
export function formatPct(n: number): string {
  return `+${Math.round(n)} %`;
}
