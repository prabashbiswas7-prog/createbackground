import re

with open('js/app.js', 'r') as f:
    content = f.read()

speed_patch = """function schedRender(delay=10) {
  if (renderTimer) cancelAnimationFrame(renderTimer);
  renderTimer = requestAnimationFrame(() => setTimeout(doRender, delay));
}"""
content = re.sub(r'function schedRender\(delay=80\) \{\n\s+if \(renderTimer\) clearTimeout\(renderTimer\);\n\s+renderTimer = setTimeout\(doRender, delay\);\n\}', speed_patch, content)

with open('js/app.js', 'w') as f:
    f.write(content)
