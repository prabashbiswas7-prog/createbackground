with open('js/app.js', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'document.getElementById(\'btn-export\')' in line:
        print(f"Line {i+1}: {line.strip()}")
    if 'function init()' in line:
        print(f"Line {i+1}: {line.strip()}")
