import re

with open('js/app.js', 'r') as f:
    content = f.read()

# Fix the bug where noise tools overwrite the stops on every render in schedRender / bindSection
# We should give users a way to actually modify stops, or just let them define the stops if we want middle colors to work.
# Actually the easiest fix without adding whole new UI for stops is to simply remove the hardcoded overrides in `schedRender` and `bindSection`
# OR adjust them so they only update the specific start/end stops instead of resetting the whole array.
# The user issue stated: "In some tools controllers not working properly. find and fix"

fix_bind = """
      // Update noise stops
      if (tool === 'noise') {
        if (!p.stops) p.stops = [[0, '#050505'], [0.5, '#003a0f'], [1, '#00ff41']];
        p.stops[0][1] = p.c1 || p.stops[0][1];
        p.stops[2][1] = p.c2 || p.stops[2][1];
      }
      if (tool === 'waves') {
        if (!p.stops) p.stops = [[0, '#0e4d68'], [0.5, '#1a9e8c'], [1, '#64dfb8']];
        p.stops[0][1] = p.c1 || p.stops[0][1];
        p.stops[2][1] = p.c2 || p.stops[2][1];
      }
"""
content = re.sub(r'// Update noise stops\n\s+if \(tool === \'noise\'\) \{\n\s+p\.stops = \[\[0, p\.c1\|\|\'#050505\'\],\[0\.5,\'#003a0f\'\],\[1, p\.c2\|\|\'#00ff41\'\]\];\n\s+\}', fix_bind, content)


fix_render = """
    // Update noise stops when colors change
    if (current === 'noise') {
        if (!p.stops) p.stops = [[0, '#050505'], [0.5, '#003a0f'], [1, '#00ff41']];
        p.stops[0][1] = p.c1 || p.stops[0][1];
        p.stops[2][1] = p.c2 || p.stops[2][1];
    }
    if (current === 'waves') {
        if (!p.stops) p.stops = [[0, '#0e4d68'], [0.5, '#1a9e8c'], [1, '#64dfb8']];
        p.stops[0][1] = p.c1 || p.stops[0][1];
        p.stops[2][1] = p.c2 || p.stops[2][1];
    }
"""
content = re.sub(r'// Update noise stops when colors change\n\s+if \(current === \'noise\'\) \{\n\s+p\.stops = \[\[0, p\.c1\|\|\'#050505\'\],\[0\.5,\'#003a0f\'\],\[1, p\.c2\|\|\'#00ff41\'\]\];\n\s+\}\n\s+if \(current === \'waves\'\) \{\n\s+p\.stops = \[\[0, p\.c1\|\|\'#0e4d68\'\],\[0\.5,\'#1a9e8c\'\],\[1, p\.c2\|\|\'#64dfb8\'\]\];\n\s+\}', fix_render, content)

with open('js/app.js', 'w') as f:
    f.write(content)
