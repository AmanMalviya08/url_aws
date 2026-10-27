const rateLimit = require('express-rate-limit');

// General API limiter (e.g., for creating URLs)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter limiter for the redirection route (optional, to prevent scanning)
const redirectLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 redirection attempts per minute
  message: { error: 'Too many redirects, please slow down.' }
});

module.exports = { apiLimiter, redirectLimiter };
