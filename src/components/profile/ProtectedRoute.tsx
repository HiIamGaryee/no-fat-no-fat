import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { hasCompletedProfile } from "@/lib/storage";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => { const location=useLocation(); return hasCompletedProfile()?children:<Navigate to="/onboarding" replace state={{from:location.pathname}}/>; };
