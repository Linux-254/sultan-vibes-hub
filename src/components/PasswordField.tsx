import { Lock } from "lucide-react";
import { checkPasswordStrength, type StrengthResult } from "@/lib/password-strength";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  showStrength?: boolean;
}

export function PasswordField({
  label,
  value,
  onChange,
  placeholder = "At least 8 characters",
  autoComplete = "new-password",
  minLength = 8,
  showStrength = true,
}: PasswordFieldProps) {
  const strength: StrengthResult | null =
    showStrength && value.length > 0 ? checkPasswordStrength(value) : null;
  const tooShort = value.length > 0 && value.length < minLength;

  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-2 flex items-center gap-2 bg-night/60 border border-border/60 rounded-2xl px-4 py-3.5 focus-within:border-gold transition-colors">
        <Lock size={16} className="text-gold shrink-0" />
        <input
          type="password"
          required
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent focus:outline-none text-sm"
        />
      </div>

      {tooShort && (
        <p className="text-[11px] text-lava mt-1.5">Must be at least {minLength} characters</p>
      )}

      {strength && value.length >= minLength && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= strength.score ? strength.color : "bg-foreground/10"
                }`}
              />
            ))}
          </div>
          <span
            className={`text-[11px] font-medium ${
              strength.level === "weak"
                ? "text-lava"
                : strength.level === "fair"
                  ? "text-orange-500"
                  : strength.level === "good"
                    ? "text-yellow-400"
                    : "text-savanna"
            }`}
          >
            {strength.label}
          </span>
        </div>
      )}
    </label>
  );
}
