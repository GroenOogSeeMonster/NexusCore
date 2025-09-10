import { NextResponse } from 'next/server'
import { readConfig } from '@/server/config'

export async function GET() {
  const cfg = readConfig()
  return NextResponse.json({ setupCompleted: cfg.setupCompleted, admin: cfg.admin ?? null })
}


