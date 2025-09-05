import { NextApiRequest, NextApiResponse } from 'next'
import { seedAdminUser } from '../../../lib/auth'

/**
 * API endpoint to seed the admin user
 * This should only be used during initial setup
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Only allow seeding in development or with a special token
    const isDevelopment = process.env.NODE_ENV === 'development'
    const seedToken = req.headers['x-seed-token']
    const validSeedToken = process.env.SEED_TOKEN || 'dev-seed-token'

    if (!isDevelopment && seedToken !== validSeedToken) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const result = await seedAdminUser()

    if (result.success) {
      return res.status(200).json({
        message: 'Admin user seeded successfully',
        userId: result.userId
      })
    } else {
      return res.status(500).json({
        error: 'Failed to seed admin user',
        details: result.error
      })
    }
  } catch (error) {
    console.error('Seed admin API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}