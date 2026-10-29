/**
 * Environment configuration.
 * Strictly reads process.env directly without fallback/default values.
 */
export const env = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
};
