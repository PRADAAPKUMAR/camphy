"""Regression checks for delayed marking and cross-device history. No live backend writes."""
import asyncio
import base64
import importlib.util
import json
import os
import time
from pathlib import Path
from urllib.parse import urlparse

spec = importlib.util.spec_from_file_location("fixtures", Path(__file__).with_name("glass-ui-smoke.py"))
f = importlib.util.module_from_spec(spec)
spec.loader.exec_module(f)
BASE = os.environ.get("BROWSER_BASE_URL", f.BASE)

async def marking(browser, path):
    context = await browser.new_context(viewport={"width":1280, "height":900})
    ready = asyncio.Event()
    async def intercept(route):
        endpoint = urlparse(route.request.url).path
        if endpoint.endswith("/get-answer-key") or endpoint.endswith("/check-answer"):
            await ready.wait()
            payload = {"correct_answers":{"1":"A"}} if endpoint.endswith("/get-answer-key") else {"correct_answer":"A"}
            await route.fulfill(status=200, content_type="application/json", body=json.dumps(payload))
        else:
            await f.intercept(route)
    await context.route("**/*", intercept)
    page = await context.new_page()
    await page.goto(BASE + path, wait_until="domcontentloaded")
    await page.get_by_role("button", name="Question 1 option A", exact=True).click()
    await page.get_by_role("button", name="Finish now", exact=True).click()
    await page.get_by_text("Checking answers…", exact=True).first.wait_for()
    assert await page.evaluate("localStorage.getItem('physicshq:performance-history')") is None
    ready.set()
    await page.get_by_text("1/1", exact=True).first.wait_for()
    records = await page.evaluate("JSON.parse(localStorage.getItem('physicshq:performance-history'))")
    assert len(records) == 1 and records[0]["score"] == 1 and records[0]["questionResults"]["1"] is True
    await context.close()

async def failed_marking(browser):
    context = await browser.new_context()
    healthy = False
    async def intercept(route):
        endpoint = urlparse(route.request.url).path
        if endpoint.endswith("/get-answer-key") or endpoint.endswith("/check-answer"):
            if not healthy:
                await route.fulfill(status=503, content_type="application/json", body='{"error":"offline"}')
            else:
                await route.fulfill(status=200, content_type="application/json", body='{"correct_answer":"A","correct_answers":{"1":"A"}}')
        else:
            await f.intercept(route)
    await context.route("**/*", intercept)
    page = await context.new_page()
    await page.goto(BASE + "/question-mode/glass-paper?qs=1", wait_until="domcontentloaded")
    await page.get_by_role("button", name="Question 1 option A", exact=True).click()
    await page.get_by_role("button", name="Finish now", exact=True).click()
    await page.get_by_text("Answers could not be checked. No result was saved. Try finishing again.", exact=True).first.wait_for()
    assert await page.evaluate("localStorage.getItem('physicshq:performance-history')") is None
    healthy = True
    await page.get_by_role("button", name="Finish now", exact=True).click()
    await page.get_by_text("1/1", exact=True).first.wait_for()
    assert len(await page.evaluate("JSON.parse(localStorage.getItem('physicshq:performance-history'))")) == 1
    await context.close()

async def cloud_history(browser):
    context = await browser.new_context()
    record = {"paperId":"cloud-paper", "paperCode":"REMOTE-PAPER", "level":"IGCSE", "score":1,"totalQuestions":1,"percentage":100,"completedAt":"2026-10-19T00:00:00.000Z","attemptMode":"question"}
    reads = []
    async def intercept(route):
        url = urlparse(route.request.url)
        if url.path.endswith("/user_activity"):
            reads.append(url.query)
            await route.fulfill(status=200, content_type="application/json", body=json.dumps([{"payload":record}]))
        else:
            await f.intercept(route)
    await context.route("**/*", intercept)
    def encode(data):
        return base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip("=")
    token = encode({"alg":"HS256", "typ":"JWT"}) + "." + encode({"sub":"glass-user", "role":"authenticated", "exp":int(time.time())+3600}) + ".signature"
    session = {"access_token":token, "refresh_token":"mock-refresh", "token_type":"bearer", "expires_at":int(time.time())+3600, "expires_in":3600, "user":{"id":"glass-user","email":"test@example.invalid"}}
    await context.add_init_script("localStorage.setItem('sb-xnoqlggqrdwfrumibiak-auth-token', " + json.dumps(json.dumps(session)) + ")")
    page = await context.new_page()
    await page.goto(BASE + "/performance/igcse", wait_until="networkidle")
    await page.get_by_text("REMOTE-PAPER", exact=True).first.wait_for()
    assert reads and all("user_id=eq.glass-user" in query for query in reads)
    cache = await page.evaluate("JSON.parse(localStorage.getItem('physicshq:performance-history:glass-user'))")
    assert len(cache) == 1 and cache[0]["paperCode"] == "REMOTE-PAPER"
    await page.evaluate("async () => {const {supabase}=await import('/src/integrations/supabase/client.ts'); await supabase.auth.signOut({scope:'local'});}")
    await page.get_by_text("Your Physics performance dashboard is ready.", exact=True).wait_for()
    assert not await page.get_by_text("REMOTE-PAPER", exact=True).count()
    await context.close()

async def main():
    async with f.async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        await marking(browser, "/question-mode/glass-paper?qs=1")
        await marking(browser, "/topical-mcq/IGCSE/forces")
        await failed_marking(browser)
        await cloud_history(browser)
        print(json.dumps({"delayedPaperAndTopicalMarks":"passed","failedMarksAndRetry":"passed","cloudRestoration":"passed","logoutIsolation":"passed"}))
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
