export type StrengthLevel = "weak" | "fair" | "good" | "great";

export interface StrengthResult {
  level: StrengthLevel;
  score: number; // 0–4
  label: string;
  color: string;
}

export function checkPasswordStrength(pw: string): StrengthResult {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  // Cap at 4
  score = Math.min(score, 4);

  const map: Record<number, StrengthResult> = {
    0: { level: "weak", score: 0, label: "Weak", color: "bg-lava" },
    1: { level: "weak", score: 1, label: "Weak", color: "bg-lava" },
    2: { level: "fair", score: 2, label: "Fair", color: "bg-orange-500" },
    3: { level: "good", score: 3, label: "Good", color: "bg-yellow-400" },
    4: { level: "great", score: 4, label: "Great", color: "bg-savanna" },
  };

  return map[score] ?? map[0];
}
