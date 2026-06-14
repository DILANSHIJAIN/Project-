const axios = require('axios');

/**
 * Performs a web search using Google Custom Search API.
 * @param {string} query - The search query.
 * @returns {Promise<string>} - A concatenated string of search results/snippets.
 */
const performWebSearch = async (query) => {
    const API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
    const CX = process.env.GOOGLE_SEARCH_CX;

    if (!API_KEY || !CX) {
        console.warn("⚠️ Google Search API keys missing. Skipping web search.");
        return "";
    }

    try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}`;
        const response = await axios.get(url, { timeout: 5000 }); // 5 second timeout
        const items = response.data.items || [];
        return items.slice(0, 3).map(item => `Source: ${item.title}\nInfo: ${item.snippet}`).join("\n\n");
    } catch (error) {
        console.error("❌ Google Search API Error:", error.message);
        return "";
    }
};

module.exports = { performWebSearch };