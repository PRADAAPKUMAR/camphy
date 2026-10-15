// @vitest-environment node
import { readFileSync } from "node:fs";
import { Script, createContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// Execute the actual edge handler against isolated data; no backend access.
async function select(body: Record<string, unknown>) {
  let handler: (request: Request) => Promise<Response>;
  const tables: Record<string, unknown[]> = {
    papers: [{id:"paper",level:"IGCSE",paper_code:"0625/22",year:2025,session:"May/June"}],
    question_images: [1,2,3].map((n) => ({paper_id:"paper",question_number:n,storage_path:`q${n}.jpg`})),
    answer_keys: [{paper_id:"paper",q1:"A",q2:"B",q3:"C"}],
    question_topic_mapping: [1,2,3].map((n) => ({paper_id:"paper",question_number:n,syllabus_topic_id:n===3?"other":"topic",mapping_type:"primary",verified:true})),
    syllabus_topics: [{id:"topic",topic_name:"Waves",topic_code:"1"},{id:"other",topic_name:"Forces",topic_code:"2"}],
  };
  const client = {from(table: string) {
    let rows=tables[table]??[];
    const chain={select:()=>chain,order:()=>chain,eq:(key:string,value:unknown)=>{rows=rows.filter((row)=>row[key as keyof typeof row]===value);return chain;},
      in:(key:string,values:unknown[])=>{rows=rows.filter((row)=>values.includes(row[key as keyof typeof row]));return chain;},
      range:(from:number,to:number)=>{rows=rows.slice(from,to+1);return chain;},
      then:(resolve:(value:unknown)=>void)=>resolve({data:rows,error:null})};
    return chain;
  },storage:{from:()=>({createSignedUrls:async(paths:string[])=>({data:paths.map((path)=>({path,signedUrl:`https://example.invalid/${path}`})),error:null})})}};
  const context=createContext({Request,Response,console,fetch:()=>{throw new Error("Unexpected network access");},Deno:{env:{get:()=>"test-only"},serve:(fn:typeof handler)=>{handler=fn;}},exports:{},require:()=>({createClient:()=>client})});
  const code=ts.transpileModule(readFileSync('supabase/functions/worksheet-questions/index.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Script(code).runInContext(context);
  const response=await handler!(new Request('http://localhost/test',{method:'POST',body:JSON.stringify({level:'IGCSE',count:1,shuffle:true,...body})}));
  expect(response.status).toBe(200);
  return response.json();
}
describe("worksheet replacement selection",()=>{
  it("excludes every current question before random sampling",async()=>{
    const result=await select({source:'random',exclude_refs:[{paper_id:'paper',question_number:1},{paper_id:'paper',question_number:2}]});
    expect(result.pool_size).toBe(1);expect(result.items.map((item:{question_number:number})=>item.question_number)).toEqual([3]);
  });
  it("keeps topical and mistake constraints and returns an empty pool when exhausted",async()=>{
    const exclude_refs=[{paper_id:'paper',question_number:1},{paper_id:'paper',question_number:2}];
    const topical=await select({source:'topic',topic_ids:['topic'],exclude_refs});
    expect(topical.items).toEqual([]);
    const mistakes=await select({source:'mistakes',refs:[{paper_id:'paper',question_number:1}],exclude_refs});
    expect(mistakes.items).toEqual([]);
  });
});
