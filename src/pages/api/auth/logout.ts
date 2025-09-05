import { NextApiRequest, NextApiResponse } from 'next'
import { signOut } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const result = await signOut()

    if (result.success) {
      return res.status(200).json({ message: 'Signed out successfully' })
    } else {
      return res.status(500).json({
        error: 'Sign out failed',
        details: (result.error as { message?: string })?.message
      })
    }
  } catch (error) {
    console.error('Logout API error:', error)
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
}