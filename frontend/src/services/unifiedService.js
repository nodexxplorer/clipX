/**
 * Unified Service
 * Handles searching external sources for download links
 */

const API_BASE = process.env.NEXT_PUBLIC_API_REST_URL || 'http://localhost:8000/api';

export const unifiedService = {
  /**
   * Search for content across providers
   * @param {string} query 
   * @returns {Promise<Array>}
   */
  search: async (query) => {
    try {
      // In a real implementation, this might call multiple endpoints or a specialized backend service.
      // For now, we search for the movie and return the response.
      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      
      // Transform SearchResult into UnifiedResult format for the UI
      return (data.results || []).map(item => ({
        title: item.title,
        provider: 'MovieBox',
        quality: '1080p', // Fallback as list view doesn't always have quality
        size: 'N/A',
        link: `/movies/${item.id}`, // Link to the detail page for streaming/download options
        type: item.type === 'movie' ? 'Movie' : 'Series',
        description: item.description
      }));
    } catch (error) {
      console.error('Unified search error:', error);
      return [];
    }
  }
};

export default unifiedService;
