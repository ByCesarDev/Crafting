import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { Select } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import { trackThemeChange } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const icons: Record<Theme, React.ReactNode> = {
  light: <SunIcon size={14} />,
  dark: <MoonIcon size={14} />,
  system: <MonitorIcon size={14} />,
};

type ThemeToggleProps = {
  className?: string;
  wrapperClassName?: string;
};

export const ThemeToggle = ({ className, wrapperClassName }: ThemeToggleProps) => {
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
    <div className={cn("relative min-w-[6.5rem]", wrapperClassName)}>
      <div className="text-header-foreground/80 pointer-events-none absolute top-1/2 left-2.5 z-10 -translate-y-1/2">
        {icons[theme as Theme]}
      </div>
      <Select
        aria-label="Theme"
        value={theme}
        className={cn(
          "border-header-foreground/20 bg-header-foreground/10 text-header-foreground hover:bg-header-foreground/15 focus:ring-header-foreground/30 pl-7 text-xs font-medium",
          className,
        )}
        iconClassName="text-header-foreground/80"
        onChange={(e) => handleThemeChange(e.target.value as Theme)}
      >
        <option value="light" className="bg-background text-foreground">
          Light
        </option>
        <option value="dark" className="bg-background text-foreground">
          Dark
        </option>
        <option value="system" className="bg-background text-foreground">
          System
        </option>
      </Select>
    </div>
  );
};
