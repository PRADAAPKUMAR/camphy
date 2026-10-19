"""Question-mode entry points and retired PDF URLs; all remote requests are mocked."""
import asyncio
import importlib.util
import json
from pathlib import Path
from urllib.parse import parse_qs, urlparse

spec = importlib.util.spec_from_file_location("fixtures", Path(__file__).with_name("glass-ui-smoke.py"))
fixtures = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixtures)


async def intercept(route):
    request = route.request
    url = urlparse(request.url)
    if url.path.endswith("/sign-question-images") and request.post_data_json.get("paper_id") == "no-images":
        await route.fulfill(status=200, content_type="application/json", body='{"images":{}}')
    elif url.path.endswith("/topicwise_mcq_papers"):
        paper_id = parse_qs(url.query).get("id", [""])[0]
        if paper_id == "eq.missing-topic":
            await route.fulfill(status=404, content_type="application/json", body='{"message":"Not found"}')
        else:
            topic = "Unmapped legacy topic" if paper_id == "eq.unmapped-topic" else "Forces"
            await route.fulfill(status=200, content_type="application/json", body=json.dumps({"level":"IGCSE", "topic":topic}))
    else:
        await fixtures.intercept(route)


async def no_pdf(page):
    assert await page.locator("iframe").count() == 0
    assert await page.get_by_text("PDF exam", exact=True).count() == 0


async def main():
    async with fixtures.async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path="/usr/bin/chromium")
        context = await browser.new_context(viewport={"width":1440, "height":1000})
        await context.route("**/*", intercept)
        page = await context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        for width, height in [(1440, 1000), (390, 844)]:
            await page.set_viewport_size({"width":width, "height":height})
            await page.goto(fixtures.BASE + "/papers/IGCSE", wait_until="networkidle")
            await page.get_by_role("button", name="0625_s25_22", exact=False).click()
            await page.wait_for_url("**/question-mode/glass-paper")
            await page.get_by_role("img", name="Question 1", exact=True).wait_for()
            await no_pdf(page)
            await page.go_back(wait_until="networkidle")
            assert urlparse(page.url).path == "/papers/IGCSE"

            # Replace the old history entry and preserve retry parameters.
            await page.goto(fixtures.BASE + "/exam/glass-paper?qs=2", wait_until="networkidle")
            assert urlparse(page.url).path == "/question-mode/glass-paper"
            assert urlparse(page.url).query == "qs=2"
            await page.get_by_role("img", name="Question 2", exact=True).wait_for()
            await no_pdf(page)
            await page.go_back(wait_until="networkidle")
            assert urlparse(page.url).path == "/papers/IGCSE"

            await page.goto(fixtures.BASE + "/topic-practice/IGCSE", wait_until="networkidle")
            await page.get_by_role("button", name="Forces", exact=False).click()
            await page.wait_for_url("**/topical-mcq/IGCSE/forces")
            await page.get_by_role("img", name="Question 1", exact=True).wait_for()
            await no_pdf(page)

            await page.goto(fixtures.BASE + "/topic-exam/glass-topic-paper", wait_until="networkidle")
            assert urlparse(page.url).path == "/topical-mcq/IGCSE/forces"
            await no_pdf(page)
            await page.goto(fixtures.BASE + "/topic-exam/unmapped-topic", wait_until="networkidle")
            assert urlparse(page.url).path == "/topical-mcq/IGCSE"
            await no_pdf(page)
            await page.goto(fixtures.BASE + "/topic-exam/missing-topic", wait_until="networkidle")
            await page.get_by_role("link", name="Browse MCQ topics", exact=True).wait_for()
            await no_pdf(page)

            await page.goto(fixtures.BASE + "/question-mode/no-images", wait_until="networkidle")
            await page.get_by_role("heading", name="Question images are not available yet").wait_for()
            await page.keyboard.press("a")
            assert await page.locator("[data-answer-option]").count() == 0
            await no_pdf(page)
            await page.goto(fixtures.BASE + "/question-mode/glass-paper?qs=2,99", wait_until="networkidle")
            await page.get_by_role("button", name="Next question", exact=True).click()
            await page.get_by_text("No image uploaded for question 99 yet.", exact=True).wait_for()
            await page.keyboard.press("a")
            option = page.get_by_role("button", name="Question 99 option A", exact=True)
            assert await option.is_disabled()
            assert await option.get_attribute("aria-pressed") == "false"
            await page.keyboard.press("ArrowLeft")
            await page.get_by_role("img", name="Question 2", exact=True).wait_for()
            assert not await page.evaluate("document.documentElement.scrollWidth > innerWidth")

        # Theory keeps its PDF viewer.
        await page.goto(fixtures.BASE + "/topic-theory/glass-question", wait_until="networkidle")
        assert await page.locator("iframe").count() > 0
        assert not errors, errors
        print(json.dumps({"desktopAndMobile":"passed", "defaultQuestionMode":"passed", "legacyLinksAndBack":"passed", "topicalBank":"passed", "missingImages":"passed", "theoryPdfPreserved":"passed", "pageErrors":errors}))
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
