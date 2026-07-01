import json

# Read the original file
with open('base/json/collected-data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extract only definitions
definitions = [item.get('definition', '') for item in data]

# Save to the clean file
with open('base/json/collected-data-clean.json', 'w', encoding='utf-8') as f:
    json.dump(definitions, f, indent=2, ensure_ascii=False)

print('File updated with only definitions')
print(f'Total definitions: {len(definitions)}')
