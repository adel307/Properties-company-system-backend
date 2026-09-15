export function requireApiKey(req, res, next) {
  if (!process.env.API_KEY || req.get('x-api-key') === process.env.API_KEY) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}
