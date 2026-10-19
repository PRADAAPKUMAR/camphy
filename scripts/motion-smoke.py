"""Continuous atom and tile navigation regression checks using intercepted backend fixtures."""
import asyncio,importlib.util,json
from pathlib import Path
spec=importlib.util.spec_from_file_location('fixtures',str(Path(__file__).with_name('glass-ui-smoke.py')));f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f)
OUT=Path('/tmp/browser/motion');OUT.mkdir(parents=True,exist_ok=True)
async def idle(page):
 await page.wait_for_function("!document.querySelector('.tile-route-snapshot') && !document.documentElement.hasAttribute('data-tile-transition')")
async def main():
 async with f.async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium')
  c=await b.new_context(viewport={'width':1440,'height':1000})
  await c.route('**/*',f.intercept)
  page=await c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(f.BASE,wait_until='networkidle')
  assert await page.locator('.atom-orbit').first.evaluate('e=>getComputedStyle(e).animationIterationCount')=='infinite'
  assert await page.locator('.physics-particles').count()==0
  assert await page.get_by_role('button',name='Pause background animation',exact=True).count()==0
  await page.locator('[data-tile-to="/grade/igcse"]').click()
  await page.wait_for_url('**/grade/igcse')
  assert await page.locator('.tile-route-panel').count()==1
  await page.screenshot(path=str(OUT/'forward.png'))
  await idle(page)
  assert await page.locator('.tile-route-snapshot').count()==0
  await page.get_by_role('button',name='MCQ Past Papers',exact=False).click()
  await page.wait_for_url('**/papers/IGCSE');await idle(page)
  await page.go_back(wait_until='domcontentloaded')
  await page.wait_for_url('**/grade/igcse')
  assert await page.locator('.tile-route-snapshot[data-direction="back"]').count()==1
  await page.screenshot(path=str(OUT/'back.png'));await idle(page)
  # Explicit parent links reverse too, then browser Forward replays expansion.
  await page.get_by_role('link',name='All grades',exact=True).click()
  await page.wait_for_url(f.BASE+'/');assert await page.locator('[data-direction="back"]').count()==1;await idle(page)
  await page.go_back(wait_until='domcontentloaded');await idle(page)
  await page.go_forward(wait_until='domcontentloaded');await idle(page)
  # At a scrolled home page the old tile position and parent scroll are restored.
  await page.locator('[data-tile-to="/grade/as"]').scroll_into_view_if_needed()
  old_scroll=await page.evaluate('scrollY')
  await page.locator('[data-tile-to="/grade/as"]').click();await page.wait_for_url('**/grade/as');await idle(page)
  await page.go_back(wait_until='domcontentloaded');await idle(page)
  assert abs(await page.evaluate('scrollY')-old_scroll)<2
  # Reduced motion still suppresses atom orbits and tile morphs.
  await page.emulate_media(reduced_motion='reduce')
  await page.locator('[data-tile-to="/grade/a2"]').click();await page.wait_for_url('**/grade/a2')
  assert await page.locator('.tile-route-snapshot').count()==0
  assert await page.locator('.physics-particles').count()==0
  await page.emulate_media(reduced_motion='no-preference')
  # Narrow navigation and touch-like tiles still fit the viewport.
  await page.set_viewport_size({'width':320,'height':720});await page.goto(f.BASE,wait_until='networkidle')
  assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth')
  await page.get_by_role('button',name='Open menu').click()
  assert await page.get_by_role('button',name='Pause background animation',exact=True).count()==0
  await page.get_by_role('button',name='Close menu').click()
  await page.locator('[data-tile-to="/grade/igcse"]').click();await page.wait_for_url('**/grade/igcse');await idle(page)
  assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth')
  # Navigation commits while an uncached lazy page is still downloading.
  probe_context=await b.new_context(viewport={'width':1440,'height':1000})
  await probe_context.route('**/*',f.intercept)
  probe=await probe_context.new_page();probe.on('pageerror',lambda e:errors.append(str(e)))
  async def slow_chunk(route):
   await asyncio.sleep(1)
   await route.continue_()
  await probe.route('**/src/pages/GradeDashboardPage.tsx*',slow_chunk)
  await probe.goto(f.BASE,wait_until='networkidle')
  await probe.locator('[data-tile-to="/grade/igcse"]').evaluate('e=>e.click()')
  await probe.wait_for_url('**/grade/igcse')
  assert await probe.get_by_role('heading',name='IGCSE Physics',exact=True).count()==0
  assert await probe.locator('.tile-route-panel').count()==1
  await probe.keyboard.press('Escape');await idle(probe)
  await probe.get_by_role('heading',name='IGCSE Physics',exact=True).wait_for()
  assert await probe.locator('.glass-app').evaluate('e=>e.style.clipPath')==''
  assert not errors,errors
  print(json.dumps({'continuousAtom':'passed','particlesRemoved':'passed','forwardAndBack':'passed','scrollRestoration':'passed','pauseControlRemovedAndReducedMotion':'passed','mobile':'passed','concurrentLoadingAndInterruption':'passed','pageErrors':errors}))
  await b.close()
if __name__ == "__main__":
 asyncio.run(main())
