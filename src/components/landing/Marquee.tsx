import { useI18n } from "@/i18n/config";
import { translateUi } from "@/i18n/ui-translations";

const phrases = ["STOP NEGOTIATING WITH YOUR EXCUSES", "YOUR FITNESS PLAN IS STILL LOADING", "THE COACH HAS RECEIPTS", "NO EXCUSES LEFT UNROASTED"];

export const Marquee = () => {
  const { locale } = useI18n();
  return (
  <div className="marquee border-y-2 border-ink bg-ink py-4 text-lime" aria-label={phrases.map((phrase) => translateUi(locale, phrase)).join(". ")}><div className="marquee-track">{[...phrases, ...phrases].map((phrase, index) => <span key={`${phrase}-${index}`} className={index % 2 ? "text-pink" : "text-lime"}>{phrase}<i>◆</i></span>)}</div></div>
  );
};
