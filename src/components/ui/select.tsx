import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface SelectProps<T extends string | number> {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  id?: string;
  label?: string;
  compact?: boolean;
  className?: string;
}

export const Select = <T extends string | number>({ value, options, onChange, id, label, compact, className }: SelectProps<T>) => {
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = Math.max(0, options.findIndex((option) => option.value === value));
  const [active, setActive] = useState(selected);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const toggle = () => { setActive(selected); setOpen((current) => !current); };
  const pick = (index: number) => { onChange(options[index].value); setOpen(false); };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    if (event.key === "Escape") return setOpen(false);
    if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (!open) return event.key === "Enter" || event.key === " " || event.key === "ArrowDown" || event.key === "ArrowUp" ? toggle() : undefined;
    if (event.key === "Enter" || event.key === " ") return pick(active);
    setActive(event.key === "ArrowDown" ? Math.min(last, active + 1) : event.key === "ArrowUp" ? Math.max(0, active - 1) : event.key === "Home" ? 0 : last);
  };

  return (
    <div ref={root} className={cn("relative", !compact && "mt-2", className)}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-activedescendant={open ? `${uid}-${active}` : undefined}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-2 text-start font-medium outline-none focus-visible:ring-4 focus-visible:ring-blue",
          compact ? "min-h-11 bg-transparent px-2 text-xs font-bold uppercase" : "min-h-14 border-2 border-ink bg-white px-4 text-lg",
        )}
      >
        <span className="truncate">{options[selected]?.label}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul id={`${uid}-list`} role="listbox" className={cn("absolute start-0 top-full z-50 mt-2 max-h-64 overflow-y-auto border-2 border-ink bg-white shadow-[5px_5px_0_var(--ink)]", compact ? "min-w-36" : "min-w-full")}>
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${uid}-${index}`}
              role="option"
              aria-selected={index === selected}
              onMouseEnter={() => setActive(index)}
              onClick={(event) => { event.preventDefault(); pick(index); }}
              className={cn("flex min-h-11 cursor-pointer items-center justify-between gap-3 border-b-2 border-ink px-4 font-bold last:border-b-0", index === active && "bg-lime", index === selected && index !== active && "bg-cream")}
            >
              <span>{option.label}</span>
              {index === selected && <Check className="h-4 w-4 shrink-0" aria-hidden />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
