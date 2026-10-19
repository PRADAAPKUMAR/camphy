"""Light/dark surfaces, saved preference, atom, and learning screens with isolated fixtures."""
import asyncio
import importlib.util
import json
import re
from pathlib import Path

spec = importlib.util.spec_from_file_location("classroom", Path(__file__).with_name("classroom-layout-smoke.py"))
classroom = importlib.util.module_from_spec(spec)
spec.loader.exec_module(classroom)
f = classroom.fixtures
OUT = Path("/tmp/browser/themes")
OUT.mkdir(parents=True, exist_ok=True)


async def switch_to(page, theme):
    if await page.locator("html").evaluate("(e, theme) => e.classList.contains(theme)", theme):
        return
    button = page.get_by_role("button", name=f"Switch to {theme} theme", exact=True)
    if not await button.count():
        await page.get_by_role("button", name="Open menu", exact=True).click()
    await button.click()
    await page.wait_for_function("theme => document.documentElement.classList.contains(theme)", arg=theme)
    close = page.get_by_role("button", name="Close menu", exact=True)
    if await close.count():
        await close.click()


async def accessible(page):
    await page.add_script_tag(path=str(Path("node_modules/axe-core/axe.min.js").resolve()))
    violations = await page.evaluate('async () => (await axe.run(document, {runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v => ({id:v.id,targets:v.nodes.map(n=>n.target)}))')
    assert not violations, (page.url, violations)


async def check(page, path, theme):
    await page.goto(f.BASE + path, wait_until="networkidle")
    await page.locator("#page-content").filter(has_text=re.compile(r"\S")).wait_for()
    assert await page.locator("html").evaluate("(e, theme) => e.classList.contains(theme)", theme)
    assert not await page.evaluate("document.documentElement.scrollWidth > innerWidth"), (theme, path)
    assert await page.locator(".physics-particles").count() == 0
    assert await page.get_by_role("button", name=re.compile("(Pause|Resume) background animation")).count() == 0
    assert not await page.get_by_text("PhysicsHQ could not open", exact=True).count()
    assert await page.evaluate("localStorage.getItem('physicshq:theme')") == theme


async def main():
    async with f.async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path="/usr/bin/chromium")
        context = await browser.new_context(viewport={"width":1440, "height":1000})
        await context.add_init_script("localStorage.setItem('physicshq:ambient-paused','true')")
        await context.route("**/*", classroom.intercept)
        page = await context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        await page.goto(f.BASE, wait_until="networkidle")
        assert await page.locator("html.dark").count() == 1
        atom = page.locator(".atom-orbit").first
        assert await atom.evaluate("e => getComputedStyle(e).animationIterationCount") == "infinite"
        before = await atom.evaluate("e => getComputedStyle(e).transform")
        await page.wait_for_timeout(150)
        assert before != await atom.evaluate("e => getComputedStyle(e).transform")
        paths = ["/", "/grade/igcse", "/grade/as", "/grade/a2", "/papers/IGCSE", "/auth", "/study-tools", "/performance/igcse", "/worksheet-generator/igcse", "/theory-topical/IGCSE", "/question-mode/glass-paper", "/topical-mcq/IGCSE/forces", "/classroom-quiz/igcse", "/topic-theory/glass-question", "/view-drive"]
        checks = 0
        for theme in ["light", "dark"]:
            await page.goto(f.BASE, wait_until="networkidle")
            await switch_to(page, theme)
            for path in paths:
                await check(page, path, theme)
                checks += 1
                if path in ["/", "/grade/igcse", "/grade/as", "/grade/a2", "/auth", "/study-tools"]:
                    await accessible(page)
                if path in ["/", "/auth", "/study-tools"]:
                    await page.screenshot(path=str(OUT / f"{theme}-{path.strip('/') or 'home'}.png"), full_page=True)
            # Marked answers and their progress chips keep readable state colors.
            await check(page, "/question-mode/glass-paper", theme)
            await page.get_by_role("button", name="Question 1 option A", exact=True).click()
            await accessible(page)
            await page.screenshot(path=str(OUT / f"{theme}-question.png"), full_page=True)
            await page.set_viewport_size({"width":390, "height":844})
            for path in ["/", "/grade/igcse", "/auth", "/study-tools", "/question-mode/glass-paper", "/classroom-quiz/igcse"]:
                await check(page, path, theme)
                checks += 1
            await page.screenshot(path=str(OUT / f"{theme}-mobile-quiz-setup.png"), full_page=True)
            await page.set_viewport_size({"width":1440, "height":1000})

        # Theme switching during a game preserves its live score and current question.
        await page.goto(f.BASE + "/classroom-quiz/igcse", wait_until="networkidle")
        await page.get_by_role("button", name="Start quiz", exact=True).click()
        await page.get_by_role("button", name="Team 1 option A", exact=True).click()
        await page.get_by_role("button", name="Team 2 option B", exact=True).click()
        await page.get_by_role("button", name="Next question", exact=True).wait_for()
        score = await page.get_by_role("region", name="Live leaderboard").inner_text()
        await switch_to(page, "light")
        assert score == await page.get_by_role("region", name="Live leaderboard").inner_text()
        await accessible(page)
        await page.screenshot(path=str(OUT / "light-classroom.png"))
        await page.set_viewport_size({"width":320, "height":720})
        assert not await page.evaluate("document.documentElement.scrollWidth > innerWidth")
        await page.goto(f.BASE, wait_until="networkidle")
        await switch_to(page, "dark")
        await switch_to(page, "light")
        await page.reload(wait_until="networkidle")
        assert await page.locator("html.light").count() == 1

        # The head bootstrap paints a stored light theme before the lazy app loads.
        early = await context.new_page()
        async def delayed_app(route):
            await asyncio.sleep(0.7)
            await route.continue_()
        await early.route("**/src/App.tsx*", delayed_app)
        await early.goto(f.BASE, wait_until="domcontentloaded")
        assert await early.locator("html.light").count() == 1
        await early.get_by_role("button", name="Switch to dark theme", exact=True).wait_for()
        await page.emulate_media(reduced_motion="reduce")
        assert await page.locator(".atom-orbit").first.evaluate("e => getComputedStyle(e).animationName") == "none"
        await page.emulate_media(forced_colors="active")
        assert await page.locator(".glass-atmosphere").evaluate("e => getComputedStyle(e).display") == "none"
        assert not errors, errors
        print(json.dumps({"routeThemeChecks":checks, "accessibility":"passed", "savedThemeAndEarlyPaint":"passed", "continuousAtom":"passed", "particlesAndPauseRemoved":"passed", "mobileSwitch":"passed", "gameStatePreserved":"passed", "pageErrors":errors}))
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
