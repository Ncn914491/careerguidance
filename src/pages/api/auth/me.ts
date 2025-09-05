import { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { user, isAdmin, isSeededAdmin } = await getCurrentUser()

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email
      },
      isAdmin,
      isSeededAdmin: isSeededAdmin || false
    })
  } catch (error) {
    console.error('Get user API error:', error)
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
}