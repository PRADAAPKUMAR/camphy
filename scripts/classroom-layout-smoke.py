"""Classroom quiz fixed controls, compact teams, pointer answers, and review; no live requests."""
import asyncio
import base64
import importlib.util
import json
from pathlib import Path
from urllib.parse import urlparse

spec = importlib.util.spec_from_file_location("fixtures", Path(__file__).with_name("glass-ui-smoke.py"))
fixtures = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixtures)
OUT = Path("/tmp/browser/classroom-layout")
OUT.mkdir(parents=True, exist_ok=True)
SVG = "data:image/svg+xml;base64," + base64.b64encode(b'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="3800"><rect width="800" height="3800" fill="white"/><text x="30" y="70" font-size="28">Synthetic long classroom question</text><text x="30" y="3650" font-size="28">End of question: A / B / C / D</text></svg>').decode()
ITEMS = [dict(worksheet_number=i, paper_id="fixture-paper", paper_code="0625_s25_22", year=2025, session="May/June", level="IGCSE", question_number=i, correct_answer="A", topic_id="forces", topic_name="Forces", image_url=SVG) for i in range(1, 11)]


async def intercept(route):
    if urlparse(route.request.url).path.endswith("/functions/v1/worksheet-questions"):
        await route.fulfill(status=200, content_type="application/json", body=json.dumps({"pool_size":10, "items":ITEMS, "excluded":[]}))
    else:
        await fixtures.intercept(route)


async def geometry(page):
    pane = page.get_by_role("region", name="Question content", exact=True)
    controls = page.get_by_role("complementary", name="Quiz controls", exact=True)
    scores = page.get_by_role("region", name="Live leaderboard", exact=True)
    nav = page.get_by_role("navigation", name="Quiz questions", exact=True)
    boxes = [await element.bounding_box() for element in [pane, controls, scores, nav]]
    question, right, top, bottom = boxes
    viewport = page.viewport_size
    assert right["x"] >= question["x"] + question["width"], boxes
    assert top["y"] + top["height"] <= question["y"], boxes
    assert bottom["y"] >= question["y"] + question["height"], boxes
    assert bottom["y"] + bottom["height"] <= viewport["height"] + 1, boxes
    assert not await page.evaluate("document.documentElement.scrollWidth > innerWidth"), boxes
    assert not await page.evaluate("document.documentElement.scrollHeight > innerHeight + 1"), boxes
    before = await page.get_by_role("timer").bounding_box()
    answer = page.get_by_role("button", name="Team 1 option A", exact=True)
    answer_before = await answer.bounding_box()
    await pane.hover()
    await page.mouse.wheel(0, 10000)
    await page.wait_for_timeout(300)
    assert await pane.evaluate("e => e.scrollTop") > 100
    after = await page.get_by_role("timer").bounding_box()
    answer_after = await answer.bounding_box()
    assert abs(before["y"] - after["y"]) < 1
    assert abs(answer_before["y"] - answer_after["y"]) < 1
    assert answer_after["y"] + answer_after["height"] <= viewport["height"]
    return pane


async def compact_teams(page, count):
    region = page.get_by_role("region", name="Team answers", exact=True)
    metrics = await region.evaluate("e => ({scroll:e.scrollHeight, height:e.clientHeight})")
    assert metrics["scroll"] <= metrics["height"] + 1, (page.viewport_size, metrics)
    assert await region.evaluate("e => e.scrollWidth <= e.clientWidth + 1")
    assert await region.evaluate("e => !['auto', 'scroll'].includes(getComputedStyle(e).overflowY)")
    bounds = await region.bounding_box()
    for i in range(1, count + 1):
        group = page.get_by_role("group", name=f"Team {i} answers", exact=True)
        assert await group.is_visible()
        for option in "ABCD":
            button = await group.get_by_role("button", name=f"Team {i} option {option}", exact=True).bounding_box()
            assert button["x"] >= bounds["x"] - 1
            assert button["y"] >= bounds["y"] - 1
            assert button["x"] + button["width"] <= bounds["x"] + bounds["width"] + 1
            assert button["y"] + button["height"] <= bounds["y"] + bounds["height"] + 1
    assert await page.locator("[aria-keyshortcuts]").count() == 0
    assert await page.get_by_label("Answering team", exact=True).count() == 0


async def no_shortcuts(page):
    await page.get_by_role("heading", name="Classroom Quiz", exact=True).click()
    active = page.get_by_role("navigation", name="Quiz questions").locator('[aria-current="step"]')
    question = await active.get_attribute("aria-label")
    selected = await page.locator('button[aria-pressed="true"]').count()
    for key in ["a", "b", "c", "d", "1", "2", "3", "4", "ArrowLeft", "ArrowRight", "Space"]:
        await page.keyboard.press(key)
    assert await active.get_attribute("aria-label") == question
    assert await page.locator('button[aria-pressed="true"]').count() == selected


