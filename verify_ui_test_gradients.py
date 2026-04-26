from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})

        # Open the local server
        page.goto('http://localhost:3000')
        page.wait_for_timeout(1000)

        # Click Gradients tool
        page.click('text="Gradients"')
        page.wait_for_timeout(1000)

        # We can just change the color swatch directly, it will auto-switch to Custom
        page.evaluate('''() => {
            const el = document.querySelectorAll('input[type="color"]')[0];
            el.value = '#ff0000'; // Set it to red
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }''')

        page.wait_for_timeout(1000)

        # Save a screenshot to verify
        page.screenshot(path='verification/verification_test_gradients_red.png')

        print("Test complete. Saved verification_test_gradients_red.png")
        browser.close()

if __name__ == '__main__':
    run()
