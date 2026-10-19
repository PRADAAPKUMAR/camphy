import runpy
from playwright.async_api import BrowserType, Browser
original_launch = BrowserType.launch
original_context = Browser.new_context
async def launch(self, *args, **kwargs):
    kwargs.setdefault('executable_path', '/usr/bin/chromium')
    return await original_launch(self, *args, **kwargs)
async def context(self, *args, **kwargs):
    ctx=await original_context(self,*args,**kwargs)
    await ctx.route('**/rest/v1/**', lambda route: route.fulfill(status=200, content_type='application/json', body='[]'))
    return ctx
BrowserType.launch = launch
Browser.new_context = context
runpy.run_path('scripts/browser-smoke.py', run_name='__main__')
