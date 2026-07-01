import pandas as pd
import numpy as np
import networkx as nx
from community import community_louvain
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.colors import Normalize
from matplotlib.cm import ScalarMappable
import warnings
warnings.filterwarnings('ignore')

print("=" * 80)
print("NETWORK VISUALIZATION & COMMUNITY DETECTION PIPELINE")
print("=" * 80)

# ============================================================================
# STEP 0: Load Similarity Data
# ============================================================================
print("\n[STEP 0] Loading similarity matrix...")

similarity_df = pd.read_csv('base/json/definition_similarity_matrix.csv', encoding='utf-8')
definitions_df = pd.read_csv('base/json/collected-data-clean.csv', encoding='utf-8')

print(f"✓ Loaded {len(similarity_df)} similarity pairs")
print(f"✓ Total definitions: {len(definitions_df)}")

# ============================================================================
# STEP 1: Determine Optimal Threshold
# ============================================================================
print("\n[STEP 1] Analyzing similarity threshold...")

similarity_scores = similarity_df['Similarity_Score'].values
print(f"\nSimilarity score statistics:")
print(f"  Min: {similarity_scores.min():.4f}")
print(f"  Max: {similarity_scores.max():.4f}")
print(f"  Mean: {similarity_scores.mean():.4f}")
print(f"  Median: {np.median(similarity_scores):.4f}")
print(f"  Std Dev: {similarity_scores.std():.4f}")

# Percentile-based threshold
percentiles = [25, 50, 75, 90, 95, 99]
print(f"\nPercentiles:")
for p in percentiles:
    val = np.percentile(similarity_scores, p)
    count = (similarity_scores >= val).sum()
    print(f"  {p}th percentile: {val:.4f} ({count} edges)")

# Auto-threshold: use 75th percentile (keeps top 25% of edges)
AUTO_THRESHOLD = np.percentile(similarity_scores, 75)
print(f"\n→ Auto-selected threshold: {AUTO_THRESHOLD:.4f} (75th percentile)")
print(f"  This keeps {(similarity_scores >= AUTO_THRESHOLD).sum()} edges out of {len(similarity_df)}")

# ============================================================================
# STEP 2: Build Network Graph
# ============================================================================
print("\n[STEP 2] Building network graph...")

G = nx.Graph()

# Add all definitions as nodes
for def_id in definitions_df['number'].values:
    G.add_node(def_id)

# Add edges above threshold
edge_count = 0
for _, row in similarity_df.iterrows():
    if row['Similarity_Score'] >= AUTO_THRESHOLD:
        G.add_edge(
            int(row['Definition_A']),
            int(row['Definition_B']),
            weight=row['Similarity_Score']
        )
        edge_count += 1

print(f"✓ Created graph with:")
print(f"  - Nodes: {G.number_of_nodes()}")
print(f"  - Edges: {G.number_of_edges()}")
print(f"  - Density: {nx.density(G):.4f}")

# Check connectivity
largest_cc = max(nx.connected_components(G), key=len)
print(f"  - Largest connected component: {len(largest_cc)} nodes")

# ============================================================================
# STEP 3: Community Detection (Louvain)
# ============================================================================
print("\n[STEP 3] Detecting communities with Louvain algorithm...")

communities = community_louvain.best_partition(G, randomize=None, random_state=42)
num_communities = len(set(communities.values()))

print(f"✓ Detected {num_communities} communities")

# Show community sizes
community_sizes = {}
for node, comm in communities.items():
    if comm not in community_sizes:
        community_sizes[comm] = 0
    community_sizes[comm] += 1

for comm_id in sorted(community_sizes.keys()):
    size = community_sizes[comm_id]
    print(f"  Community {comm_id}: {size} definitions ({100*size/G.number_of_nodes():.1f}%)")

# ============================================================================
# STEP 4: Apply Force-Directed Layout
# ============================================================================
print("\n[STEP 4] Computing force-directed layout (spring layout)...")

# Spring layout with higher iterations for better convergence
pos = nx.spring_layout(
    G,
    k=0.5,  # Optimal distance between nodes
    iterations=50,  # Number of iterations
    seed=42,  # For reproducibility
    weight='weight'  # Use edge weights
)

print(f"✓ Layout computed")
print(f"  Parameter explanation:")
print(f"    k=0.5: Optimal edge length (increase for more spread)")
print(f"    iterations=50: Algorithm convergence quality (higher = better)")
print(f"    weight: Use edge weights for attraction force")

# ============================================================================
# STEP 5: Create Visualization
# ============================================================================
print("\n[STEP 5] Creating visualization...")

fig, ax = plt.subplots(figsize=(20, 20))

# Draw edges with varying thickness based on weight
edges = G.edges()
weights = [G[u][v]['weight'] for u, v in edges]

nx.draw_networkx_edges(
    G, pos,
    width=[w * 2 for w in weights],  # Thicker edges for stronger connections
    alpha=0.2,
    edge_color='gray',
    ax=ax
)

# Draw nodes colored by community
node_colors = [communities[node] for node in G.nodes()]
nodes = nx.draw_networkx_nodes(
    G, pos,
    node_color=node_colors,
    node_size=100,
    cmap='tab20',
    ax=ax,
    alpha=0.8
)

# Add labels for larger communities
labels = {}
for node in G.nodes():
    if communities[node] < 10:  # Only label first 10 communities
        labels[node] = str(node)

nx.draw_networkx_labels(
    G, pos,
    labels=labels,
    font_size=6,
    ax=ax
)

ax.set_title(
    f'Definition Network Visualization\n'
    f'{G.number_of_nodes()} definitions, {G.number_of_edges()} edges, {num_communities} communities',
    fontsize=16,
    fontweight='bold'
)
ax.axis('off')

