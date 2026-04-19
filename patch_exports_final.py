import re
with open('js/app.js', 'r') as f:
    content = f.read()

# Make sure all events are inside init(). Actually, they are inside init().
# The issue might be that triggerExportModal is defined OUTSIDE init(), or INSIDE init()?
# Let's check where it's defined.
