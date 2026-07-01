import csv
import re
from collections import defaultdict

# Read collected-data-clean.csv to get definitions with numbers
definitions = {}
with open('base/json/collected-data-clean.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header
    for row in reader:
        if len(row) >= 2:
            num = int(row[0])
            definition = row[1].lower()
            definitions[num] = definition

# Read words_grouped.csv and find which definitions contain each word form
result_rows = []
with open('base/json/words_grouped.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)  # Get header
    
    for row in reader:
        if len(row) >= 2:
            lemma = row[0]
            word_forms_str = row[1]
            
            # Parse word forms
            word_forms = [w.strip() for w in word_forms_str.split(',')]
            
            # Find definition numbers containing any of these word forms
            containing_numbers = []
            for def_num, definition in definitions.items():
                for word_form in word_forms:
                    if re.search(r'\b' + re.escape(word_form) + r'\b', definition):
                        containing_numbers.append(def_num)
                        break
            
            # Sort the numbers
            containing_numbers.sort()
            definitions_str = ', '.join(str(n) for n in containing_numbers)
            
            result_rows.append([lemma, word_forms_str, definitions_str])

# Write back to CSV with all three columns
with open('base/json/words_grouped.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(header)  # Write header
    for row in result_rows:
        writer.writerow(row)

print(f'Updated words_grouped.csv')
print(f'Total word groups: {len(result_rows)}')
