import re

with open('index.html', 'r') as f:
    content = f.read()

# Modify the full screen ad modal to be 50% in center
modal_fix = """<!-- Full Screen Ad Modal -->
<div id="full-ad-modal" class="modal-overlay" style="display: none;">
  <div class="modal-content" style="width: 50%; max-width: 800px; text-align: center;">
    <h3>Advertisement</h3>
    <div class="full-ad-slot" style="width: 100%; height: 400px; background: #222; margin: 20px 0; display: flex; align-items: center; justify-content: center; color: #888;">
        Full Screen Ad Space
    </div>"""

content = re.sub(r'<!-- Full Screen Ad Modal -->\n<div id="full-ad-modal" class="modal-overlay" style="display: none;">\n\s+<div class="modal-content" style="max-width: 600px; text-align: center;">\n\s+<h3>Advertisement</h3>\n\s+<div class="full-ad-slot" style="width: 100%; height: 400px; background: #222; margin: 20px 0; display: flex; align-items: center; justify-content: center; color: #888;">\n\s+Full Screen Ad Space\n\s+</div>', modal_fix, content)

with open('index.html', 'w') as f:
    f.write(content)
