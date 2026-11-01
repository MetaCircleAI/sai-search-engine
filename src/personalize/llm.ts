import { KNOWLEDGE_BY_ID, KNOWLEDGE_UNITS } from '../knowledge/registry'
import { minutesForCount } from './format'
import { recommendFromRules } from './recommend'
import type {
  AdvisorOutcome,
  AdvisorTurn,
  BackgroundId,
  LearnerRequest,
  PreferredMode,
  Recommendation,
} from './types'

/**
 * Optional language-model adapter.
 * Set VITE_ADVISOR_API_URL to an OpenAI-compatible chat completions endpoint.
 * VITE_ADVISOR_API_KEY and VITE_ADVISOR_MODEL are optional.
 * When the URL is unset, callers must use the library rules instead.
 */

const BACKGROUNDS = new Set<BackgroundId>([
  'beginner',
  'engineer',
  'math-physics',
  'researcher',
  'other',
])

function env(name: string): string | undefined {
  const value = (import.meta.env as Record<string, string | undefined>)[name]
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function advisorEngine(): 'rules' | 'llm' {
  return env('VITE_ADVISOR_API_URL') ? 'llm' : 'rules'
}

type LlmPayload = {
  message?: string
  readyToGenerate?: boolean
  backgroundId?: string | null
  backgroundLabel?: string | null
  goal?: string | null
  timeMinutes?: number | null
  preferredMode?: string | null
  knownPhrases?: string[]
  title?: string
  unitIds?: string[]
  reasons?: Record<string, string>
  coverageNote?: string | null
}

function catalog(): string {
  return KNOWLEDGE_UNITS.map(
    (unit) => `${unit.id} | ${unit.title} | ${unit.description} | ${unit.category}`,
  ).join('\n')
}

const SYSTEM = `You help a learner choose a path through an existing knowledge-unit library.
Never invent lessons, experiments, titles, or unit ids.
Use only ids from the catalog.
Return one JSON object and nothing else:
{
  "message": "one short reply",
  "readyToGenerate": false,
  "backgroundId": "beginner" | "engineer" | "math-physics" | "researcher" | "other" | null,
  "backgroundLabel": string | null,
  "goal": string | null,
  "timeMinutes": number | null,
  "preferredMode": "textbook" | "discovery" | "mixed" | null,
  "knownPhrases": string[],
  "title": string,
  "unitIds": string[],
  "reasons": { "unitId": "why this existing unit is included" },
  "coverageNote": string | null
}
Ask at most one question when the goal or the time budget is missing.
When both are known, set readyToGenerate to true and return an ordered unitIds list.
Put prerequisites before advanced units. Budget about 15 minutes per unit.
If the request is not covered by the catalog, say so in coverageNote and still return the closest real ids.

Catalog:
${catalog()}`

function parsePayload(text: string): LlmPayload {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  return JSON.parse(fenced ? fenced[1] : trimmed) as LlmPayload
}

async function complete(messages: { role: string; content: string }[]): Promise<LlmPayload> {
  const url = env('VITE_ADVISOR_API_URL')
  if (!url) throw new Error('No advisor API is configured')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const key = env('VITE_ADVISOR_API_KEY')
  if (key) headers.Authorization = `Bearer ${key}`
  const model = env('VITE_ADVISOR_MODEL')
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...(model ? { model } : {}),
      temperature: 0.2,
      messages: [{ role: 'system', content: SYSTEM }, ...messages],
    }),
  })
  if (!response.ok) {
    throw new Error(`Advisor request failed (${response.status})`)
  }
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Advisor response was empty')
  }
  return parsePayload(content)
}

function asMode(value: unknown): PreferredMode | null {
  return value === 'textbook' || value === 'discovery' || value === 'mixed'
    ? value
    : null
}

function asBackground(value: unknown): BackgroundId | null {
  return typeof value === 'string' && BACKGROUNDS.has(value as BackgroundId)
    ? (value as BackgroundId)
    : null
}

function cleanIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    if (typeof id !== 'string' || !KNOWLEDGE_BY_ID[id] || seen.has(id)) continue
    seen.add(id)
    out.push(id)
    if (out.length >= 24) break
  }
  return out
}

