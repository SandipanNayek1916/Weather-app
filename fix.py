import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

def replacer(m):
    tag = m.group(1).strip()
    props_str = m.group(2)
    
    if tag in ["'div'", '"div"', "'article'", '"article"', "'section'", '"section"']:
        new_props = props_str.replace('glass-card', '')
        return f'el(PixelCard, {{ {new_props} }}'
    return m.group(0)

new_text = re.sub(r'el\(([^,]+),\s*\{\s*(.*?className:[^}]*?glass-card[^}]*)\s*\}', replacer, text, flags=re.DOTALL)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Replaced inline glass-cards.')
