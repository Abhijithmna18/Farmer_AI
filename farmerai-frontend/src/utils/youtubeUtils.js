// src/utils/youtubeUtils.js

/**
 * Extract YouTube video ID from various YouTube URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} - YouTube video ID or null if not found
 */
export const extractYouTubeVideoId = (url) => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Generate YouTube embed URL from video ID
 * @param {string} videoId - YouTube video ID
 * @param {object} options - Embed options
 * @returns {string} - YouTube embed URL
 */
export const generateYouTubeEmbedUrl = (videoId, options = {}) => {
  if (!videoId) return null;
  
  const defaultOptions = {
    autoplay: 1,
    rel: 0,
    modestbranding: 1,
    showinfo: 0,
    controls: 1,
    ...options
  };
  
  const params = new URLSearchParams(defaultOptions);
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

/**
 * Generate YouTube thumbnail URL from video ID
 * @param {string} videoId - YouTube video ID
 * @param {string} quality - Thumbnail quality (default, medium, high, maxres)
 * @returns {string} - YouTube thumbnail URL
 */
export const generateYouTubeThumbnailUrl = (videoId, quality = 'maxresdefault') => {
  if (!videoId) return null;
  
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault'
  };
  
  const qualityParam = qualityMap[quality] || 'maxresdefault';
  return `https://img.youtube.com/vi/${videoId}/${qualityParam}.jpg`;
};

/**
 * Validate YouTube URL format
 * @param {string} url - YouTube URL to validate
 * @returns {boolean} - True if valid YouTube URL
 */
export const isValidYouTubeUrl = (url) => {
  if (!url) return false;
  
  const youtubePatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]+/
  ];
  
  return youtubePatterns.some(pattern => pattern.test(url));
};

/**
 * Get video platform from URL
 * @param {string} url - Video URL
 * @returns {string} - Platform name (youtube, vimeo, direct, unknown)
 */
export const getVideoPlatform = (url) => {
  if (!url) return 'unknown';
  
  if (isValidYouTubeUrl(url)) return 'youtube';
  
  if (/vimeo\.com/.test(url)) return 'vimeo';
  
  if (/\.(mp4|webm|ogg|avi|mov)$/i.test(url)) return 'direct';
  
  return 'unknown';
};

/**
 * Generate appropriate embed URL based on video platform
 * @param {string} url - Video URL
 * @param {object} options - Embed options
 * @returns {string|null} - Embed URL or null if unsupported
 */
export const generateEmbedUrl = (url, options = {}) => {
  const platform = getVideoPlatform(url);
  
  switch (platform) {
    case 'youtube':
      const videoId = extractYouTubeVideoId(url);
      return generateYouTubeEmbedUrl(videoId, options);
      
    case 'vimeo':
      const vimeoMatch = url.match(/vimeo\.com\/([0-9]+)/);
      if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
      }
      break;
      
    case 'direct':
      return url;
      
    default:
      return null;
  }
  
  return null;
};

/**
 * Get video thumbnail URL based on platform
 * @param {string} url - Video URL
 * @param {string} quality - Thumbnail quality (for YouTube)
 * @returns {string|null} - Thumbnail URL or null if not available
 */
export const getVideoThumbnailUrl = (url, quality = 'maxres') => {
  const platform = getVideoPlatform(url);
  
  switch (platform) {
    case 'youtube':
      const videoId = extractYouTubeVideoId(url);
      return generateYouTubeThumbnailUrl(videoId, quality);
      
    case 'vimeo':
      // Vimeo thumbnails require API call, return null for now
      return null;
      
    case 'direct':
      // For direct video files, we can't generate thumbnails
      return null;
      
    default:
      return null;
  }
};

export default {
  extractYouTubeVideoId,
  generateYouTubeEmbedUrl,
  generateYouTubeThumbnailUrl,
  isValidYouTubeUrl,
  getVideoPlatform,
  generateEmbedUrl,
  getVideoThumbnailUrl
};


