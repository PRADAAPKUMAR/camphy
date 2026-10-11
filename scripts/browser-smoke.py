"""Browser checks against the running preview. All submissions are intercepted; no live data writes."""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path('/tmp/browser/physicshq-smoke')
OUT.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        summary = []
        for path in ['/', '/auth', '/about', '/grade/igcse', '/papers/IGCSE', '/forgot-password', '/reset-password', '/admin/upload']:
            await page.goto('http://localhost:8080' + path, wait_until='networkidle')
            await page.reload(wait_until='networkidle')
            await page.add_script_tag(path=str(Path('node_modules/axe-core/axe.min.js').resolve()))
            violations = await page.evaluate('async () => (await axe.run(document, {runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v => ({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}))')
            assert not violations, f'{path}: {violations}'
            assert await page.locator('#page-content').inner_text(), path
            assert await page.locator('link[rel="canonical"]').count() == 1
            await page.screenshot(path=str(OUT / (path.strip('/').replace('/', '-') or 'home')).replace('smoke/', 'smoke/') + '.png')
            summary.append({'path': path, 'accessibilityViolations': 0, 'deepLinkRefresh': 'passed'})
        assert 'Sign in' in await page.locator('#page-content').inner_text()
        await page.goto('http://localhost:8080/auth', wait_until='networkidle')
        await page.route('**/auth/v1/token**', lambda route: route.fulfill(status=400, content_type='application/json', body=json.dumps({'error':'invalid_grant','error_description':'Invalid login credentials'})))
        await page.get_by_label('Email', exact=True).fill('browser-test@example.invalid')
        await page.get_by_label('Password', exact=True).fill('not-a-real-password')
        await page.get_by_role('button', name='Show password').click()
        assert await page.get_by_label('Password', exact=True).get_attribute('type') == 'text'
        await page.get_by_role('button', name='Sign in', exact=True).click()
        await page.get_by_text('Invalid login credentials', exact=True).wait_for()
        await page.screenshot(path=str(OUT / 'login-error.png'))
        await page.route('**/auth/v1/recover**', lambda route: route.fulfill(status=200, content_type='application/json', body='{}'))
        await page.goto('http://localhost:8080/forgot-password', wait_until='networkidle')
        await page.get_by_label('Email', exact=True).fill('browser-test@example.invalid')
        await page.get_by_role('button', name='Send reset link').click()
        await page.get_by_text('If that account exists, a reset link is on its way', exact=True).wait_for()
        # A synthetic paper and intercepted scoring keep this flow independent of live writes.
        async def paper_response(route):
            await route.fulfill(status=200, content_type='application/json', body=json.dumps({'id':'smoke-paper','level':'IGCSE','paper_code':'SMOKE','year':2025,'session':'May/June','pdf_url':'about:blank'}))
        await page.route('**/rest/v1/papers?*', paper_response)
        await page.route('**/functions/v1/get-answer-key', lambda route: route.fulfill(status=200, content_type='application/json', body=json.dumps({'total_questions':40,'correct_answers':{'1':'A','2':'B'}})))
        await page.route('**/functions/v1/submit-exam', lambda route: route.fulfill(status=200, content_type='application/json', body=json.dumps({'score':1,'total_questions':40,'correct_answers':{'1':'A'}})))
        await page.goto('http://localhost:8080/exam/smoke-paper', wait_until='networkidle')
        await page.get_by_role('button', name='Question 1, option A', exact=True).click()
        assert await page.get_by_role('button', name='Question 1, option B', exact=True).is_disabled()
        await page.get_by_role('button', name='Submit Answers').click()
        await page.get_by_text('1/40', exact=True).first.wait_for()
        await page.screenshot(path=str(OUT / 'exam-results.png'))
        await page.set_viewport_size({'width':390,'height':844})
        for path in ['/', '/auth', '/grade/igcse']:
            await page.goto('http://localhost:8080' + path, wait_until='networkidle')
            assert not await page.evaluate('document.documentElement.scrollWidth > innerWidth'), path
            await page.screenshot(path=str(OUT / ('mobile-' + (path.strip('/').replace('/','-') or 'home') + '.png')))
        await page.get_by_role('button', name='Open menu').click()
        assert await page.get_by_role('button', name='Close menu').get_attribute('aria-expanded') == 'true'
        assert not errors, errors
        print(json.dumps({'pages':summary,'mobileOverflow':False,'loginError':'passed','resetRequest':'mocked, passed','examAnswerLockAndResults':'mocked, passed','pageErrors':errors}, indent=2))
        await browser.close()

asyncio.run(main())