import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const BrandLogo = ({ light = false, className }: { light?: boolean; className?: string }) => (
  <Link to="/" aria-label="NO-FAT-NO-FAT home" className={cn("inline-flex items-center gap-2 font-display text-lg tracking-tight", light && "text-white", className)}>
    <span className={cn("grid h-7 w-7 place-items-center rounded-full border-2 border-current text-xs", light ? "bg-pink text-ink" : "bg-ink text-lime")}>NF</span>
    <span>NO-FAT-NO-FAT<sup className="font-body text-[8px]">®</sup></span>
  </Link>
);
