// api/update-prices.js
// Vercel serverless function — validates session token
// then pushes a target JSON file to GitHub
//
// Required env variables (set in Vercel dashboard):
// GITHUB_TOKEN  — personal access token with repo write access
// GITHUB_REPO   — GianSibayan/URC-Civil-Cost-Calculator
// ADMIN_SECRET  — secret used when generating session tokens
//
// GITHUB_FILE_PATH env var is no longer used —
// filename is now passed in the request body and validated
// against ALLOWED_FILES whitelist below

const ALLOWED_FILES = [
  'prices.json',
  'data/concreting_materials.json',
  'data/timber_formworks.json',
  'data/roofing.json',
  'data/steel_truss.json',
  'data/painting_works.json',
  'data/electrical.json',
  'data/masonry.json',
  'data/fencing.json',
  'data/ceiling.json',
  'data/plumbing.json',
  'data/rebars.json',
  'data/concrete_mix.json',
  'data/equipment.json',
  'data/pipes.json',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate session token
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, timestamp, secret] = decoded.split(':');
    const expectedSecret = process.env.ADMIN_SECRET || 'urc-ccc-secret';

    if (secret !== expectedSecret) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return res.status(401).json({ error: 'Token expired, please log in again' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Get filename and prices from request body
  const { prices, filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: 'No filename provided' });
  }

  if (!ALLOWED_FILES.includes(filename)) {
    return res.status(400).json({ error: `Invalid filename: ${filename}` });
  }

  if (!prices) {
    return res.status(400).json({ error: 'No prices data provided' });
  }

  try {
    JSON.stringify(prices);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid prices data format' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO  = process.env.GITHUB_REPO;

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return res.status(500).json({ error: 'GitHub configuration missing' });
  }

  try {
    // Step 1 — Get current file SHA
    const getFileRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const fileData = await getFileRes.json();
    const sha = fileData.sha;

    // Step 2 — Push updated file
    const updatedContent = Buffer.from(
      JSON.stringify(prices, null, 2)
    ).toString('base64');

    const updateRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update ${filename} via CCC admin panel`,
          content: updatedContent,
          sha,
        }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json();
      console.error('GitHub push failed:', err);
      return res.status(500).json({ error: 'Failed to update file on GitHub', detail: err.message, status: updateRes.status });
    }

    return res.status(200).json({ success: true, message: `${filename} updated successfully` });

  } catch (e) {
    console.error('Error pushing to GitHub:', e);
    return res.status(500).json({ error: 'Server error while updating file' });
  }
}