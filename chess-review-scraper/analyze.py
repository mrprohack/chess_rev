import re

html = open('page_dump.html', encoding='utf-8').read()

# We look for <div class="move-text-component">...</div>
# or nodes containing icon-font-chess
pattern = r'<span[^>]*data-cy="move-text"[^>]*>(.*?)</span>.*?<span[^>]*class="([^"]*icon-font-chess[^"]*)"[^>]*>'
matches = re.findall(pattern, html, re.DOTALL)

moves = []
for m in matches:
    text = re.sub(r'<[^>]+>', '', m[0]).strip()
    cls = m[1]
    
    classification = ''
    if 'brilliant' in cls: classification = '[BRILLIANT!!]'
    elif 'great' in cls: classification = '[GREAT!]'
    elif 'best' in cls: classification = '[BEST]'
    elif 'excellent' in cls: classification = '[EXCELLENT]'
    elif 'good' in cls: classification = '[GOOD]'
    elif 'inaccuracy' in cls: classification = '[INACCURACY?!]'
    elif 'mistake' in cls: classification = '[MISTAKE?]'
    elif 'miss' in cls: classification = '[MISS]'
    elif 'blunder' in cls: classification = '[BLUNDER??]'
    elif 'book' in cls: classification = '[BOOK]'
    
    if classification:
        moves.append(f"{text} {classification}")

# Just print the first 20 to see if it worked
print(f"Found {len(moves)} moves with classifications.")
print("\n".join(moves))
