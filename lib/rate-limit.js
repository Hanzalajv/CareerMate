const rateLimitMap = new Map()

export function rateLimit({ interval = 60000, maxRequests = 10 } = {}) {
  return {
    check: (userId) => {
      const now = Date.now()
      const key = userId || 'anonymous'
      
      if (!rateLimitMap.has(key)) {
        rateLimitMap.set(key, [])
      }
      
      const userRequests = rateLimitMap.get(key)
      const recentRequests = userRequests.filter(time => now - time < interval)
      
      if (recentRequests.length >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetIn: Math.ceil((recentRequests[0] + interval - now) / 1000)
        }
      }
      
      recentRequests.push(now)
      rateLimitMap.set(key, recentRequests)
      
      // Clean up old entries every 100 requests
      if (Math.random() < 0.01) {
        rateLimitMap.forEach((times, k) => {
          const valid = times.filter(t => now - t < interval)
          if (valid.length === 0) rateLimitMap.delete(k)
          else rateLimitMap.set(k, valid)
        })
      }
      
      return {
        allowed: true,
        remaining: maxRequests - recentRequests.length
      }
    }
  }
}

// Pre-configured limiters
export const deepDiveLimiter = rateLimit({ interval: 60000, maxRequests: 10 }) // 10 questions per minute
export const journalLimiter = rateLimit({ interval: 60000, maxRequests: 5 })  // 5 saves per minute
export const checklistLimiter = rateLimit({ interval: 60000, maxRequests: 10 })
export const generalLimiter = rateLimit({ interval: 60000, maxRequests: 30 })