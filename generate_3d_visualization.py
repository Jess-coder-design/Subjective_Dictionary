import pandas as pd
import json
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

print("=" * 80)
print("3D INTERACTIVE NETWORK VISUALIZATION GENERATOR")
print("=" * 80)

# ============================================================================
# STEP 0: Load Data
# ============================================================================
print("\n[STEP 0] Loading data...")

# Load coordinates and community info
coords_df = pd.read_csv('base/json/definition_coordinates.csv', encoding='utf-8')
print(f"✓ Loaded {len(coords_df)} node coordinates")

# Load nodes with degree info
nodes_df = pd.read_csv('base/json/definition_nodes.csv', encoding='utf-8')
print(f"✓ Loaded {len(nodes_df)} nodes with degree information")

# Load definitions
definitions_df = pd.read_csv('base/json/collected-data-clean.csv', encoding='utf-8')
definitions_dict = dict(zip(definitions_df['number'], definitions_df['definition']))
print(f"✓ Loaded {len(definitions_dict)} definitions")

# Load edges
edges_list = []
with open('base/json/definition_network.edgelist', 'r', encoding='utf-8') as f:
    for line in f:
        parts = line.strip().split(',')
        if len(parts) >= 3:
            source = int(parts[0])
            target = int(parts[1])
            weight = float(parts[2])
            edges_list.append({'source': source, 'target': target, 'weight': weight})

print(f"✓ Loaded {len(edges_list)} edges")

# ============================================================================
# STEP 1: Prepare Node Data
# ============================================================================
print("\n[STEP 1] Preparing node data...")

nodes_data = []
for _, row in coords_df.iterrows():
    def_id = int(row['Definition_ID'])
    
    # Get degree
    degree = nodes_df[nodes_df['Definition_ID'] == def_id]['Degree'].values
    degree = int(degree[0]) if len(degree) > 0 else 0
    
    # Get definition text
    def_text = definitions_dict.get(def_id, "Unknown definition")
    
    # Truncate for tooltip
    def_text_short = (def_text[:80] + "...") if len(def_text) > 80 else def_text
    
    node = {
        'id': def_id,
        'x': float(row['X']),
        'y': float(row['Y']),
        'z': float(row['Y']) * 0.3,  # Use Y for Z to add some depth
        'community': int(row['Community']),
        'degree': degree,
        'definition': def_text,
        'definition_short': def_text_short
    }
    nodes_data.append(node)

print(f"✓ Prepared {len(nodes_data)} nodes")

# ============================================================================
# STEP 2: Prepare Edge Data - with Filtering
# ============================================================================
print("\n[STEP 2] Preparing edge data...")

edges_data = []
all_edges_data = []

# First, collect all edges
for edge in edges_list:
    all_edges_data.append({
        'source': edge['source'],
        'target': edge['target'],
        'weight': float(edge['weight'])
    })

# Build adjacency list for filtering
adjacency = {}
for edge in all_edges_data:
    if edge['source'] not in adjacency:
        adjacency[edge['source']] = []
    if edge['target'] not in adjacency:
        adjacency[edge['target']] = []
    adjacency[edge['source']].append(edge)
    adjacency[edge['target']].append(edge)

# For each node, keep only top 5 strongest connections
filtered_edges = set()
for node_id in adjacency:
    edges_for_node = adjacency[node_id]
    # Sort by weight descending
    sorted_edges = sorted(edges_for_node, key=lambda e: e['weight'], reverse=True)[:5]
    for edge in sorted_edges:
        # Create unique edge identifier
        edge_key = tuple(sorted([edge['source'], edge['target']]))
        filtered_edges.add(edge_key)

# Create filtered edges list (each edge only once)
edges_data = []
seen = set()
for edge in all_edges_data:
    edge_key = tuple(sorted([edge['source'], edge['target']]))
    if edge_key in filtered_edges and edge_key not in seen:
        edges_data.append(edge)
        seen.add(edge_key)

print(f"✓ Prepared {len(edges_data)} edges (filtered from {len(all_edges_data)} total)")
print(f"✓ All edges available for toggle: {len(all_edges_data)}")

# ============================================================================
# STEP 3: Create Color Palette for Communities
# ============================================================================
print("\n[STEP 3] Creating color palette...")

