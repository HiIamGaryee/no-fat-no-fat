import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasCompletedProfile } from "@/lib/storage";

export const EditorialButton = ({ to, children, variant = "default" }: { to: string; children: string; variant?: "default" | "ink" | "ghost" }) => (
  <Button asChild size="lg" variant={variant}><Link to={to === "/onboarding" && hasCompletedProfile() ? "/app" : to}>{children}<ArrowUpRight className="ml-2 h-5 w-5" /></Link></Button>
);
