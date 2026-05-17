// ====================================================================
// ThemeToggle - زر التبديل بين الوضع الليلي والنهاري (Glass Thick)
// ====================================================================

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  if (compact) {
    return (
      <button
        onClick={toggle}
        aria-label={isDark ? "وضع نهاري" : "وضع ليلي"}
        className="p-3 rounded-2xl glass-thick border border-white/40 active:scale-95 transition shadow-glassy"
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-yellow-400" />
        ) : (
          <Moon className="w-5 h-5 text-slate-700" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="w-full flex items-center gap-3 p-4 rounded-2xl glass-thick border border-white/40 hover:bg-background/40 transition text-right shadow-glassy"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700" />
      )}
      <span className="font-bold">{isDark ? "الوضع النهاري" : "الوضع الليلي"}</span>
    </button>
  );
}