num_communities = len(set([n['community'] for n in nodes_data]))
colors = plt.colormaps['tab20'](np.linspace(0, 1, min(num_communities, 20)))
if num_communities > 20:
    # For more than 20 communities, use tab20b and tab20c
    colors_b = plt.colormaps['tab20b'](np.linspace(0, 1, 20))
    colors_c = plt.colormaps['tab20c'](np.linspace(0, 1, 20))
    colors = np.vstack([colors, colors_b, colors_c])[:num_communities]

color_map = {}
for i in range(num_communities):
    rgb = colors[i][:3]
    hex_color = '#{:02x}{:02x}{:02x}'.format(int(rgb[0]*255), int(rgb[1]*255), int(rgb[2]*255))
    color_map[str(i)] = hex_color  # Use string keys for JSON compatibility

print(f"✓ Created palette for {num_communities} communities")

# ============================================================================
# STEP 4: Generate HTML
# ============================================================================
print("\n[STEP 4] Generating HTML file...")

html_template = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Definition Network - 3D Interactive Visualization</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0e27;
            color: #e0e0e0;
            overflow: hidden;
        }
        
        #container {
            width: 100vw;
            height: 100vh;
        }
        
        #info-panel {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(20, 20, 40, 0.9);
            border: 1px solid #444;
            padding: 15px;
            border-radius: 8px;
            max-width: 350px;
            max-height: 300px;
            overflow-y: auto;
            backdrop-filter: blur(10px);
            display: none;
            z-index: 100;
        }
        
        #info-panel.active {
            display: block;
        }
        
        .info-title {
            font-size: 16px;
            font-weight: bold;
            color: #00ff88;
            margin-bottom: 10px;
        }
        
        .info-item {
            margin-bottom: 8px;
            font-size: 13px;
            line-height: 1.4;
        }
        
        .info-label {
            color: #888;
            font-weight: 600;
        }
        
        .info-value {
            color: #e0e0e0;
        }
        
        #controls {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(20, 20, 40, 0.9);
            border: 1px solid #444;
            padding: 15px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
            font-size: 12px;
            line-height: 1.6;
        }
        
        .control-section {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #333;
        }
        
        .control-section:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .control-key {
            color: #00ff88;
            font-weight: bold;
        }
        
        #stats {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(20, 20, 40, 0.9);
            border: 1px solid #444;
            padding: 15px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
            font-size: 12px;
            line-height: 1.8;
            text-align: right;
        }
        
        .stat-value {
            color: #00ff88;
            font-weight: bold;
        }
        
        #legend {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(20, 20, 40, 0.9);
            border: 1px solid #444;
            padding: 15px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
            max-height: 400px;
            overflow-y: auto;
            max-width: 250px;
            font-size: 11px;
        }
        
        .legend-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #00ff88;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 6px;
        }
        
        .legend-color {
            width: 12px;
            height: 12px;
            margin-right: 8px;
            border-radius: 2px;
        }
        
        #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(20, 20, 40, 0.95);
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            z-index: 1000;
        }
        
        .spinner {
            border: 3px solid #333;
            border-top: 3px solid #00ff88;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="container"></div>
    
    <div id="info-panel">
        <div class="info-title">Definition Details</div>
        <div class="info-item">
            <span class="info-label">ID:</span>
            <span class="info-value" id="info-id">-</span>
        </div>
        <div class="info-item">
            <span class="info-label">Connections:</span>
            <span class="info-value" id="info-degree">-</span>
        </div>
        <div class="info-item">
            <span class="info-label">Text:</span>
            <div class="info-value" id="info-text" style="margin-top: 5px; font-style: italic;"></div>
        </div>
    </div>
    
    <div id="controls">
        <div class="control-section">
            <strong style="color: #00ff88;">SEMANTIC LANDSCAPE</strong>
        </div>
        <div class="control-section">
            <span class="control-key">Left Drag:</span> Rotate<br>
            <span class="control-key">Right Drag:</span> Pan<br>
            <span class="control-key">Scroll:</span> Zoom
        </div>
        <div class="control-section">
            <span class="control-key">Hover:</span> Node info<br>
            <span class="control-key">Click:</span> Focus mode<br>
            <span class="control-key">Double-click:</span> Exit focus
        </div>
        <div class="control-section" style="font-size: 11px; color: #888;">
            <em>Edges: Top 5/node</em><br>
            <em>Depth fading active</em>
        </div>
    </div>
    
    <div id="stats">
        <div><span class="stat-value" id="stat-nodes">0</span> Definitions</div>
        <div><span class="stat-value" id="stat-edges">0</span> Connections</div>
        <div><span class="stat-value" id="stat-communities">0</span> Communities</div>
    </div>
    
    <div id="legend">
        <div class="legend-title">Communities</div>
        <div id="legend-content"></div>
    </div>
    
    <div id="loading">
        <div class="spinner"></div>
        <div>Building 3D Network...</div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    
    <script>
        // Data embedded directly below
        const nodesData = %%NODES_DATA%%;
        const edgesData = %%EDGES_DATA%%;
        const colorMap = %%COLOR_MAP%%;
        
        console.log('Loaded ' + nodesData.length + ' nodes');
        console.log('Loaded ' + edgesData.length + ' edges');
        
        const container = document.getElementById('container');
        const infoPanel = document.getElementById('info-panel');
        const infoPanelContent = {
            id: document.getElementById('info-id'),
            degree: document.getElementById('info-degree'),
            text: document.getElementById('info-text')
        };
        
        // Three.js Scene Setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0e27);
        
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 30000);
        camera.position.z = 5000;  // Positioned to view flatter landscape
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        
        // Lighting
        const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
        light1.position.set(100, 100, 100);
        scene.add(light1);
        
        const light2 = new THREE.DirectionalLight(0xffffff, 0.4);
        light2.position.set(-100, -100, -100);
        scene.add(light2);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        
        // Create nodes
        const nodes = [];
        const nodeGeometry = new THREE.SphereGeometry(1, 6, 6);
        
        nodesData.forEach(d => {
            const size = 3 + Math.sqrt(d.degree);
            const colorHex = colorMap[d.community.toString()] || '#888888';
            const colorInt = parseInt(colorHex.replace('#', ''), 16);
            
            const material = new THREE.MeshBasicMaterial({ 
                color: colorInt,
                wireframe: false,
                transparent: true,
                opacity: 0.85
            });
            
            const mesh = new THREE.Mesh(nodeGeometry, material);
            mesh.scale.set(size, size, size);
            mesh.position.set(d.x * 3000, d.y * 3000, d.z * 800);
            
            mesh.userData = {
                id: d.id,
                degree: d.degree,
                definition: d.definition,
                community: d.community
            };
            scene.add(mesh);
            nodes.push({ mesh, data: d });
        });
        
        console.log('Total nodes added to scene:', nodes.length);
        
        // Log bounds for debugging
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        nodes.forEach(n => {
            minX = Math.min(minX, n.mesh.position.x);
            maxX = Math.max(maxX, n.mesh.position.x);
            minY = Math.min(minY, n.mesh.position.y);
            maxY = Math.max(maxY, n.mesh.position.y);
            minZ = Math.min(minZ, n.mesh.position.z);
            maxZ = Math.max(maxZ, n.mesh.position.z);
        });
        console.log('Bounds - X:', minX.toFixed(1), 'to', maxX.toFixed(1),
                    'Y:', minY.toFixed(1), 'to', maxY.toFixed(1),
                    'Z:', minZ.toFixed(1), 'to', maxZ.toFixed(1));
        
        // Create edges (lines) with filtering and weight-based styling
        const edges = [];
        const allEdges = [];
        let edgesCreated = 0;
        
        edgesData.forEach(link => {
            const start = nodesData.find(n => n.id === link.source);
            const end = nodesData.find(n => n.id === link.target);
            
            if (start && end) {
                // Base opacity on edge weight
                const opacity = Math.max(0.08, Math.min(0.25, link.weight * 0.3));
                const linewidth = Math.max(0.5, Math.min(2, link.weight * 1.5));
                
                const lineMaterial = new THREE.LineBasicMaterial({ 
                    color: 0x4a5568,
                    transparent: true, 
                    opacity: opacity,
                    linewidth: linewidth
                });
                
                const geometry = new THREE.BufferGeometry();
                const positions = new Float32Array([
                    start.x * 3000, start.y * 3000, start.z * 800,
                    end.x * 3000, end.y * 3000, end.z * 800
                ]);
                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                
                const line = new THREE.Line(geometry, lineMaterial);
                line.userData = { weight: link.weight, source: link.source, target: link.target };
                line.visible = true;
                scene.add(line);
                edges.push(line);
                allEdges.push(line);
                edgesCreated++;
            }
        });
        console.log('Filtered edges created:', edgesCreated);
        
        // Improve rendering
        renderer.sortObjects = true;
        
        // Mouse interaction with focus mode
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let focusedNode = null;
        let inFocusMode = false;
        
        // Distance-based fading for depth perception
        function updateDepthFading() {
            const cameraZ = camera.position.z;
            
            nodes.forEach(n => {
                const distToCamera = Math.abs(cameraZ - n.mesh.position.z);
                const maxDepth = 2500;
                const fadeStrength = Math.max(0.3, 1 - (distToCamera / maxDepth) * 0.4);
                n.mesh.material.opacity = n.mesh.userData.originalOpacity * fadeStrength;
            });
            
            edges.forEach(e => {
                if (e.visible) {
                    const mat = e.material;
                    const midZ = (e.geometry.attributes.position.array[2] + 
                                  e.geometry.attributes.position.array[5]) / 2;
                    const distToCamera = Math.abs(cameraZ - midZ);
                    const maxDepth = 2500;
                    const fadeStrength = Math.max(0.2, 1 - (distToCamera / maxDepth) * 0.3);
                    mat.opacity = mat.userData.baseOpacity * fadeStrength;
                }
            });
        }
        
        // Store base opacities
        edges.forEach(e => {
            e.material.userData = { baseOpacity: e.material.opacity };
        });
        
        document.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(nodes.map(n => n.mesh), false);
            
            if (!inFocusMode) {
                // Normal hover mode
                nodes.forEach(n => {
                    n.mesh.material.color.setHex(parseInt(colorMap[n.data.community.toString()] || '#888888'.replace('#', ''), 16));
                    const baseSize = 3 + Math.sqrt(n.data.degree);
                    n.mesh.scale.set(baseSize, baseSize, baseSize);
                });
                
                if (intersects.length > 0) {
                    const hoveredNode = intersects[0].object;
                    infoPanelContent.id.textContent = hoveredNode.userData.id;
                    infoPanelContent.degree.textContent = hoveredNode.userData.degree;
                    infoPanelContent.text.textContent = hoveredNode.userData.definition;
                    infoPanel.classList.add('active');
                    
                    // Subtle highlight on hover
                    hoveredNode.material.color.setHex(0xffff00);
                    const hoverSize = (3 + Math.sqrt(hoveredNode.userData.degree)) * 1.8;
                    hoveredNode.scale.set(hoverSize, hoverSize, hoverSize);
                } else {
                    infoPanel.classList.remove('active');
                }
            }
        });
        
        document.addEventListener('click', (event) => {
            // Ignore clicks on UI elements
            if (event.target !== renderer.domElement) return;
            
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(nodes.map(n => n.mesh), false);
            
            if (intersects.length > 0) {
                focusedNode = intersects[0].object;
                inFocusMode = true;
                
                const focusedId = focusedNode.userData.id;
                const connectedIds = new Set([focusedId]);
                const connectedEdgeIds = new Set();
                
                // Find all connected nodes
                edgesData.forEach(link => {
                    if (link.source === focusedId) {
                        connectedIds.add(link.target);
                        connectedEdgeIds.add([link.source, link.target].sort().join('-'));
                    } else if (link.target === focusedId) {
                        connectedIds.add(link.source);
                        connectedEdgeIds.add([link.source, link.target].sort().join('-'));
                    }
                });
                
                // Update visibility
                nodes.forEach(n => {
                    if (connectedIds.has(n.data.id)) {
                        n.mesh.material.opacity = n.mesh.userData.originalOpacity;
                        if (n.mesh === focusedNode) {
                            // Highlight focused node
                            n.mesh.material.color.setHex(0x00ff88);
                            const focusSize = (3 + Math.sqrt(n.data.degree)) * 2.5;
                            n.mesh.scale.set(focusSize, focusSize, focusSize);
                        }
                    } else {
                        n.mesh.material.opacity = 0.08;
                    }
                });
                
                // Update edges
                edges.forEach(e => {
                    if (connectedEdgeIds.has([e.userData.source, e.userData.target].sort().join('-'))) {
                        e.material.opacity = e.material.userData.baseOpacity * 1.8;
                        e.material.linewidth = 2;
                    } else {
                        e.visible = false;
                    }
                });
                
                infoPanel.classList.add('active');
                infoPanelContent.id.textContent = focusedNode.userData.id + ' [FOCUSED]';
                infoPanelContent.degree.textContent = focusedNode.userData.degree;
                infoPanelContent.text.textContent = focusedNode.userData.definition;
            }
        });
        
        // Double click to exit focus mode
        document.addEventListener('dblclick', () => {
            if (inFocusMode) {
                inFocusMode = false;
                focusedNode = null;
                
                // Reset all nodes and edges
                nodes.forEach(n => {
                    n.mesh.material.color.setHex(parseInt(colorMap[n.data.community.toString()] || '#888888'.replace('#', ''), 16));
                    const baseSize = 3 + Math.sqrt(n.data.degree);
                    n.mesh.scale.set(baseSize, baseSize, baseSize);
                    n.mesh.material.opacity = n.mesh.userData.originalOpacity;
                });
                
                edges.forEach(e => {
                    e.visible = true;
                    e.material.opacity = e.material.userData.baseOpacity;
                });
                
                infoPanel.classList.remove('active');
                updateDepthFading();
            }
        });
        
        // Mouse wheel zoom
        document.addEventListener('wheel', (event) => {
            event.preventDefault();
            camera.position.z += event.deltaY * 0.15;
            camera.position.z = Math.max(1500, Math.min(12000, camera.position.z));
            updateDepthFading();
        }, { passive: false });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Update stats
        document.getElementById('stat-nodes').textContent = nodesData.length;
        document.getElementById('stat-edges').textContent = edgesData.length + ' (filtered)';
        
        const communities = new Set(nodesData.map(n => n.community));
        document.getElementById('stat-communities').textContent = communities.size;
        
        // Build legend
        const legendContent = document.getElementById('legend-content');
        const sortedCommunities = Array.from(communities).sort((a, b) => a - b);
        
        sortedCommunities.slice(0, 15).forEach(comm => {
            const count = nodesData.filter(n => n.community === comm).length;
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `
                <div class="legend-color" style="background: ${colorMap[comm.toString()] || '#888888'};"></div>
                <span>Community ${comm} (${count})</span>
            `;
            legendContent.appendChild(item);
        });
        
        if (sortedCommunities.length > 15) {
            const moreItem = document.createElement('div');
            moreItem.style.color = '#888';
            moreItem.textContent = `+ ${sortedCommunities.length - 15} more communities`;
            legendContent.appendChild(moreItem);
        }
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            updateDepthFading();
            renderer.render(scene, camera);
        }
        
        // Hide loading and start animation
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            animate();
            console.log('Animation started');
        }, 300);
    </script>