function requestFromPayload(payload: LlmPayload): LearnerRequest | null {
  const goal = typeof payload.goal === 'string' ? payload.goal.trim() : ''
  const time =
    typeof payload.timeMinutes === 'number' && payload.timeMinutes > 0
      ? payload.timeMinutes
      : null
  if (!goal || !time) return null
  const backgroundId = asBackground(payload.backgroundId) ?? 'other'
  return {
    goal,
    backgroundId,
    backgroundLabel:
      typeof payload.backgroundLabel === 'string' && payload.backgroundLabel.trim()
        ? payload.backgroundLabel.trim()
        : 'Not specified',
    timeMinutes: time,
    preferredMode: asMode(payload.preferredMode) ?? 'mixed',
    knownPhrases: Array.isArray(payload.knownPhrases)
      ? payload.knownPhrases.filter((item): item is string => typeof item === 'string')
      : [],
  }
}

function recommendationFromPayload(
  payload: LlmPayload,
  request: LearnerRequest,
  unitIds: string[],
  dropped: number,
): Recommendation {
  const rules = recommendFromRules(request)
  const reasons: Record<string, string> = {}
  for (const id of unitIds) {
    const fromModel = payload.reasons?.[id]
    reasons[id] =
      typeof fromModel === 'string' && fromModel.trim() && fromModel.length <= 180
        ? fromModel.trim()
        : rules.reasons[id] || 'Selected for your goal from the library.'
  }
  const title =
    typeof payload.title === 'string' &&
    payload.title.trim() &&
    payload.title.trim().length <= 80
      ? payload.title.trim()
      : rules.title
  const coverage =
    typeof payload.coverageNote === 'string' && payload.coverageNote.trim().length <= 280
      ? payload.coverageNote.trim()
      : rules.coverageNote
  return {
    ...rules,
    title,
    goal: request.goal,
    background: request.backgroundLabel,
    backgroundId: request.backgroundId,
    preferredMode: request.preferredMode,
    knownPhrases: request.knownPhrases,
    timeBudgetMinutes: request.timeMinutes,
    unitIds,
    reasons,
    estimatedMinutes: minutesForCount(unitIds.length),
    coverageNote: coverage,
    engine: 'llm',
    engineNote:
      dropped > 0
        ? 'Some ids were not in the library and were removed.'
        : null,
  }
}

export async function recommendWithLlm(
  request: LearnerRequest,
): Promise<Recommendation | null> {
  const payload = await complete([
    {
      role: 'user',
      content: `Build a path. Background: ${request.backgroundLabel} (${request.backgroundId}). Goal: ${request.goal}. Time budget minutes: ${request.timeMinutes}. Mode: ${request.preferredMode}. Already knows: ${request.knownPhrases.join('; ') || 'not specified'}. Set readyToGenerate true.`,
    },
  ])
  const rawCount = Array.isArray(payload.unitIds) ? payload.unitIds.length : 0
  const unitIds = cleanIds(payload.unitIds)
  if (unitIds.length === 0) return null
  return recommendationFromPayload(payload, request, unitIds, rawCount - unitIds.length)
}

export async function adviseWithLlm(history: AdvisorTurn[]): Promise<AdvisorOutcome> {
  const payload = await complete(
    history.map((turn) => ({ role: turn.role, content: turn.content })),
  )
  const message =
    typeof payload.message === 'string' && payload.message.trim()
      ? payload.message.trim()
      : 'Tell me a bit more about what you want to learn.'
  const request = requestFromPayload(payload)
  const rawCount = Array.isArray(payload.unitIds) ? payload.unitIds.length : 0
  const unitIds = cleanIds(payload.unitIds)
  if (!payload.readyToGenerate || !request || unitIds.length === 0) {
    return {
      reply: message,
      ready: false,
      request,
      recommendation: null,
      engine: 'llm',
      engineNote: null,
    }
  }
  return {
    reply: message,
    ready: true,
    request,
    recommendation: recommendationFromPayload(
      payload,
      request,
      unitIds,
      rawCount - unitIds.length,
    ),
    engine: 'llm',
    engineNote: null,
  }
}
