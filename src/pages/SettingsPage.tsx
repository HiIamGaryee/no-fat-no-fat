import { useRef, useState, type ReactNode } from "react";
import { Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDataContext } from "@/components/app/AppDataContext";
import { useI18n } from "@/i18n/config";
import { translateUi } from "@/i18n/ui-translations";
import { deleteAllAppData, exportAppData, importAppData, loadSettings, resetProgress, saveProfile, saveSettings } from "@/lib/storage";
import type { Locale, RoastLevel } from "@/types/profile";
import { cn } from "@/lib/utils";

const languageOptions: [Locale,string][] = [["en","English"],["zh-CN","简体中文"],["yue-Hant","廣東話"],["ar-AE","العربية"],["hi-IN","हिन्दी"]];
const personalities: RoastLevel[] = ["sarcastic","savage","unhinged"];
const previews = { sarcastic:"Your plan is lovely. It would look even better in motion.", savage:"Your excuse brought a résumé. Still not hiring.", unhinged:"The emergency committee rejected your excuse unanimously." };

export const SettingsPage = () => {
  const { profile } = useAppDataContext();
  const { locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const [settings,setSettings] = useState(loadSettings);
  const [status,setStatus] = useState("");
  const chooseLocale = (next:Locale) => { setLocale(next); saveProfile({...profile,locale:next,updatedAt:new Date().toISOString()}); };
  const choosePersonality = (next:RoastLevel) => { saveProfile({...profile,roastLevel:next,updatedAt:new Date().toISOString()}); setStatus("Personality saved."); window.setTimeout(()=>window.location.reload(),500); };
  const updateSettings = (key:"reducedMotion"|"highReadability"|"memoryEnabled",value:boolean) => { const next={...settings,[key]:value}; setSettings(next); saveSettings(next); document.documentElement.classList.toggle("user-reduced-motion",next.reducedMotion); document.documentElement.classList.toggle("high-readability",next.highReadability); };
  const exportData = () => { const blob=new Blob([JSON.stringify(exportAppData(),null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const anchor=document.createElement("a"); anchor.href=url; anchor.download="no-fat-no-fat-data.json"; anchor.click(); URL.revokeObjectURL(url); };
  const importData = async (file?:File) => { if(!file)return; try { const value=JSON.parse(await file.text()); if(!importAppData(value))throw new Error(); setStatus("Import complete."); window.setTimeout(()=>window.location.reload(),600); } catch { setStatus("Import rejected. That file is not valid NO-FAT-NO-FAT data."); } };
  const confirm = (message:string) => window.confirm(translateUi(locale,message));

  return <div className="grid gap-6 xl:grid-cols-2">
    <Panel title="LANGUAGE"><div className="grid gap-2 sm:grid-cols-2">{languageOptions.map(([value,label])=><button key={value} onClick={()=>chooseLocale(value)} className={cn("min-h-12 border-2 border-ink px-3 text-start font-bold",locale===value?"bg-lime shadow-[4px_4px_0_var(--ink)]":"bg-white")}>{label}</button>)}</div></Panel>
    <Panel title="AI PERSONALITY"><div className="space-y-3">{personalities.map(item=><button key={item} onClick={()=>choosePersonality(item)} className={cn("w-full border-2 border-ink p-4 text-start",profile.roastLevel===item?"bg-pink shadow-[4px_4px_0_var(--ink)]":"bg-white")}><strong className="uppercase">{item}</strong><p className="mt-2 text-sm">“{previews[item]}”</p></button>)}</div></Panel>
    <Panel title="ACCESSIBILITY & MEMORY"><Toggle label="Reduce motion" checked={settings.reducedMotion} onChange={value=>updateSettings("reducedMotion",value)}/><Toggle label="High readability" checked={settings.highReadability} onChange={value=>updateSettings("highReadability",value)}/><Toggle label="Use verified local activity as AI memory" checked={settings.memoryEnabled} onChange={value=>updateSettings("memoryEnabled",value)}/></Panel>
    <Panel title="DATA MANAGEMENT"><div className="grid gap-3 sm:grid-cols-2"><button className="settings-action" onClick={exportData}><Download/>Export data</button><button className="settings-action" onClick={()=>input.current?.click()}><Upload/>Import data</button><input ref={input} className="hidden" type="file" accept="application/json" onChange={event=>importData(event.target.files?.[0])}/><button className="settings-action" onClick={()=>{if(confirm("Reset missions, XP, achievements, and tool activity? Your profile and chat stay.")){resetProgress();window.location.reload();}}}><RotateCcw/>Reset progress</button><button className="settings-action bg-orange" onClick={()=>{if(confirm("Delete all NO-FAT-NO-FAT data from this browser? This cannot be undone.")){deleteAllAppData();navigate("/onboarding",{replace:true});window.location.reload();}}}><Trash2/>Delete all data</button></div>{status&&<p role="status" className="mt-4 font-bold">{status}</p>}</Panel>
    <section className="border-2 border-ink bg-blue p-6 text-white xl:col-span-2"><h2 className="font-display text-3xl uppercase">PRIVACY, WITHOUT THE MYSTERY</h2><div className="mt-4 grid gap-4 text-sm leading-relaxed md:grid-cols-2"><p>Your profile, progress and chat history stay in this browser, do not automatically sync, and can disappear if site data is cleared. LocalStorage is not encrypted medical-record storage. The proxy does not keep a user-record database.</p><p>Only messages and the displayed minimal context are sent to Google's Gemini service when you invoke AI features. Gemini needs an internet connection. This is a general wellness tool, not medical advice.</p></div></section>
  </div>;
};

const Panel = ({title,children}:{title:string;children:ReactNode}) => <section className="border-2 border-ink bg-white p-5 shadow-[6px_6px_0_var(--ink)]"><h2 className="mb-5 font-display text-3xl uppercase">{title}</h2>{children}</section>;
const Toggle = ({label,checked,onChange}:{label:string;checked:boolean;onChange:(value:boolean)=>void}) => <label className="mb-3 flex min-h-14 items-center justify-between border-2 border-ink bg-cream p-3 font-bold">{label}<input className="h-6 w-6 accent-blue" type="checkbox" checked={checked} onChange={event=>onChange(event.target.checked)}/></label>;
