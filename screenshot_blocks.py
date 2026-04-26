from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(2)

        # In js/app.js, it seems navigation might not have #tool-blocks ID, or it is different.
        # But Blocks is the default tool loaded. We can just randomize.

        # Test randomization to see all features
        for _ in range(3):
             # Try evaluating script to run randomization as an alternative
             page.evaluate("if(window.randomize) window.randomize();")
             time.sleep(1)

        page.screenshot(path="verification/blocks_updated.png", full_page=True)
        browser.close()

run()