</body>
</html>
'''

# Generate HTML with actual JSON embedded
html_content = html_template.replace(
    '%%NODES_DATA%%',
    json.dumps(nodes_data)
).replace(
    '%%EDGES_DATA%%',
    json.dumps(edges_data)
).replace(
    '%%COLOR_MAP%%',
    json.dumps(color_map)
)

# Write HTML file
with open('base/json/definition_network_3d.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"✓ Generated HTML file: definition_network_3d.html")

print("\n" + "=" * 80)
print("3D VISUALIZATION COMPLETE")
print("=" * 80)
print(f"""
✓ Interactive 3D network visualization created!

File: base/json/definition_network_3d.html

FEATURES:
- 3D force-directed graph with {len(nodes_data)} nodes
- {len(edges_data)} edges representing semantic similarity
- Node size = connectivity (degree)
- Edge thickness = similarity strength
- Color = community membership ({num_communities} communities)

INTERACTIONS:
✓ Left drag: Rotate view
✓ Right drag: Pan camera
✓ Scroll: Zoom in/out
✓ Hover: Show definition details
✓ Click node: Highlight node and connections (fade others)
✓ Double click: Center on node

CONTROLS VISIBLE:
- Bottom left: Key bindings
- Top right: Community legend
- Bottom right: Network statistics
- Top left: Hovered node details

HOW TO USE:
1. Open the HTML file in any modern web browser
2. Use mouse to explore the network
3. Click nodes to see semantic relationships
4. Observe clusters = related definitions
5. Explore the semantic landscape!

This is a standalone file - no internet required after loading.
""")
