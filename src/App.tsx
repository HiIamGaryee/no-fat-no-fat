import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { LandingPage } from "@/pages/LandingPage";
import { OnboardingPage } from "@/components/onboarding/OnboardingPage";
import { ProtectedRoute } from "@/components/profile/ProtectedRoute";
import { DashboardPage } from "@/pages/DashboardPage";
import { hasCompletedProfile } from "@/lib/storage";
import { ApplicationLayout } from "@/components/app/ApplicationLayout";
import { ProgressPage } from "@/pages/ProgressPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { ChatPage } from "@/pages/ChatPage";
import { ScaffoldPage } from "@/pages/ScaffoldPage";
const ToolsPage=lazy(()=>import("@/pages/tools/ToolsPage").then(module=>({default:module.ToolsPage})));
const MidnightFoodPage=lazy(()=>import("@/pages/tools/MidnightFoodPage").then(module=>({default:module.MidnightFoodPage})));
const ExcuseCourtPage=lazy(()=>import("@/pages/tools/ExcuseCourtPage").then(module=>({default:module.ExcuseCourtPage})));
const FoodDetectivePage=lazy(()=>import("@/pages/tools/FoodDetectivePage").then(module=>({default:module.FoodDetectivePage})));
const MovementRoulettePage=lazy(()=>import("@/pages/tools/MovementRoulettePage").then(module=>({default:module.MovementRoulettePage})));
const HabitAutopsyPage=lazy(()=>import("@/pages/tools/HabitAutopsyPage").then(module=>({default:module.HabitAutopsyPage})));
const EvidenceLabPage=lazy(()=>import("@/pages/tools/EvidenceLabPage").then(module=>({default:module.EvidenceLabPage})));

export default function App() {
  return <><Navbar /><Suspense fallback={<div className="grid min-h-screen place-items-center bg-cream font-display text-3xl">OPENING CASE FILE...</div>}><Routes><Route path="/" element={<LandingPage />} /><Route path="/onboarding" element={<OnboardingEntry/>}/><Route path="/app" element={<ProtectedRoute><ApplicationLayout/></ProtectedRoute>}><Route index element={<DashboardPage/>}/><Route path="chat" element={<ChatPage/>}/><Route path="tools" element={<ToolsPage/>}/><Route path="tools/midnight-food" element={<MidnightFoodPage/>}/><Route path="tools/excuse-court" element={<ExcuseCourtPage/>}/><Route path="tools/food-detective" element={<FoodDetectivePage/>}/><Route path="tools/movement-roulette" element={<MovementRoulettePage/>}/><Route path="tools/habit-autopsy" element={<HabitAutopsyPage/>}/><Route path="tools/evidence-lab" element={<EvidenceLabPage/>}/><Route path="progress" element={<ProgressPage/>}/><Route path="profile" element={<ProfilePage/>}/><Route path="settings" element={<SettingsPage/>}/></Route><Route path="*" element={<ScaffoldPage title="Page not found" phase="404" />} /></Routes></Suspense></>;
}

const OnboardingEntry=()=>{const [params]=useSearchParams();return hasCompletedProfile()&&params.get("edit")!=="1"?<Navigate to="/app" replace/>:<OnboardingPage/>;};
