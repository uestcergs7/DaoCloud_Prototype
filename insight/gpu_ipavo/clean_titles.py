import re
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

def remove_svg(match):
    content = match.group(0)
    # Remove svg tags
    content = re.sub(r'<svg.*?>.*?</svg>', '', content, flags=re.DOTALL)
    # Clean up multiple spaces
    content = re.sub(r'>\s+', '>', content)
    content = re.sub(r'\s+<', '<', content)
    # Clean up empty spaces after tags
    return content

# We already removed from .card-title. Let's do it for .section-title, .chart-title, .resource-title
html = re.sub(r'<div class="section-title">.*?</div>', remove_svg, html, flags=re.DOTALL)
html = re.sub(r'<div class="chart-title">.*?</div>', remove_svg, html, flags=re.DOTALL)
html = re.sub(r'<div class="resource-title">.*?</div>', remove_svg, html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
