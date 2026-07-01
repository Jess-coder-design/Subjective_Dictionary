/**
 * Utility Functions - Math, text processing, and helpers
 */

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function jitter() {
    return (Math.random() - 0.5) * 0.01; // Minimal jitter - only prevent exact overlaps, let semantic clustering emerge
}

function truncateDefinition(text, wordCount = 5) {
    const words = text.split(' ');
    if (words.length > wordCount) {
        return words.slice(0, wordCount).join(' ') + '...';
    }
    return text;
}

function extractKeywords(text) {
    const words = text.toLowerCase()
        .match(/\b[a-z]+\b/g) || [];
    
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'is', 'are', 'am', 'be', 'been', 'have', 'has', 'do', 'does',
        'did', 'will', 'would', 'could', 'should', 'can', 'may', 'must',
        'from', 'by', 'with', 'as', 'that', 'this', 'it', 'you', 'me',
        'i', 'we', 'they', 'he', 'she', 'what', 'which', 'when', 'where',
        'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
        'some', 'any', 'no', 'not', 'just', 'also', 'so', 'than', 'very',
        'too', 'your', 'their', 'my', 'his', 'her', 'its', 'our', 'if',
        'because', 'about', 'than', 'through', 'after', 'before', 'between',
        'into', 'like', 'up', 'out', 'then', 'while', 'same', 'such', 'only',
        'own', 'being', 'having', 'there', 'over', 'then', 'under'
    ]);
    
    return words.filter(w => !stopWords.has(w));
}

function cosineSimilarity(vec1, vec2) {
    if (vec1.length === 0 || vec2.length === 0) return 0;
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < Math.min(vec1.length, vec2.length); i++) {
        dotProduct += vec1[i] * vec2[i];
        mag1 += vec1[i] * vec1[i];
        mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
}

function calculateSimilarity(keywords1, keywords2) {
    const s1 = new Set(keywords1);
    const s2 = new Set(keywords2);
    const intersection = [...s1].filter(x => s2.has(x)).length;
    const union = new Set([...s1, ...s2]).size;
    return union === 0 ? 0 : intersection / union;
}
