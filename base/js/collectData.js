const https = require('https');
const fs = require('fs');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

// Configuration
const OUTPUT_FILE = './data/collected-data.json';

// Ensure data directory exists
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

// Calculate semantic similarity between two texts
function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
  const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);
  
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return union > 0 ? intersection / union : 0;
}

// Create similarity matrix between entries
function createSimilarityMatrix(definitions) {
  const n = definitions.length;
  const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = calculateTextSimilarity(
        definitions[i].definition,
        definitions[j].definition
      );
      matrix[i][j] = sim;
      matrix[j][i] = sim;
    }
  }
  
  return matrix;
}

// Force-directed layout simulation (2D spring layout)
function computeForceDirectedLayout(definitions, width = 100, height = 100) {
  const n = definitions.length;
  const positions = Array(n).fill(0).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: 0,
    vy: 0
  }));
  
  const similarity = createSimilarityMatrix(definitions);
  
  // Simulation parameters
  const iterations = 300;
  const k = 5; // Repulsion strength
  const c = 0.1; // Spring strength
  const damping = 0.85;
  const minDist = 3; // Minimum distance to prevent overlap
  
  console.log('\n🔄 Computing force-directed layout...');
  
  for (let iter = 0; iter < iterations; iter++) {
    // Reset velocities with damping
    for (let i = 0; i < n; i++) {
      positions[i].vx *= damping;
      positions[i].vy *= damping;
    }
    
    // Calculate pairwise forces
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dist = Math.max(minDist, Math.sqrt(dx * dx + dy * dy));
        
        // Repulsion (always push apart)
        const repulsion = k / (dist * dist);
        positions[i].vx -= (dx / dist) * repulsion;
        positions[i].vy -= (dy / dist) * repulsion;
        positions[j].vx += (dx / dist) * repulsion;
        positions[j].vy += (dy / dist) * repulsion;
        
        // Attraction based on similarity (pull similar items together)
        const sim = similarity[i][j];
        if (sim > 0.2) {
          const attraction = sim * c * dist;
          positions[i].vx += (dx / dist) * attraction;
          positions[i].vy += (dy / dist) * attraction;
          positions[j].vx -= (dx / dist) * attraction;
          positions[j].vy -= (dy / dist) * attraction;
        }
      }
    }
    
    // Center attraction (keep things centered)
    const centerX = width / 2;
    const centerY = height / 2;
    for (let i = 0; i < n; i++) {
      const dx = centerX - positions[i].x;
      const dy = centerY - positions[i].y;
      positions[i].vx += dx * 0.01;
      positions[i].vy += dy * 0.01;
    }
    
    // Update positions
    for (let i = 0; i < n; i++) {
      positions[i].x += positions[i].vx;
      positions[i].y += positions[i].vy;
      
      // Boundary conditions (soft walls)
      if (positions[i].x < 5) {
        positions[i].x = 5;
        positions[i].vx = 0;
      }
      if (positions[i].x > width - 5) {
        positions[i].x = width - 5;
        positions[i].vx = 0;
      }
      if (positions[i].y < 5) {
        positions[i].y = 5;
        positions[i].vy = 0;
      }
      if (positions[i].y > height - 5) {
        positions[i].y = height - 5;
        positions[i].vy = 0;
      }
    }
    
    if (iter % 50 === 0) {
      console.log(`  Iteration ${iter}/${iterations}`);
    }
  }
  
  console.log('✅ Layout computed!\n');
  return positions;
}

// Function to fetch definition and extract words
async function fetchAndExpandWord(word, existingWords, allData) {
  console.log(`  Expanding with: ${word}`);
  const defUrl = `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)}`;
  
  try {
    const defHtml = await fetchWithPuppeteer(defUrl);
    const $ = cheerio.load(defHtml);
    
    let foundDef = false;
    
    // Extract first definition entry only to keep it manageable
    $('.definition').first().each((index, el) => {
      const upvotes = $(el).find('[data-x-text="upCount"]').first().text().trim();
      const downvotes = $(el).find('[data-x-text="downCount"]').first().text().trim();
      const dateNode = $(el).find(".contributor").contents()[2];
      const date = dateNode ? dateNode.data.trim() : 'N/A';
      
      const definition = $(el).find('.meaning').prop('innerText') || '';
      const example = $(el).find('.example').prop('innerText') || '';
      
      if (definition.trim().length > 0) {
        allData.push({
          word,
          definition,
          example,
          author: $(el).find('.contributor a').prop('innerText') || '',
          date: date,
          thumbs_up: parseNumber(upvotes),
          thumbs_down: parseNumber(downvotes),
        });
        
        foundDef = true;
        
        // Extract new words from this definition
        const newWords = extractWordsFromText(definition + ' ' + example);
        newWords.forEach(w => {
          if (!existingWords.has(w) && !allData.some(d => d.word.toLowerCase() === w)) {
            existingWords.add(w);
          }
        });
      }
    });
    
    return foundDef;
  } catch (error) {
    console.error(`    Error fetching ${word}:`, error.message);
    return false;
  }
}

