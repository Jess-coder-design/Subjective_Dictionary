import json
import csv
import re
from collections import Counter

# Read the definitions
with open('base/json/collected-data-clean.json', 'r', encoding='utf-8') as f:
    definitions = json.load(f)

# Extract all words from definitions
words = []
for definition in definitions:
    # Convert to lowercase and split into words
    cleaned = definition.lower()
    # Remove punctuation and split by whitespace
    word_list = re.findall(r'\b\w+\b', cleaned)
    words.extend(word_list)

# Remove duplicates and sort (or keep all if you want duplicates)
unique_words = sorted(set(words))

# Write to CSV
with open('base/json/words.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    for word in unique_words:
        writer.writerow([word])

print(f'CSV created with {len(unique_words)} unique words')
