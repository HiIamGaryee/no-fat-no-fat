import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export const SheetContent = ({ children }: { children: ReactNode }) => (
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/60 data-[state=open]:animate-in" />
    <Dialog.Content className="fixed inset-y-0 end-0 z-[100] w-[min(88vw,380px)] overflow-y-auto border-s-2 border-ink bg-cream p-6 shadow-[-10px_0_0_var(--pink)] focus:outline-none rtl:shadow-[10px_0_0_var(--pink)]">
      <Dialog.Title className="font-display text-3xl uppercase">Menu. Finally.</Dialog.Title>
      <Dialog.Description className="mt-1 text-sm">Pick a destination. We believe in you, briefly.</Dialog.Description>
      <Dialog.Close aria-label="Close menu" className="absolute end-4 top-4 grid min-h-11 min-w-11 place-items-center border-2 border-ink bg-white"><X /></Dialog.Close>
      {children}
    </Dialog.Content>
  </Dialog.Portal>
);