// Function to fetch with Puppeteer and wait for Alpine.js to render
async function fetchWithPuppeteer(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for Alpine.js to update the thumbs data
    await page.waitForFunction(() => {
      const upCount = document.querySelector('[data-x-text="upCount"]');
      return upCount && upCount.textContent && upCount.textContent.trim().length > 0;
    }, { timeout: 10000 }).catch(() => {
      console.log('Alpine.js data not found, continuing anyway...');
    });
    
    const html = await page.content();
    await page.close();
    await browser.close();
    return html;
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

// Extract words from homepage and get definitions with thumbs
async function collectData() {
  const allData = [];
  const processedWords = new Set();

  console.log('Starting data collection...');
  
  try {
    // Phase 1: Fetch homepage with Puppeteer to get initial words
    console.log('\n=== Phase 1: Collecting from homepage ===');
    const homeHtml = await fetchWithPuppeteer('https://www.urbandictionary.com/');
    
    const homeWords = [];
    const linkRegex = /href="\/define\.php\?term=([^"]+)"/g;
    let match;
    
    while ((match = linkRegex.exec(homeHtml)) !== null) {
      let word = decodeURIComponent(match[1]);
      word = word.trim();
      
      if (word.length > 0 && !homeWords.includes(word)) {
        homeWords.push(word);
        processedWords.add(word.toLowerCase());
      }
    }
    
    console.log(`Extracted ${homeWords.length} words from homepage:`, homeWords);
    
    if (homeWords.length === 0) {
      console.log('No words found on homepage');
      return;
    }

    // Fetch all homepage words
    for (const word of homeWords) {
      console.log(`Fetching: ${word}`);
      const defUrl = `https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)}`;
      
      try {
        const defHtml = await fetchWithPuppeteer(defUrl);
        const $ = cheerio.load(defHtml);
        
        // Extract each definition entry
        $('.definition').each((index, el) => {
          const upvotes = $(el).find('[data-x-text="upCount"]').first().text().trim();
          const downvotes = $(el).find('[data-x-text="downCount"]').first().text().trim();
          const dateNode = $(el).find(".contributor").contents()[2];
          const date = dateNode ? dateNode.data.trim() : 'N/A';
          
          allData.push({
            word,
            definition: $(el).find('.meaning').prop('innerText') || '',
            example: $(el).find('.example').prop('innerText') || '',
            author: $(el).find('.contributor a').prop('innerText') || '',
            date: date,
            thumbs_up: parseNumber(upvotes),
            thumbs_down: parseNumber(downvotes),
          });
        });
      } catch (error) {
        console.error(`Error fetching ${word}:`, error.message);
      }
    }

    console.log(`\nCollected ${allData.length} definitions from homepage`);
    
    // Phase 2: Extract words from definitions and expand
    console.log('\n=== Phase 2: Expanding with words from definitions ===');
    
    const wordsToExpand = new Set();
    
    // Extract words from all collected definitions
    allData.forEach(entry => {
      const words = extractWordsFromText(entry.definition + ' ' + entry.example);
      words.forEach(w => {
        if (!processedWords.has(w)) {
          wordsToExpand.add(w);
        }
      });
    });
    
    console.log(`Found ${wordsToExpand.size} new words to expand from definitions`);
    console.log('Expanding with first 10 new words to keep it manageable...');
    
    let expandCount = 0;
    const maxExpand = 10;
    
    for (const word of wordsToExpand) {
      if (expandCount >= maxExpand) break;
      
      const found = await fetchAndExpandWord(word, wordsToExpand, allData);
      if (found) {
        expandCount++;
        processedWords.add(word);
      }
    }
    
    console.log(`\nExpanded with ${expandCount} new words`);

    // Compute force-directed layout for positioning
    console.log('Computing 2D positions based on semantic similarity...');
    const positions = computeForceDirectedLayout(allData, 100, 100);
    
    // Add positions to data
    allData.forEach((entry, index) => {
      entry.x = positions[index].x;
      entry.y = positions[index].y;
    });

    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
    console.log(`\nData saved to ${OUTPUT_FILE}`);
    console.log(`Total entries collected: ${allData.length}`);
    
    // Also create an HTML table
    createHtmlTable(allData);
  } catch (error) {
    console.error('Error in collectData:', error.message);
  }
}

// Function to create an HTML table
function createHtmlTable(data) {
  if (data.length === 0) {
    console.log('No data to create table');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Urban Dictionary Data Table</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Urban Dictionary Data Table</h1>
  <table>
    <tr>
      <th>Word</th>
      <th>Definition</th>
      <th>Example</th>
      <th>Author</th>
      <th>Thumbs Up</th>
      <th>Thumbs Down</th>
    </tr>
    ${data.map(row => `
    <tr>
      <td>${row.word}</td>
      <td>${row.definition.substring(0, 100)}...</td>
      <td>${row.example ? row.example.substring(0, 80) + '...' : 'N/A'}</td>
      <td>${row.author}</td>
      <td>${row.thumbs_up}</td>
      <td>${row.thumbs_down}</td>
    </tr>
    `).join('')}
  </table>
</body>
</html>
  `;

  fs.writeFileSync('./data/table.html', htmlContent);
  console.log('HTML table saved to ./data/table.html');
}

// Run the collection
collectData().catch(console.error);
