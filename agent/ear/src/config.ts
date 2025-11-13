// Frontend configuration
// In production, these would be set during build time via process.env
// For development, we use defaults that match the server configuration

export const config = {
  REASON_SERVER_URL: process.env.REACT_APP_REASON_SERVER_URL || 'http://localhost:4200',
  HTTP_TIMEOUT_MS: 30000, // 30 seconds

  // API endpoints
  endpoints: {
    silenceDetect: '/silence_detect',
    conversation: '/conversation',
  },

  // Get full URL for an endpoint
  getUrl: (endpoint: keyof typeof config.endpoints): string => {
    return `${config.REASON_SERVER_URL}${config.endpoints[endpoint]}`;
  },

  // Fetch with timeout helper
  fetchWithTimeout: async (url: string, options: RequestInit = {}, timeoutMs: number = config.HTTP_TIMEOUT_MS): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  },
};

export default config;
