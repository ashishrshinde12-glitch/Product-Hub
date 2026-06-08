export const VALID_UTRS = [
  "SM2026001",
  "SM2026002",
  "SM2026003",
  "SM2026004",
  "SM2026005",
  "SM2026006",
  "SM2026007",
  "SM2026008",
  "SM2026009",
  "SM2026010",
  // Generating 200 unique UTRs starting with SM2026
  ...Array.from({ length: 190 }, (_, i) => `SM2026${(i + 11).toString().padStart(3, '0')}`)
];
