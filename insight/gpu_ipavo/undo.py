with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Undo structural damage
html = html.replace('  <div class="card card-body">\n', '')
html = html.replace('class="card-wrapper ', 'class="card ')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
