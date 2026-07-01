import json
import csv
import re
from collections import defaultdict
import spacy

# Load spaCy model
nlp = spacy.load('en_core_web_sm')

# Read the definitions
with open('base/json/collected-data-clean.json', 'r', encoding='utf-8') as f:
    definitions = json.load(f)

# Extract all words from definitions
words_set = set()
for definition in definitions:
    cleaned = definition.lower()
    word_list = re.findall(r'\b\w+\b', cleaned)
    words_set.update(word_list)

# Group words by lemma using spaCy
lemma_groups = defaultdict(list)

for word in sorted(words_set):
    doc = nlp(word)
    if len(doc) > 0:
        lemma = doc[0].lemma_
    else:
        lemma = word
    
    lemma_groups[lemma].append(word)

# Sort lemmas and their word forms
sorted_lemmas = sorted(lemma_groups.keys())

# Write to CSV
with open('base/json/words_grouped.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    for lemma in sorted_lemmas:
        word_forms = ', '.join(sorted(lemma_groups[lemma]))
        writer.writerow([lemma, word_forms])

print(f'spaCy-based grouped CSV created with {len(sorted_lemmas)} lemmas')
print(f'Total word variations: {len(words_set)}')
