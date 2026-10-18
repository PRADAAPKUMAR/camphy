"""Route-wide visual regression checks. All non-local requests are intercepted."""
import asyncio, base64, json, re
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright

BASE='http://127.0.0.1:8080'
OUT=Path('/tmp/browser/glass-ui'); OUT.mkdir(parents=True, exist_ok=True)
PAPER={'id':'glass-paper','level':'IGCSE','paper_code':'0625_s25_22','session':'May/June','year':2025,'pdf_url':'about:blank','total_questions':40,'subject':'Physics','topic':'Forces'}
TOPIC={'id':'glass-topic','syllabus_version_id':'glass-version','topic_code':'1','topic_name':'Forces','parent_topic_id':None,'display_order':1,'is_active':True,'level':'IGCSE'}
SVG='data:image/svg+xml;base64,'+base64.b64encode(b'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="140"><rect width="640" height="140" fill="white"/><text x="24" y="50" fill="black" font-size="22">1. What is the SI unit of force?</text><text x="24" y="100" fill="black" font-size="18">A newton   B joule   C watt   D pascal</text></svg>').decode()
TABLES={
 'papers':[PAPER], 'theory_papers':[dict(PAPER,total_questions=1)],
 'study_materials':[{'id':'glass-material','level':'IGCSE','title':'Revision notes','subject':'Physics','file_type':'pdf','file_url':'about:blank','folder_path':'Revision','description':'Forces and motion'}],
 'topicwise_mcq_papers':[dict(PAPER,id='glass-topic-paper')],
 'topicwise_theory_questions':[dict(PAPER,id='glass-question',question_pdf_url='about:blank',answer_pdf_url='about:blank',question_number=1)],
 'syllabus_versions':[{'id':'glass-version','syllabus_code':'0625','syllabus_version':'2026-2028','is_current':True}],
 'syllabus_topics':[TOPIC],
 'question_topic_mapping':[{'paper_id':PAPER['id'],'question_number':1,'syllabus_topic_id':TOPIC['id'],'verified':True,'mapping_type':'primary','papers':PAPER}],
 'question_images':[{'paper_id':PAPER['id'],'question_number':1}],
}
PROFILE={'id':'glass-user','display_name':'Test Learner','full_name':'Test Learner','account_type':'teacher','grade':'igcse','school':'Test school','country':'India','avatar_url':None,'preferences':{},'usage_summary':{},'setup_completed':True}

async def intercept(route):
 req=route.request; url=urlparse(req.url)
 if url.hostname in ['127.0.0.1','localhost']:
  await route.continue_(); return
 payload={}
 if '/rest/v1/rpc/' in url.path: payload={}
 elif '/rest/v1/' in url.path:
  table=url.path.split('/rest/v1/')[1]; rows=TABLES.get(table,[])
  payload=rows[0] if rows and 'vnd.pgrst.object' in req.headers.get('accept','') else rows
 elif '/functions/v1/' in url.path:
  function=url.path.rsplit('/',1)[-1]
  payload={
   'get-answer-key':{'total_questions':40,'correct_answers':{'1':'A'}},
   'sign-question-images':{'images':{'1':SVG}},
   'account-bootstrap':{'profile':PROFILE,'role':'admin'},
   'admin-table-editor':{'tables':[],'rows':[]},
   'admin-theory':{'papers':[]},
   'get-theory-paper':{'paper':dict(PAPER,total_questions=1),'question_url':None,'answer_url':None,'explanations':[]},
   'get-theory-topical':{'topics':[TOPIC],'questions':[]},
   'worksheet-questions':{'questions':[]},
  }.get(function,{})
 elif '/auth/v1/' in url.path: payload={'user':{'id':'glass-user','email':'test@example.invalid'}}
 else:
  await route.abort(); return
 await route.fulfill(status=200,content_type='application/json',headers={'content-range':'0-0/1'},body=json.dumps(payload))

ROUTES=[
 '/', '/grade/igcse','/grade/as','/grade/a2','/papers/IGCSE','/papers/AS%20LEVEL',
 '/theory-papers/IGCSE','/theory-papers/A2%20Level','/materials/IGCSE',
 '/topic-practice/IGCSE','/topical-mcq','/topical-mcq/IGCSE','/topical-mcq/IGCSE/forces',
 '/worksheet-generator/igcse','/worksheet-generator/as','/theory-topical/IGCSE',
 '/classroom-quiz/igcse','/performance/igcse','/study-tools','/about','/auth',
 '/forgot-password','/reset-password','/auth/callback','/profile','/admin/upload',
 '/exam/glass-paper','/question-mode/glass-paper','/topic-exam/glass-topic-paper',
 '/theory-paper/glass-paper','/topic-theory/glass-question','/view-drive','/missing-page',
 '/index','/papers','/theory-papers','/materials','/topic-practice','/worksheet-generator','/performance',
]
MOBILE=['/','/grade/igcse','/grade/as','/grade/a2','/papers/IGCSE','/theory-topical/IGCSE','/study-tools','/worksheet-generator/igcse','/performance/igcse','/auth','/exam/glass-paper','/question-mode/glass-paper']

async def check(page,path,label):
 await page.goto(BASE+path,wait_until='networkidle')
 await page.locator('#page-content').filter(has_text=re.compile(r'\S')).wait_for(timeout=10000)
 await page.wait_for_function("!document.getElementById('page-content').getAnimations().length")
 assert await page.locator('.glass-app').count()==1,path
 assert not await page.evaluate('document.documentElement.scrollWidth > innerWidth'),f'overflow: {label} {path}'
 assert not await page.get_by_text('PhysicsHQ could not open',exact=True).count(),path
 if path in ['/','/grade/igcse','/auth','/study-tools','/theory-topical/IGCSE','/exam/glass-paper']:
  await page.screenshot(path=str(OUT/(label+'-'+(path.strip('/').replace('/','-') or 'home')+'.png')),full_page=True)
 print(json.dumps({'viewport':label,'path':path,'render':'passed'}),flush=True)

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium')
  context=await browser.new_context(viewport={'width':1440,'height':1000})
  await context.route('**/*',intercept)
  errors=[]; page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  for path in ROUTES: await check(page,path,'desktop')
  await page.set_viewport_size({'width':390,'height':844})
  for path in MOBILE: await check(page,path,'mobile')
  await page.set_viewport_size({'width':320,'height':720})
  for path in ['/','/grade/as','/auth']:await check(page,path,'narrow')
  await page.emulate_media(reduced_motion='reduce')
  await page.goto(BASE+'/grade/igcse',wait_until='networkidle')
  await page.locator('.grade-tile').first.hover()
  assert await page.locator('.grade-tile').first.evaluate('e=>getComputedStyle(e).transform')=='none'
  assert await page.locator('.glass-icon__face').first.evaluate('e=>getComputedStyle(e).transform')=='none'
  await page.emulate_media(forced_colors='active')
  assert await page.locator('.glass-atmosphere').evaluate('e=>getComputedStyle(e).display')=='none'
  await page.goto(BASE+'/auth',wait_until='networkidle')
  assert await page.locator('#email').evaluate('e=>getComputedStyle(e).boxShadow')=='none'
  assert not errors,errors
  print(json.dumps({'checks':len(ROUTES)+len(MOBILE)+3,'reducedMotion':'passed','forcedColors':'passed','pageErrors':errors}),flush=True)
  await browser.close()

if __name__ == "__main__":
 asyncio.run(main())
