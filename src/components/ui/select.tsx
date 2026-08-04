import React, { useMemo, useState, type ComponentPropsWithoutRef } from "react";
import { createPortal } from "react-dom";

import {
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SelectProps = Omit<ComponentPropsWithoutRef<"select">, "className" | "options"> & {
  className?: string;
  wrapperClassName?: string;
  iconClassName?: string;
  options?: { value: string; label: React.ReactNode }[];
};

export const Select = ({
  className,
  wrapperClassName,
  iconClassName,
  children,
  value,
  onChange,
  disabled,
  name,
  "aria-label": ariaLabel,
  options,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const optionsList = useMemo(() => {
    if (options) return options;
    const extracted: { value: string; label: React.ReactNode }[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const p = child.props as { value?: string | number; children?: React.ReactNode };
        let val = "";
        if (p.value !== undefined) {
          val = String(p.value);
        } else if (typeof p.children === "string") {
          val = p.children;
        }

        extracted.push({
          value: val,
          label: p.children ?? p.value,
        });
      }
    });
    return extracted;
  }, [children, options]);

  const selectedOption = optionsList.find((opt) => String(opt.value) === String(value));
  const currentLabel = selectedOption
    ? selectedOption.label
    : (value ?? optionsList[0]?.label ?? "");

  const { refs, floatingStyles, isPositioned, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });

  const click = useClick(context, { enabled: !disabled });
  const dismiss = useDismiss(context, { ancestorScroll: true });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  const handleSelect = (val: string) => {
    setIsOpen(false);
    if (onChange) {
      const event = {
        target: { value: val, name },
        currentTarget: { value: val, name },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange(event);
    }
  };

  const referenceWidth = refs.reference.current
    ? refs.reference.current.getBoundingClientRect().width
    : undefined;

  return (
    <div className={cn("relative inline-block w-full", wrapperClassName)}>
      <button
        type="button"
        ref={refs.setReference}
        disabled={disabled}
        aria-label={ariaLabel}
        {...getReferenceProps()}
        className={cn(
          "border-input bg-background text-foreground hover:bg-accent focus:ring-ring flex h-9 w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm leading-tight transition-colors focus:ring-2 focus:outline-hidden focus:ring-inset disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDownIcon
          size={16}
          className={cn(
            "text-muted-foreground ml-2 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180",
            iconClassName,
          )}
        />
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={refs.setFloating}
            className="border-border bg-popover text-popover-foreground z-50 max-h-60 [scrollbar-width:none] overflow-y-auto rounded-md border py-1 shadow-xl [-ms-overflow-style:none] focus:outline-hidden [&::-webkit-scrollbar]:hidden"
            style={{
              ...floatingStyles,
              width: referenceWidth,
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              ...(!isPositioned ? { visibility: "hidden" } : {}),
            }}
            {...getFloatingProps()}
          >
            {optionsList.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={String(opt.value)}
                  className={cn(
                    "hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center justify-between px-3 py-2 text-xs transition-colors sm:text-sm",
                    isSelected && "bg-primary/20 text-primary font-semibold",
                  )}
                  onClick={() => handleSelect(String(opt.value))}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <CheckIcon size={14} className="text-primary ml-2 shrink-0" />}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
};