# Add colorbar
sm = ScalarMappable(cmap='tab20', norm=Normalize(vmin=0, vmax=num_communities))
sm.set_array([])
cbar = plt.colorbar(sm, ax=ax, fraction=0.046, pad=0.04)
cbar.set_label('Community ID', fontsize=12)

plt.tight_layout()
plt.savefig('base/json/definition_network.png', dpi=150, bbox_inches='tight')
print(f"✓ Saved visualization to definition_network.png")
plt.close()

# ============================================================================
# STEP 6: Export Coordinates and Community Info
# ============================================================================
print("\n[STEP 6] Exporting results...")

# Create dataframe with coordinates and communities
results = []
for node_id in sorted(G.nodes()):
    x, y = pos[node_id]
    community_id = communities[node_id]
    results.append({
        'Definition_ID': node_id,
        'X': x,
        'Y': y,
        'Community': community_id
    })

results_df = pd.DataFrame(results)
results_df.to_csv('base/json/definition_coordinates.csv', index=False, encoding='utf-8')
print(f"✓ Saved coordinates to definition_coordinates.csv")

# ============================================================================
# STEP 7: Export Graph (edgelist format)
# ============================================================================
print("\n[STEP 7] Exporting graph files...")

# Edgelist
nx.write_edgelist(
    G,
    'base/json/definition_network.edgelist',
    data=['weight'],
    delimiter=','
)
print(f"✓ Saved edgelist to definition_network.edgelist")

# Node list with communities
node_df = pd.DataFrame({
    'Definition_ID': list(G.nodes()),
    'Community': [communities[n] for n in G.nodes()],
    'Degree': [G.degree(n) for n in G.nodes()]
})
node_df = node_df.sort_values('Degree', ascending=False)
node_df.to_csv('base/json/definition_nodes.csv', index=False, encoding='utf-8')
print(f"✓ Saved node information to definition_nodes.csv")

# ============================================================================
# ANALYSIS: Network Statistics
# ============================================================================
print("\n" + "=" * 80)
print("NETWORK STATISTICS & ANALYSIS")
print("=" * 80)

print(f"\nGlobal Statistics:")
print(f"  Network Density: {nx.density(G):.4f}")
print(f"    → 0 = sparse (isolated nodes), 1 = fully connected")
print(f"  Average Clustering Coefficient: {nx.average_clustering(G):.4f}")
print(f"    → Likelihood that neighbors are also connected")
print(f"  Average Shortest Path Length: ", end="")
if nx.is_connected(G):
    print(f"{nx.average_shortest_path_length(G):.2f}")
else:
    avg_path = []
    for cc in nx.connected_components(G):
        subgraph = G.subgraph(cc)
        if len(cc) > 1:
            avg_path.append(nx.average_shortest_path_length(subgraph))
    print(f"{np.mean(avg_path):.2f} (main component)")

print(f"\nNode Statistics (top 10 most connected):")
degrees = sorted([(n, G.degree(n)) for n in G.nodes()], key=lambda x: x[1], reverse=True)
for node_id, degree in degrees[:10]:
    def_text = definitions_df[definitions_df['number'] == node_id]['definition'].values
    if len(def_text) > 0:
        text = def_text[0][:50]
    else:
        text = "Unknown"
    print(f"  Definition {node_id}: degree={degree}, text='{text}...'")

print(f"\nCommunity Structure:")
for comm_id in sorted(community_sizes.keys()):
    size = community_sizes[comm_id]
    nodes_in_comm = [n for n, c in communities.items() if c == comm_id]
    subgraph = G.subgraph(nodes_in_comm)
    internal_edges = subgraph.number_of_edges()
    print(f"  Community {comm_id}: {size} nodes, {internal_edges} internal edges")

# ============================================================================
# PARAMETER GUIDE
# ============================================================================
print("\n" + "=" * 80)
print("PARAMETER TUNING GUIDE")
print("=" * 80)

print(f"""
1. SIMILARITY THRESHOLD (currently: {AUTO_THRESHOLD:.4f})
   
   Effect:
   - Higher threshold → Fewer edges, sparser graph, clearer clusters
   - Lower threshold → More edges, denser graph, more connections
   
   How to adjust:
   - Increase to {AUTO_THRESHOLD * 1.5:.4f}: Keep only strongest 10% of edges
   - Decrease to {AUTO_THRESHOLD * 0.5:.4f}: Include weaker 40% of edges
   - Use median ({np.median(similarity_scores):.4f}) for balanced approach

2. FORCE-DIRECTED LAYOUT (k and iterations)
   
   k parameter (node separation):
   - Current: 0.5
   - Increase to 1.0: Nodes spread further apart (more exploration)
   - Decrease to 0.2: Nodes clustered tighter (more compact)
   
   iterations parameter (convergence):
   - Current: 50
   - Increase to 100: Better layout quality (slower)
   - Decrease to 20: Faster but may be suboptimal

3. COMMUNITY DETECTION (Louvain)
   
   - Resolution parameter affects community granularity
   - Higher resolution: More, smaller communities
   - Lower resolution: Fewer, larger communities
   - Current: default (balanced)

4. EDGE WEIGHTS
   
   - TF-IDF cosine similarity (0 to 1)
   - Stronger connections attract nodes more
   - Line thickness = similarity score
""")

print("\n✓ Pipeline complete!")
print(f"\nOutput files:")
print(f"  1. definition_network.png - Visualization")
print(f"  2. definition_coordinates.csv - Node positions for interactive maps")
print(f"  3. definition_network.edgelist - Graph in edge list format")
print(f"  4. definition_nodes.csv - Node information and communities")
