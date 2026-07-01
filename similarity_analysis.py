import pandas as pd
import numpy as np
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from itertools import combinations
import warnings
warnings.filterwarnings('ignore')

print("=" * 80)
print("DEFINITION SIMILARITY ANALYSIS PIPELINE")
print("=" * 80)

# ============================================================================
# STEP 0: Load Data
# ============================================================================
print("\n[STEP 0] Loading data...")

# Load the definitions with numbers
definitions_df = pd.read_csv('base/json/collected-data-clean.csv', encoding='utf-8')
definitions_dict = dict(zip(definitions_df['number'], definitions_df['definition']))
print(f"✓ Loaded {len(definitions_dict)} definitions")

# Load the word-to-definitions mapping
words_grouped_df = pd.read_csv('base/json/words_grouped.csv', encoding='utf-8')
print(f"✓ Loaded {len(words_grouped_df)} word groups")

# ============================================================================
# STEP 1: Convert Inverted Index to Definition-Word Representation
# ============================================================================
print("\n[STEP 1] Converting inverted index to definition-word representation...")

def parse_definition_ids(def_str):
    """Parse comma-separated definition IDs"""
    if pd.isna(def_str) or def_str == '':
        return []
    return [int(x.strip()) for x in str(def_str).split(',')]

# Create mapping: Definition ID → set of words
definition_words = {}
for idx, row in words_grouped_df.iterrows():
    lemma = str(row['General Word Form']).lower().strip()
    def_ids = parse_definition_ids(row['Definitions'])
    
    for def_id in def_ids:
        if def_id not in definition_words:
            definition_words[def_id] = set()
        definition_words[def_id].add(lemma)

print(f"✓ Created mapping for {len(definition_words)} definitions")

# Show example
example_def_id = list(definition_words.keys())[0]
print(f"\nExample - Definition {example_def_id}:")
print(f"  Text: {definitions_dict[example_def_id][:100]}...")
print(f"  Words: {sorted(list(definition_words[example_def_id]))[:15]}...")

# ============================================================================
# STEP 2: Build Document-Term Matrix with TF-IDF
# ============================================================================
print("\n[STEP 2] Building TF-IDF document-term matrix...")

# Prepare definition texts in order
sorted_def_ids = sorted(definition_words.keys())
definition_texts = [definitions_dict[def_id] for def_id in sorted_def_ids]

# Initialize TF-IDF vectorizer with stopword removal
vectorizer = TfidfVectorizer(
    lowercase=True,
    stop_words='english',
    min_df=2,  # word must appear in at least 2 definitions
    max_df=0.9,  # ignore words appearing in >90% of definitions
    ngram_range=(1, 1),  # only single words
    max_features=5000  # limit to top 5000 features
)

# Fit and transform
tfidf_matrix = vectorizer.fit_transform(definition_texts)
print(f"✓ Created TF-IDF matrix: {tfidf_matrix.shape[0]} definitions × {tfidf_matrix.shape[1]} features")

feature_names = np.array(vectorizer.get_feature_names_out())
print(f"✓ Top TF-IDF features: {feature_names[:20].tolist()}")

# ============================================================================
# ANALYSIS: Show filtered words
# ============================================================================
print("\n" + "=" * 80)
print("FILTERING DETAILS")
print("=" * 80)

# Get all unique words from all definitions
all_words = set()
for words_set in definition_words.values():
    all_words.update(words_set)

print(f"\nTotal unique words before filtering: {len(all_words)}")
print(f"Total features after filtering: {len(feature_names)}")

# English stopwords
from nltk.corpus import stopwords
try:
    stop_words_en = set(stopwords.words('english'))
except:
    import nltk
    nltk.download('stopwords')
    stop_words_en = set(stopwords.words('english'))

# Calculate document frequency
from collections import Counter
doc_freq = Counter()
for words_set in definition_words.values():
    for word in words_set:
        doc_freq[word] += 1

# Find filtered words
stopwords_in_data = [w for w in all_words if w in stop_words_en]
rare_words = [w for w in all_words if doc_freq[w] < 2]
common_words = [w for w in all_words if doc_freq[w] > 0.9 * len(sorted_def_ids)]

