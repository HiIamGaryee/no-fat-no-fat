import { createContext, useContext, type ReactNode } from "react";
import { useAppData } from "@/hooks/use-app-data";

type AppData=ReturnType<typeof useAppData>;
const Context=createContext<AppData|null>(null);
export const AppDataProvider=({children}:{children:ReactNode})=><Context.Provider value={useAppData()}>{children}</Context.Provider>;
export const useAppDataContext=()=>{const value=useContext(Context);if(!value)throw new Error("AppDataProvider missing");return value;};
