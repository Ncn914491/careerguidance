#!/usr/bin/env node

/**
 * Script to help clear Next.js cache and restart development server
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧹 Clearing Next.js cache and temporary files...\n')

try {
  // Clear Next.js cache
  const nextCacheDir = path.join(process.cwd(), '.next')
  if (fs.existsSync(nextCacheDir)) {
    console.log('📁 Removing .next directory...')
    fs.rmSync(nextCacheDir, { recursive: true, force: true })
    console.log('✅ .next directory removed')
  }

  // Clear node_modules/.cache if it exists
  const nodeCacheDir = path.join(process.cwd(), 'node_modules', '.cache')
  if (fs.existsSync(nodeCacheDir)) {
    console.log('📁 Removing node_modules/.cache...')
    fs.rmSync(nodeCacheDir, { recursive: true, force: true })
    console.log('✅ node_modules/.cache removed')
  }

  // Clear any temporary files
  const tempFiles = ['.swc', 'tsconfig.tsbuildinfo']
  tempFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      console.log(`📁 Removing ${file}...`)
      fs.rmSync(filePath, { recursive: true, force: true })
      console.log(`✅ ${file} removed`)
    }
  })

  console.log('\n✨ Cache cleared successfully!')
  console.log('\n📋 Next steps:')
  console.log('1. Restart your development server: npm run dev')
  console.log('2. Hard refresh your browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)')
  console.log('3. Clear browser cache if needed')

} catch (error) {
  console.error('❌ Error clearing cache:', error.message)
  process.exit(1)
}