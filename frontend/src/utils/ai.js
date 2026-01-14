// Client-side helper for where to call the AI API. Avoid importing langchain in client bundles.
export const AI_API_ROUTE = '/api/ai';

// Note: The actual LangChain agent and on-chain tools run on the server API route
// at `src/app/api/ai/route.js`. This file intentionally avoids server-only imports so it
// can be safely imported in browser components.

