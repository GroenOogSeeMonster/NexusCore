import fs from 'fs'
import path from 'path'

export interface DevForgeConfig {
  setupCompleted: boolean
  admin?: {
    firstName: string
    lastName: string
    email: string
    createdAt: string
  }
  secrets?: {
    openaiApiKey?: string
  }
}

const DATA_DIR = path.join(process.cwd(), 'data')
const CONFIG_PATH = path.join(DATA_DIR, 'config.json')

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function readConfig(): DevForgeConfig {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return { setupCompleted: false }
    }
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    return parsed as DevForgeConfig
  } catch {
    return { setupCompleted: false }
  }
}

export function writeConfig(config: DevForgeConfig): void {
  ensureDataDir()
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

export function getOpenAIApiKey(): string | undefined {
  const cfg = readConfig()
  return cfg.secrets?.openaiApiKey || process.env.OPENAI_API_KEY
}


