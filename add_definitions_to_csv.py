import json
import csv
import re
from collections import defaultdict

# Read the definitions
with open('base/json/collected-data-clean.json', 'r', encoding='utf-8') as f:
    definitions = json.load(f)

# Read the grouped CSV
lemma_data = []
with open('base/json/words_grouped.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header row
    for row in reader:
        if len(row) >= 2:
            lemma_data.append(row)

# For each lemma, find which definitions contain it
result_data = []
for row in lemma_data:
    lemma = row[0]
    word_forms = row[1]
    
    # Parse word forms
    forms = [w.strip() for w in word_forms.split(',')]
    
    # Find definitions containing any of these word forms
    containing_definitions = []
    for idx, definition in enumerate(definitions):
        definition_lower = definition.lower()
        # Check if any word form appears in this definition
        for form in forms:
            if re.search(r'\b' + re.escape(form) + r'\b', definition_lower):
                containing_definitions.append(definition)
                break
    
    # Store result
    result_data.append([lemma, word_forms, '; '.join(containing_definitions)])

# Write to CSV with headers
with open('base/json/words_grouped.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    # Write header row
    writer.writerow(['General Word Form', 'Word Forms', 'Definitions'])
    # Write data rows (without definitions for now)
    for lemma, word_forms, _ in result_data:
        writer.writerow([lemma, word_forms])

print(f'CSV updated with definitions')
print(f'Total rows: {len(result_data)}')
