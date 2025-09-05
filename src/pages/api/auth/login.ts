import { NextApiRequest, NextApiResponse } from 'next'
import { authenticateUser } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const result = await authenticateUser(email, password)

    if (result.success) {
      return res.status(200).json({
        message: 'Authentication successful',
        user: {
          id: result.user?.id,
          email: result.user?.email
        },
        isAdmin: result.isAdmin,
        bypassUsed: result.bypassUsed
      })
    } else {
      return res.status(401).json({
        error: 'Authentication failed',
        details: (result.error as { message?: string })?.message || 'Invalid credentials'
      })
    }
  } catch (error) {
    console.error('Login API error:', error)
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
}