print(f"\n1. STOPWORDS REMOVED: {len(stopwords_in_data)}")
print(f"   Examples: {sorted(list(stopwords_in_data))[:30]}")

print(f"\n2. RARE WORDS REMOVED (appeared < 2 times): {len(rare_words)}")
print(f"   Total rare words: {len(rare_words)}")
print(f"   Examples: {sorted(list(rare_words))[:50]}")

print(f"\n3. COMMON WORDS REMOVED (appeared > 90% of definitions): {len(common_words)}")
print(f"   Threshold: > {int(0.9 * len(sorted_def_ids))} out of {len(sorted_def_ids)} definitions")
print(f"   Words: {sorted(common_words)}")
for word in sorted(common_words):
    print(f"      '{word}' appears in {doc_freq[word]} definitions ({100*doc_freq[word]/len(sorted_def_ids):.1f}%)")

# Kept words
kept_words = set(feature_names)
print(f"\n4. WORDS KEPT: {len(kept_words)}")
print(f"   Examples (sorted by frequency): ")
freq_sorted = sorted(kept_words, key=lambda w: doc_freq[w], reverse=True)[:30]
for word in freq_sorted:
    print(f"      '{word}' appears in {doc_freq[word]} definitions ({100*doc_freq[word]/len(sorted_def_ids):.1f}%)")


# ============================================================================
# STEP 3: Calculate Cosine Similarity Between All Definitions
# ============================================================================
print("\n[STEP 3] Calculating cosine similarity between all definitions...")

# Calculate cosine similarity matrix
similarity_matrix = cosine_similarity(tfidf_matrix)
print(f"✓ Computed {len(sorted_def_ids)}×{len(sorted_def_ids)} similarity matrix")

# Extract all pairs with similarities > 0 (excluding self-similarities)
similarity_pairs = []
for i in range(len(sorted_def_ids)):
    for j in range(i + 1, len(sorted_def_ids)):
        def_a = sorted_def_ids[i]
        def_b = sorted_def_ids[j]
        score = similarity_matrix[i, j]
        
        if score > 0:  # Only include non-zero similarities
            similarity_pairs.append({
                'Definition_A': def_a,
                'Definition_B': def_b,
                'Similarity_Score': score,
                'Shared_Words': len(definition_words[def_a] & definition_words[def_b])
            })

# Sort by similarity score
similarity_pairs = sorted(similarity_pairs, key=lambda x: x['Similarity_Score'], reverse=True)
print(f"✓ Found {len(similarity_pairs)} definition pairs with non-zero similarity")

# ============================================================================
# STEP 4: Output Results
# ============================================================================
print("\n[STEP 4] Generating output files...")

# Create DataFrame
results_df = pd.DataFrame(similarity_pairs)

# Save to CSV
output_file = 'base/json/definition_similarity_matrix.csv'
results_df.to_csv(output_file, index=False, encoding='utf-8')
print(f"✓ Saved {len(results_df)} similarity pairs to {output_file}")

# Show top 20 most similar definition pairs
print("\n" + "=" * 80)
print("TOP 20 MOST SIMILAR DEFINITION PAIRS")
print("=" * 80)
for idx, row in results_df.head(20).iterrows():
    print(f"\n#{idx+1}. Similarity: {row['Similarity_Score']:.4f} | Shared words: {row['Shared_Words']}")
    print(f"  Definition {row['Definition_A']}: {definitions_dict[row['Definition_A']][:70]}...")
    print(f"  Definition {row['Definition_B']}: {definitions_dict[row['Definition_B']][:70]}...")

# Statistics
print("\n" + "=" * 80)
print("STATISTICS")
print("=" * 80)
print(f"Total definition pairs analyzed: {len(results_df)}")
print(f"Average similarity: {results_df['Similarity_Score'].mean():.4f}")
print(f"Max similarity: {results_df['Similarity_Score'].max():.4f}")
print(f"Min similarity: {results_df['Similarity_Score'].min():.4f}")
print(f"Definitions covered: {len(sorted_def_ids)}")
print(f"Total possible pairs: {len(sorted_def_ids) * (len(sorted_def_ids) - 1) // 2}")
print(f"Pairs with similarity > 0: {len(results_df)}")

print("\n✓ Pipeline complete!")
