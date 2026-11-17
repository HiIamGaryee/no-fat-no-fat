import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

type LegalSection = { heading: string; paragraphs: string[] };

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
};

export const LegalPage = ({ eyebrow, title, intro, sections }: LegalPageProps) => (
  <main className="min-h-screen bg-cream pt-24">
    <header className="border-b-2 border-ink bg-lime py-16 md:py-24">
      <div className="page-shell">
        <Link to="/" className="inline-flex min-h-11 items-center gap-2 font-bold uppercase underline"><ArrowLeft className="h-5 w-5 rtl:rotate-180" />Back home</Link>
        <p className="mt-10 text-xs font-bold uppercase tracking-[.2em]">{eyebrow}</p>
        <h1 className="mt-4 max-w-5xl font-display text-[clamp(3.5rem,10vw,8rem)] uppercase leading-[.86]">{title}</h1>
        <p className="mt-8 max-w-3xl text-lg font-medium leading-relaxed md:text-xl">{intro}</p>
        <p className="mt-6 text-xs font-bold uppercase tracking-wider">Last updated: 17 November 2026</p>
      </div>
    </header>
    <div className="page-shell py-14 md:py-20">
      <div className="mx-auto max-w-4xl border-2 border-ink bg-white shadow-[10px_10px_0_var(--ink)]">
        {sections.map((section, index) => <section key={section.heading} className="grid gap-5 border-b-2 border-ink p-6 last:border-b-0 md:grid-cols-[4rem_1fr] md:p-10"><span className="font-display text-3xl text-blue">{String(index+1).padStart(2,"0")}</span><div><h2 className="font-display text-3xl uppercase md:text-4xl">{section.heading}</h2>{section.paragraphs.map((paragraph)=><p key={paragraph} className="mt-4 leading-relaxed text-ink/80">{paragraph}</p>)}</div></section>)}
      </div>
    </div>
    <Footer />
  </main>
);

export const privacySections: LegalSection[] = [
  { heading: "Data we keep", paragraphs: ["Your profile, settings, progress, missions, chat history, and tool activity are stored locally in your browser. They do not automatically sync to an account or a NO-FAT-NO-FAT user database."] },
  { heading: "AI requests", paragraphs: ["When you use an AI feature, your message and the minimum relevant context are sent through our server-side proxy to Google's Gemini service to generate a response. Do not submit medical records or other highly sensitive information."] },
  { heading: "Your control", paragraphs: ["You can export, import, reset, or delete your locally stored data from Settings. Clearing browser storage can also permanently remove it."] },
  { heading: "Safety and contact", paragraphs: ["NO-FAT-NO-FAT is a general wellness prototype, not a medical service. For privacy questions, contact the project owner through the repository associated with this deployment."] },
];

export const cookiesSections: LegalSection[] = [
  { heading: "Our cookie approach", paragraphs: ["NO-FAT-NO-FAT does not currently use advertising cookies or cross-site tracking cookies. The app relies mainly on browser LocalStorage to remember your choices and activity."] },
  { heading: "LocalStorage", paragraphs: ["LocalStorage is browser storage, not a cookie. It keeps the experience working between visits on the same device and browser, including your selected language and wellness progress."] },
  { heading: "Third-party services", paragraphs: ["Our hosting provider and AI service provider may process technical request information under their own policies. Their infrastructure may use essential security or operational technologies outside our direct control."] },
  { heading: "Managing storage", paragraphs: ["Use Settings to delete app data, or use your browser controls to clear site data. Blocking or clearing storage may reset your profile and app experience."] },
];

export const termsSections: LegalSection[] = [
  { heading: "Using the service", paragraphs: ["You may use this prototype for personal, lawful, general wellness purposes. You must not misuse the service, interfere with its operation, or attempt to access systems or data without permission."] },
  { heading: "Not medical advice", paragraphs: ["Content and AI responses are informational only and do not diagnose, treat, or replace advice from a qualified healthcare professional. Seek professional help for health concerns or emergencies."] },
  { heading: "AI limitations", paragraphs: ["AI output may be incomplete, inaccurate, or unsuitable for your circumstances. Review suggestions critically and never follow guidance that feels dangerous, extreme, or harmful."] },
  { heading: "Availability and liability", paragraphs: ["This hackathon prototype is provided as-is and may change, fail, or become unavailable. To the extent allowed by law, the project owner is not liable for losses arising from reliance on the service."] },
  { heading: "Changes", paragraphs: ["These terms may be updated as the project evolves. Continued use after an update means you accept the revised terms."] },
];
