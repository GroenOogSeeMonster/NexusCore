import { NextResponse } from 'next/server'
import { readConfig, writeConfig, DevForgeConfig } from '@/server/config'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { firstName, lastName, email, openaiApiKey } = body || {}

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const current = readConfig()
  if (current.setupCompleted) {
    return NextResponse.json({ error: 'Setup already completed' }, { status: 409 })
  }

  const updated: DevForgeConfig = {
    setupCompleted: true,
    admin: {
      firstName,
      lastName,
      email,
      createdAt: new Date().toISOString(),
    },
    secrets: {
      openaiApiKey: openaiApiKey || current.secrets?.openaiApiKey,
    },
  }

  writeConfig(updated)
  return NextResponse.json({ ok: true })
}


