import re

def process_html():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Step 1: Remove SVG icons inside .card-title
    # We find <span class="card-title">...</span> and remove <svg>...</svg>
    def remove_svg(match):
        content = match.group(0)
        # Remove all <svg ...>...</svg>
        content = re.sub(r'<svg.*?>.*?</svg>', '', content, flags=re.DOTALL)
        # Remove extra whitespace caused by removal
        content = re.sub(r'>\s+', '>', content)
        content = re.sub(r'\s+<', '<', content)
        return content

    html = re.sub(r'<span class="card-title">.*?</span>', remove_svg, html, flags=re.DOTALL)

    # Step 2: Refactor cards with .card-header
    # We'll parse line by line to keep track of divs
    lines = html.split('\n')
    new_lines = []
    
    in_card = False
    card_div_depth = 0
    card_header_depth = 0
    in_card_header = False
    added_card_body_open = False
    
    for i, line in enumerate(lines):
        # Check if we are opening a card
        if not in_card and '<div class="card ' in line:
            # Check if this card has a card-header by looking ahead a few lines
            has_header = False
            for j in range(i+1, min(i+15, len(lines))):
                if '<div class="card-header"' in lines[j]:
                    has_header = True
                    break
                if '<div class="chart-title"' in lines[j] or '<div class="stat-label"' in lines[j]:
                    break # Not a standard header
            
            if has_header:
                in_card = True
                card_div_depth = 0
                added_card_body_open = False
                # Change the wrapper line
                line = line.replace('class="card ', 'class="card-wrapper ')
        
        if in_card:
            # count div depth
            open_divs = len(re.findall(r'<div\b', line))
            close_divs = len(re.findall(r'</div>', line))
            card_div_depth += (open_divs - close_divs)
            
            if '<div class="card-header"' in line:
                in_card_header = True
                card_header_depth = 0
                
            if in_card_header:
                open_divs_header = len(re.findall(r'<div\b', line))
                close_divs_header = len(re.findall(r'</div>', line))
                card_header_depth += (open_divs_header - close_divs_header)
                
                new_lines.append(line)
                
                if card_header_depth <= 0:
                    in_card_header = False
                    # Header is closed, now open the card body
                    new_lines.append('  <div class="card card-body">')
                    added_card_body_open = True
                    # Because we added a div, increment tracking depth
                    card_div_depth += 1 
                continue
            
            if added_card_body_open and card_div_depth <= 0:
                # The wrapper is closing. We need to close the card body first.
                # Replace the closing </div> with two </div>s
                line = line.replace('</div>', '</div>\n</div>', 1)
                in_card = False
                added_card_body_open = False
                
        new_lines.append(line)

    with open('index_modified.html', 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
    print("Done")

if __name__ == '__main__':
    process_html()
