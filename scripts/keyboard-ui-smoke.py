"""Keyboard, tactile buttons, and real split-flap timer checks with isolated fixtures."""
import asyncio,importlib.util,json
from pathlib import Path
spec=importlib.util.spec_from_file_location('fixtures',str(Path(__file__).with_name('glass-ui-smoke.py')));f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f)
OUT=Path('/tmp/browser/keycaps');OUT.mkdir(parents=True,exist_ok=True)
async def main():
 async with f.async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium')
  c=await b.new_context(viewport={'width':1440,'height':1000});await c.route('**/*',f.intercept)
  page=await c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  for path in ['/exam/glass-paper','/question-mode/glass-paper','/topical-mcq/IGCSE/forces']:
   await page.goto(f.BASE+path,wait_until='networkidle')
   await page.get_by_role('button',name='Next question',exact=True).wait_for()
   assert await page.locator('iframe').count()==0
   assert await page.get_by_text('PDF exam',exact=True).count()==0
   await page.keyboard.press('a')
   first=page.get_by_role('button',name='Question 1 option A',exact=True)
   assert await first.get_attribute('aria-pressed')=='true'
   await page.keyboard.press('b');assert await page.get_by_role('button',name='Question 1 option B',exact=True).get_attribute('aria-pressed')=='false'
   if 'topical-mcq' not in path:
    await page.keyboard.press('ArrowRight');await page.keyboard.press('2')
    assert await page.get_by_role('button',name='Question 2 option B',exact=True).get_attribute('aria-pressed')=='true'
    await page.keyboard.press('ArrowLeft')
    await page.get_by_role('img',name='Question 1',exact=True).wait_for()
    next_button=page.get_by_role('button',name='Next question',exact=True)
    await next_button.focus();await page.keyboard.press('Space')
    await page.get_by_role('img',name='Question 2',exact=True).wait_for()
    await page.keyboard.press('ArrowLeft')
    # Hold a real pointer press: the key sinks onto its base before release.
    rect=await next_button.bounding_box();await page.mouse.move(rect['x']+rect['width']/2,rect['y']+rect['height']/2);await page.mouse.down();await page.wait_for_timeout(150)
    transform=await next_button.evaluate('e=>getComputedStyle(e).transform')
    assert transform!='none',transform
    await page.mouse.up()
   timer=page.get_by_role('timer',name='Elapsed time:',exact=False)
   initial=await timer.get_attribute('aria-label');await page.wait_for_timeout(1200)
   assert await timer.get_attribute('aria-label')!=initial
   await page.screenshot(path=str(OUT/(path.split('/')[1]+'.png')))
  await page.set_viewport_size({'width':390,'height':844});await page.goto(f.BASE+'/exam/glass-paper',wait_until='networkidle')
  assert '/question-mode/glass-paper' in page.url
  await page.keyboard.press('c')
  assert await page.get_by_role('button',name='Question 1 option C',exact=True).get_attribute('aria-pressed')=='true'
  await page.keyboard.press('ArrowRight');await page.keyboard.press('4')
  assert await page.get_by_role('button',name='Question 2 option D',exact=True).get_attribute('aria-pressed')=='true'
  assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth')
  await page.goto(f.BASE+'/study-tools',wait_until='networkidle')
  await page.get_by_role('button',name='Focus Mode',exact=True).click()
  await page.get_by_role('timer',name='Focus remaining:',exact=False).first.wait_for()
  await page.screenshot(path=str(OUT/'focus-mobile.png'),full_page=True)
  assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth')
  await page.emulate_media(reduced_motion='reduce')
  await page.get_by_role('button',name='Start',exact=True).click()
  await page.wait_for_timeout(1200)
  assert await page.locator('.split-flap__change').first.evaluate('e=>getComputedStyle(e).display')=='none'
  assert not errors,errors
  print(json.dumps({'keyboardQuestionModeAndTopical':'passed','legacyExamRedirect':'passed','keyboardMobile':'passed','lockedAnswers':'passed','nativeSpace':'passed','physicalPress':'passed','realTimerUpdates':'passed','focusLayout':'passed','pageErrors':errors}))
  await b.close()
if __name__ == "__main__":
 asyncio.run(main())
