import json
import csv

# Read the JSON file
with open('base/json/collected-data-clean.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Write to CSV
with open('base/json/collected-data-clean.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    for row in data:
        writer.writerow(row)

print(f'Converted to CSV: collected-data-clean.csv')
print(f'Total rows: {len(data)}')
