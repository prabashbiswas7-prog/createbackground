from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("https://studio.neato.fun/blocks", wait_until="domcontentloaded")
        time.sleep(5)
        page.screenshot(path="neato_blocks.png", full_page=True)
        browser.close()

run()
