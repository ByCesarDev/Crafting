import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { Select } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import { trackThemeChange } from "@/lib/analytics";

type Theme = "light" | "dark" | "system";

const icons: Record<Theme, React.ReactNode> = {
  light: <SunIcon size={14} />,
  dark: <MoonIcon size={14} />,
  system: <MonitorIcon size={14} />,
};

export const ThemeToggle = () => {
  const { theme, setTheme: setAppTheme } = useTheme();

  const handleThemeChange = (nextTheme: Theme) => {
    if (nextTheme === theme) {
      return;
    }

    trackThemeChange({
      prev_theme: theme,
      theme: nextTheme,
    });
    setAppTheme(nextTheme);
  };

  return (
    <div className="relative">
      <div className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2">
        {icons[theme as Theme]}
      </div>
      <Select
        aria-label="Theme"
        value={theme}
        className="pl-8"
        onChange={(e) => handleThemeChange(e.target.value as Theme)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </Select>
    </div>
  );
};
