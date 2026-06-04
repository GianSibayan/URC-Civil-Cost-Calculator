// api/auth.js
// Vercel serverless function — validates email + password
// against USERS environment variable
//
// USERS env variable format (set in Vercel dashboard):
// [{"email":"gian.sibayan@urc.com.ph","password":"xxxx"},...]

export default function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  // Validate that email and password were provided
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Read USERS from Vercel environment variable
  let users;
  try {
    users = JSON.parse(process.env.USERS);
  } catch (e) {
    console.error('Failed to parse USERS env variable:', e);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Find user by email and password
  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Generate a simple session token
  // Token = base64 encode of email + timestamp + secret
  const secret = process.env.ADMIN_SECRET || 'urc-ccc-secret';
  const tokenPayload = `${user.email}:${Date.now()}:${secret}`;
  const token = Buffer.from(tokenPayload).toString('base64');

  return res.status(200).json({
    success: true,
    token,
    email: user.email,
  });
}