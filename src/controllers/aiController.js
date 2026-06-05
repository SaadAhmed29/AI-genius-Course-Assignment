// GET /api/ai/free-model  —  all logged-in users
function freeModel(req, res) {
  return res.status(200).json({
    status:  'success',
    model:   'ai-genius-lite-v1',
    message: `Hello ${req.user.email}! Here is your free-tier AI response.`,
    output:  'The quick brown fox jumps over the lazy dog. [free model output]',
  });
}

// POST /api/ai/premium-model  —  Premium_User and Admin only
function premiumModel(req, res) {
  return res.status(200).json({
    status:  'success',
    model:   'ai-genius-pro-v3',
    message: `Premium access granted for ${req.user.email} (${req.user.role}).`,
    output:  'Highly detailed AI-generated text from the premium model... [premium output]',
    creditsUsed: 5,
  });
}

// DELETE /api/ai/purge-cache  —  Admin only
function purgeCache(req, res) {
  return res.status(200).json({
    status:  'success',
    message: `Cache purged by admin: ${req.user.email}`,
    clearedAt: new Date().toISOString(),
  });
}

module.exports = { freeModel, premiumModel, purgeCache };
