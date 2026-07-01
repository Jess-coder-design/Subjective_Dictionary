import json

# Read the clean definitions
with open('base/json/collected-data-clean.json', 'r', encoding='utf-8') as f:
    definitions = json.load(f)

# Create new structure with header and numbered definitions
result = [["number", "definition"]]
for idx, definition in enumerate(definitions, 1):
    result.append([idx, definition])

# Write back to the same file
with open('base/json/collected-data-clean.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print(f'Updated collected-data-clean.json')
print(f'Total definitions: {len(definitions)}')
