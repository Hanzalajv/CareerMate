/**
 * Sanitizes user input before sending to AI or saving to DB
 */
export function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return ''
  
  return text
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Trim whitespace
    .trim()
    // Limit length (prevents token abuse)
    .substring(0, 2000)
}

/**
 * Sanitizes display names (stricter)
 */
export function sanitizeDisplayName(name) {
  if (!name || typeof name !== 'string') return ''
  
  return name
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s\-'.]/g, '')
    .trim()
    .substring(0, 50)
}

/**
 * Sanitizes email (basic)
 */
export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return ''
  
  return email
    .replace(/<[^>]*>/g, '')
    .trim()
    .toLowerCase()
    .substring(0, 255)
}