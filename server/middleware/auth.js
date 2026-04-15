const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// This middleware intercepts the request and verifies the Clerk JWT token.
// If valid, it adds req.auth which contains the userId.
const auth = ClerkExpressRequireAuth({
  // options if needed
});

module.exports = auth;
