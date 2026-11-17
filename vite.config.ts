import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import chatHandler from "./api/chat";

const localApi = ():Plugin=>({name:"local-chat-api",configureServer(server){server.middlewares.use("/api/chat",(request,response)=>{if(request.method!=="POST"){response.statusCode=405;response.end(JSON.stringify({error:"Method not allowed."}));return;}let raw="";request.on("data",chunk=>{raw+=String(chunk);if(raw.length>100000)request.destroy();});request.on("end",async()=>{let body:unknown;try{body=JSON.parse(raw);}catch{response.statusCode=400;response.end(JSON.stringify({error:"Invalid JSON."}));return;}const adapter={status(code:number){response.statusCode=code;return adapter;},setHeader(name:string,value:string){response.setHeader(name,value);},json(value:unknown){response.end(JSON.stringify(value));}};await chatHandler(Object.assign(request,{body}),adapter);});});}});

export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),"");
  if(env.GEMINI_API_KEY)process.env.GEMINI_API_KEY=env.GEMINI_API_KEY;
  if(env.GEMINI_MODEL)process.env.GEMINI_MODEL=env.GEMINI_MODEL;
  return {plugins:[react(),localApi()],resolve:{alias:{"@":path.resolve(__dirname,"./src")}},build:{rollupOptions:{output:{manualChunks(id){if(id.includes("node_modules/motion"))return "motion";if(id.includes("node_modules/lucide-react"))return "icons";}}}},test:{environment:"jsdom",setupFiles:"./src/test/setup.ts",restoreMocks:true}};
});