async def main():
    async with fixtures.async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path="/usr/bin/chromium")
        context = await browser.new_context(viewport={"width":1440, "height":900})
        await context.add_init_script('''if (!sessionStorage.getItem("physicshq:study-timers")) sessionStorage.setItem("physicshq:study-timers", JSON.stringify({timers:[{id:"background",label:"Background timer",total:600,left:600,running:true,color:"study-1"}],savedAt:Date.now()}));''')
        await context.route("**/*", intercept)
        page = await context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        for width, height in [(1440, 900), (768, 800), (390, 844), (320, 720)]:
            await page.set_viewport_size({"width":width, "height":height})
            await page.goto(fixtures.BASE + "/classroom-quiz/igcse", wait_until="networkidle")
            await page.get_by_role("button", name="Start quiz", exact=True).click()
            await page.get_by_role("img", name="Question 1", exact=True).wait_for()
            pane = await geometry(page)
            await compact_teams(page, 2)
            await no_shortcuts(page)
            if width == 1440:
                await page.add_script_tag(path=str(Path("node_modules/axe-core/axe.min.js").resolve()))
                violations = await page.evaluate('async () => (await axe.run(document, {runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v => ({id:v.id,targets:v.nodes.map(n=>n.target)}))')
                assert not violations, violations
            await page.get_by_role("button", name="Team 1 option A", exact=True).click()
            await page.get_by_role("button", name="Team 2 option B", exact=True).click()
            await page.get_by_text("Correct answer: A", exact=True).wait_for()
            await compact_teams(page, 2)
            await no_shortcuts(page)
            assert await pane.evaluate("e => e.scrollTop") > 100
            leaderboard = page.get_by_role("region", name="Live leaderboard", exact=True)
            assert await leaderboard.locator("li").first.locator("strong").inner_text() != "0"
            assert await leaderboard.locator("li").nth(1).locator("strong").inner_text() == "0"
            await page.screenshot(path=str(OUT / f"quiz-{width}.png"))
            await page.get_by_role("button", name="Next question", exact=True).click()
            await page.get_by_role("img", name="Question 2", exact=True).wait_for()
            assert await pane.evaluate("e => e.scrollTop") == 0
            await no_shortcuts(page)
            await page.get_by_role("button", name="Go to question 1", exact=True).click()
            await page.get_by_text("Reviewing question 1 — timer paused", exact=True).wait_for()
            timer = page.get_by_role("timer")
            paused = await timer.get_attribute("aria-label")
            await page.wait_for_timeout(1200)
            assert await timer.get_attribute("aria-label") == paused
            assert await page.get_by_role("button", name="Team 2 option A", exact=True).is_disabled()
            await page.get_by_role("button", name="Back to live", exact=True).click()
            assert await page.get_by_role("button", name="Go to question 2", exact=True).get_attribute("aria-current") == "step"
            assert await page.get_by_role("button", name="Go to question 3", exact=True).is_disabled()
            await page.get_by_role("button", name="End quiz", exact=True).click()
            await page.get_by_role("button", name="Show results", exact=True).click()
            await page.get_by_role("heading", name="Team 1 wins!", exact=True).wait_for()

        # Every team and every option fits without a team scrollbar, including reveal.
        for width, height in [(1440, 768), (768, 800), (390, 844), (320, 720)]:
            await page.set_viewport_size({"width":width, "height":height})
            await page.goto(fixtures.BASE + "/classroom-quiz/as", wait_until="networkidle")
            for _ in range(4):
                await page.get_by_role("button", name="Add team", exact=True).click()
            await page.get_by_role("button", name="Start quiz", exact=True).click()
            await page.get_by_role("img", name="Question 1", exact=True).wait_for()
            await geometry(page)
            await compact_teams(page, 6)
            await no_shortcuts(page)
            await page.get_by_role("button", name="Team 6 option D", exact=True).click()
            assert await page.get_by_role("button", name="Team 6 option D", exact=True).get_attribute("aria-pressed") == "true"
            await page.get_by_role("button", name="End answering now", exact=True).click()
            await page.get_by_text("Correct answer: A", exact=True).wait_for()
            await compact_teams(page, 6)
            assert await page.get_by_role("timer").is_visible()
            await page.screenshot(path=str(OUT / f"quiz-six-teams-{width}.png"))
        await page.goto(fixtures.BASE + "/grade/as", wait_until="networkidle")
        await page.get_by_role("timer", name="Background timer remaining:", exact=False).wait_for()
        assert not errors, errors
        print(json.dumps({"viewports":4, "fixedRightControls":"passed", "topScoreboard":"passed", "bottomQuestionNavigation":"passed", "scoringAndReview":"passed", "sixTeamsWithoutScrolling":"passed", "noCustomShortcuts":"passed", "accessibility":"passed", "backgroundTimerPreserved":"passed", "pageErrors":errors}))
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
