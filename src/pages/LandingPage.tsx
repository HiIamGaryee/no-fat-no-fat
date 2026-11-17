import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { PersonalitySection } from "@/components/landing/PersonalitySection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ChatPreview } from "@/components/landing/ChatPreview";
import { LanguagePreview } from "@/components/landing/LanguagePreview";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/layout/Footer";

export const LandingPage = () => <main><Hero /><Marquee /><PersonalitySection /><FeaturesSection /><HowItWorks /><ChatPreview /><LanguagePreview /><CTASection /><Footer /></main>;
