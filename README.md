# Subjective Dictionary - 3D Semantic Network Visualization

An interactive 3D visualization of semantic relationships between definitions from the Subjective Urban Dictionary.

## Overview

This project creates an immersive exploration of 875 definitions organized as a semantic network. Each definition is represented as a point in 3D space, positioned by force-directed layout based on semantic similarity. Similar definitions naturally cluster together, creating a navigable "semantic landscape."

## Features

- **3D Interactive Network**: Explore 875 definitions in a semantic space
- **Semantic Clustering**: 47 communities detected using Louvain algorithm
- **Filtered Connections**: Shows top 5 strongest semantic relationships per node (reduces visual clutter from 9,919 edges to 2,858)
- **Flatter Landscape**: 2.5D design optimized for readability (X/Y: 3000, Z: 800)
- **Distance-Based Fading**: Depth perception through opacity transitions
- **Interactive Focus Mode**: Click any node to highlight its semantic neighborhood
- **Hover Details**: View full definition text on hover

## Pages

- **`base/html/index.html`** - Main landing page with project overview
- **`base/html/map.html`** - Original legacy visualization
- **`base/json/definition_network_3d.html`** - Full interactive 3D semantic network (standalone)

## How to Use

### View the Visualization

Open `base/json/definition_network_3d.html` in any modern web browser.

### Controls

- **Mouse Drag (Left)**: Rotate view
- **Mouse Drag (Right)**: Pan camera
- **Mouse Scroll**: Zoom in/out
- **Hover**: View definition text
- **Click Node**: Enter focus mode to explore semantic neighborhood
- **Double-Click**: Exit focus mode

## Architecture

### Data Processing

```
collected-data-clean.csv (875 definitions)
    ↓
similarity_analysis.py (TF-IDF + cosine similarity)
    ↓
definition_network.edgelist (9,919 edges)
    ↓
Community detection (Louvain algorithm)
    ↓
Force-directed layout (spring layout)
```

### Visualization

```
generate_3d_visualization.py
    ↓
Processes coordinates + node + edge data
    ↓
Three.js rendering with:
    - MeshBasicMaterial spheres for nodes
    - LineBasicMaterial for edges
    - Raycasting for hover/click detection
    - Distance-based opacity fading
```

## File Structure

```
subjective-dictionary/
├── README.md
├── generate_3d_visualization.py      # Main visualization generator
├── similarity_analysis.py             # Semantic analysis
├── base/
│   ├── html/
│   │   ├── index.html               # Landing page
│   │   ├── map.html                 # Legacy visualization
│   │   └── alphabetical.html        # Alphabetical listing
│   ├── css/
│   │   └── styles.css
│   ├── js/                          # Frontend utilities
│   └── json/
│       ├── definition_network_3d.html     # Main interactive visualization
│       ├── definition_network.edgelist   # Edge list (9,919 edges)
│       ├── collected-data-clean.csv      # Clean definitions
│       └── [other data files]
```

## Data Sources

- **Definitions**: 875 unique definitions from Urban Dictionary
- **Semantic Analysis**: TF-IDF vectorization with cosine similarity
- **Network Analysis**: Louvain community detection, force-directed layout
- **Communities**: 47 distinct semantic clusters

## Technical Stack

- **Backend**: Python (pandas, numpy, matplotlib, networkx, scikit-learn)
- **Visualization**: Three.js (WebGL rendering)
- **Layout**: Force-directed graph (spring layout algorithm)
- **Community Detection**: Louvain algorithm
- **Colors**: Matplotlib tab20/tab20b/tab20c colormaps

## Requirements

- Modern web browser with WebGL support (Chrome, Firefox, Safari, Edge)
- Python 3.7+ (for data processing)

## Performance

- **Nodes**: 875 (rendered as 3D spheres)
- **Edges**: 2,858 (filtered) / 9,919 (all)
- **Communities**: 47 (color-coded)
- **60 FPS** smooth interaction on modern hardware

## Customization

### Adjust Node Spacing

Edit scaling in `generate_3d_visualization.py`:

```python
mesh.position.set(d.x * 3000, d.y * 3000, d.z * 800)  # Change multipliers
```

### Change Edge Filtering

Modify the number of top connections per node:

```python
sorted_edges = sorted(edges_for_node, key=lambda e: e['weight'], reverse=True)[:5]  # Change 5
```

### Adjust Node Size

Edit the sizing formula:

```python
size = 3 + Math.sqrt(d.degree)  // Change formula
```

## Future Enhancements

- [ ] Toggle to show all 9,919 edges
- [ ] Search and filter definitions
- [ ] Export selected subgraphs
- [ ] Collaborative annotations
- [ ] Mobile-optimized view

## License

[Your License Here]

## Author

Created as a portfolio project exploring semantic networks and 3D data visualization.

---

**Explore the semantic landscape of definitions!** 🌌
