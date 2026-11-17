import { Activity, BrainCircuit, Clock3, Dices, Scale, Search } from "lucide-react";

export const personalities = [
  { id: "sarcastic", title: "Sarcastic", blurb: "Dry wit. Useful nudges. Minimum emotional damage.", response: "Ah yes, tomorrow: the magical kingdom where every workout lives. How about five minutes today?", color: "bg-lime" },
  { id: "savage", title: "Savage", blurb: "Sharper truths for excuses wearing tiny disguises.", response: "Your excuse has excellent presentation and absolutely no evidence. Court dismissed. Walk for ten minutes.", color: "bg-pink" },
  { id: "unhinged", title: "Unhinged", blurb: "Absurd energy. Still medically sensible. Mostly house-trained.", response: "BREAKING: local sofa files restraining order after excessive contact. Stand up. We march for six minutes.", color: "bg-yellow" },
] as const;

export const features = [
  { title: "Savage AI Chat", kicker: "Talk. Get clocked.", description: "A future conversational coach that spots excuse patterns and turns them into practical next moves.", icon: BrainCircuit, tone: "bg-blue text-white", span: "lg:col-span-2" },
  { title: "Midnight Food Rescue", kicker: "Fridge intervention.", description: "A planned tool for making a sensible late-night choice without guilt, panic, or diet-culture nonsense.", icon: Clock3, tone: "bg-pink", span: "" },
  { title: "Excuse Court", kicker: "Objection. Overruled.", description: "Put an excuse on trial, examine the evidence, and leave with one action small enough to actually do.", icon: Scale, tone: "bg-yellow", span: "" },
  { title: "Movement Roulette", kicker: "Spin. Move. Done.", description: "Get a quick, accessible movement suggestion matched to your time, space, and energy.", icon: Dices, tone: "bg-orange", span: "lg:row-span-2" },
  { title: "Habit Autopsy", kicker: "Cause of death: Tuesday.", description: "Review patterns without shame and discover exactly where a routine keeps falling apart.", icon: Activity, tone: "bg-lime", span: "lg:col-span-2" },
  { title: "Evidence Lab", kicker: "Receipts, please.", description: "Explore plain-language, safety-minded health context behind the coach's suggestions.", icon: Search, tone: "bg-cream", span: "" },
] as const;

export const chatPrompts = [
  { short: "4 AM hunger", user: "It's 4 AM and I'm hungry.", roast: "Your fridge is not a nightclub, but hunger is still hunger. Grab water, then choose something simple with protein or fibre. No courtroom drama required.", action: "Build a calm 4 AM snack." },
  { short: "Tomorrow", user: "I'll start exercising tomorrow.", roast: "Tomorrow again? Your fitness plan has been stuck in customs since 2023. Give me five minutes today and we can stop filing missing-person reports.", action: "Start a 5-minute movement mission." },
  { short: "No time", user: "I have no time to work out.", roast: "Interesting. Your screen-time report just coughed nervously. Let's steal eight minutes back—no gym, no costume change, no epic montage.", action: "Try an 8-minute no-equipment circuit." },
] as const;

export const languages = [
  { code: "en", label: "English", roast: "Your excuse arrived early. Shame the workout didn't.", dir: "ltr" },
  { code: "zh", label: "简体中文", roast: "借口都热身完了，你还没开始？走，先动五分钟。", dir: "ltr" },
  { code: "yue", label: "廣東話", roast: "個藉口咁有力，不如借少少力行十分鐘啦。", dir: "ltr" },
  { code: "ar", label: "العربية", roast: "عذرك وصل قبلك. يلا، عشر دقائق حركة وبلا مسلسل أعذار.", dir: "rtl" },
  { code: "hi", label: "हिन्दी", roast: "बहाना तो समय पर आ गया, अब पाँच मिनट चल भी लो।", dir: "ltr" },
] as const;
