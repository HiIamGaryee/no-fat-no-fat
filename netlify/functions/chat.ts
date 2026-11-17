import chatHandler from "../../api/chat.js";

interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string,string|undefined>;
  body: string|null;
}

interface NetlifyResult {
  statusCode: number;
  headers: Record<string,string>;
  body: string;
}

export const handler = async (event:NetlifyEvent):Promise<NetlifyResult> => {
  if(event.httpMethod!=="POST")return {statusCode:405,headers:{"Content-Type":"application/json; charset=utf-8","Allow":"POST"},body:JSON.stringify({error:"Method not allowed."})};
  let body:unknown;
  try{body=JSON.parse(event.body??"");}catch{return {statusCode:400,headers:{"Content-Type":"application/json; charset=utf-8"},body:JSON.stringify({error:"Invalid JSON."})};}
  let statusCode=200;
  let responseBody="";
  const headers:Record<string,string>={};
  const response={
    status(code:number){statusCode=code;return response;},
    setHeader(name:string,value:string){headers[name]=value;},
    json(value:unknown){responseBody=JSON.stringify(value);},
  };
  await chatHandler({method:event.httpMethod,headers:event.headers,body,socket:{remoteAddress:event.headers["x-forwarded-for"]}},response);
  return {statusCode,headers,body:responseBody};
};
