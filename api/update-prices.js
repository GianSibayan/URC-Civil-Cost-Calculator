// api/update-prices.js
// Vercel serverless function — validates session token
// then pushes updated prices.json to GitHub
//
// Required env variables (set in Vercel dashboard):
// GITHUB_TOKEN      — personal access token with repo write access
// GITHUB_REPO       — GianSibayan/URC-Civil-Cost-Calculator
// GITHUB_FILE_PATH  — prices.json
// ADMIN_SECRET      — secret used when generating session tokens

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate session token from Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  // Decode and validate token
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, timestamp, secret] = decoded.split(':');
    const expectedSecret = process.env.ADMIN_SECRET || 'urc-ccc-secret';

    // Check secret matches
    if (secret !== expectedSecret) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check token is not older than 24 hours
    const tokenAge = Date.now() - parseInt(timestamp);
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (tokenAge > twentyFourHours) {
      return res.status(401).json({ error: 'Token expired, please log in again' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Get updated prices from request body
  const { prices } = req.body;
  if (!prices) {
    return res.status(400).json({ error: 'No prices data provided' });
  }

  // Validate prices is valid JSON structure
  try {
    JSON.stringify(prices);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid prices data format' });
  }

  // Push to GitHub
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO;
  const GITHUB_FILE_PATH = process.env.GITHUB_FILE_PATH;

  if (!GITHUB_TOKEN || !GITHUB_REPO || !GITHUB_FILE_PATH) {
    return res.status(500).json({ error: 'GitHub configuration missing' });
  }

  try {
    // Step 1 — Get current file SHA (required by GitHub API to update a file)
    const getFileRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const fileData = await getFileRes.json();
    const sha = fileData.sha;

    // Step 2 — Push updated prices.json
    const updatedContent = Buffer.from(
      JSON.stringify(prices, null, 2)
    ).toString('base64');

    const updateRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update prices.json via CCC admin panel',
          content: updatedContent,
          sha,
        }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json();
      console.error('GitHub push failed:', err);
      return res.status(500).json({ error: 'Failed to update prices on GitHub' });
    }

    return res.status(200).json({ success: true, message: 'Prices updated successfully' });

  } catch (e) {
    console.error('Error pushing to GitHub:', e);
    return res.status(500).json({ error: 'Server error while updating prices' });
  }
}