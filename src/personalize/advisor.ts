import { clip, formatMinutes } from './format'
import { adviseWithLlm, advisorEngine, recommendWithLlm } from './llm'
import { recommendFromRules } from './recommend'
import type {
  AdvisorOutcome,
  AdvisorTurn,
  BackgroundId,
  LearnerRequest,
  PreferredMode,
  Recommendation,
} from './types'

type QuestionKind = 'goal' | 'foundations' | 'focus' | 'time'

type Slots = {
  backgroundId: BackgroundId | null
  backgroundLabel: string | null
  goal: string | null
  timeMinutes: number | null
  preferredMode: PreferredMode | null
  knownPhrases: string[]
  foundations: 'yes' | 'no' | null
  focus: string | null
}

const SPECIFIC = [
  'transformer',
  'attention',
  'grok',
  'diffusion',
  'gan',
  'vae',
  'cnn',
  'rnn',
  'lstm',
  'adam',
  'spectral',
  'collapse',
  'physics',
  'kernel',
  'scaling',
  'embedding',
  'residual',
  'normaliz',
  'pca',
  'autoencoder',
  'perceptron',
  'regression',
  'momentum',
  'decay',
  'neuron',
  'kan',
  'superposition',
  'renormal',
  'bottleneck',
  'positional',
  'convolution',
  'recurrent',
]

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
}

function emptySlots(): Slots {
  return {
    backgroundId: null,
    backgroundLabel: null,
    goal: null,
    timeMinutes: null,
    preferredMode: null,
    knownPhrases: [],
    foundations: null,
    focus: null,
  }
}

export function openingMessage(engine: 'rules' | 'llm' = advisorEngine()): string {
  if (engine === 'llm') {
    return 'Tell me your background and what you want to learn. I can only choose knowledge units that already exist in the library.'
  }
  return 'Tell me your background and what you want to learn. For example: “I’m a physics student and want to understand modern deep learning in two hours.”\n\nThis advisor follows library rules. A language model is not connected, and it will not invent lessons.'
}

function questionKind(content: string): QuestionKind | null {
  if (/what do you want to learn/i.test(content)) return 'goal'
  if (/gradient descent and basic neural networks/i.test(content)) return 'foundations'
  if (/what should the path focus on/i.test(content)) return 'focus'
  if (/how much time do you have/i.test(content)) return 'time'
  return null
}

function wordNumber(raw: string): number | null {
  if (/^\d+(?:\.\d+)?$/.test(raw)) return Number(raw)
  return NUMBER_WORDS[raw] ?? null
}

function parseTime(text: string): number | null {
  const lower = text.toLowerCase()
  if (/\b(half an hour|30 minutes|thirty minutes)\b/.test(lower)) return 30
  if (/\b(a couple of hours|two hours)\b/.test(lower)) return 120
  if (/\b(a day|one day|all day)\b/.test(lower)) return 360
  if (/\b(a week|one week)\b/.test(lower)) return 600
  const hours = lower.match(
    /\b(one|two|three|four|five|six|seven|eight|an?|\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/,
  )
  if (hours) {
    const amount = wordNumber(hours[1])
    if (amount) return Math.round(amount * 60)
  }
  const minutes = lower.match(/\b(\d+)\s*(?:minutes?|mins?)\b/)
  if (minutes) return Math.max(15, Number(minutes[1]))
  const days = lower.match(/\b(\d+)\s*days?\b/)
  if (days) return Number(days[1]) * 360
  const weeks = lower.match(/\b(\d+)\s*weeks?\b/)
  if (weeks) return Number(weeks[1]) * 600
  return null
}

function parseBackground(text: string): { id: BackgroundId; label: string } | null {
  const lower = text.toLowerCase()
  if (/\b(no prior|beginner|new to (?:ai|ml|machine learning)|just starting)\b/.test(lower)) {
    return { id: 'beginner', label: 'Beginner' }
  }
  if (/\b(machine learning researcher|ml researcher|researcher)\b/.test(lower)) {
    return { id: 'researcher', label: 'Machine Learning Researcher' }
  }
  if (/\b(software engineer|developer|programmer|engineer)\b/.test(lower)) {
    return { id: 'engineer', label: 'Software Engineer' }
  }
  if (/\b(physics|physicist|mathematics|mathematician|math student|maths)\b/.test(lower)) {
    return { id: 'math-physics', label: 'Mathematics / Physics' }
  }
  const student = lower.match(/\b([a-z]{3,}(?:\s+[a-z]+)?)\s+student\b/)
  if (student) {
    const label = student[1].replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    return { id: 'other', label }
  }
  return null
}

function parseMode(text: string): PreferredMode | null {
  const lower = text.toLowerCase()
  if (/\b(textbook|explanation first|read first)\b/.test(lower)) return 'textbook'
  if (/\b(discovery|experiment first|hands-on|hands on)\b/.test(lower)) return 'discovery'
  if (/\b(mixed|you decide|either is fine)\b/.test(lower)) return 'mixed'
  return null
}

function parseGap(text: string): string | null {
  const match =
    text.match(/(?:don'?t|do not) understand\s+([^.?!]+)/i) ||
    text.match(/(?:unfamiliar with|confused about|never learned)\s+([^.?!]+)/i)
  if (!match) return null
  return match[1].replace(/^(?:the|how)\s+/i, '').trim()
}

function topicText(goal: string): string {
  return goal
    .replace(
      /\b(?:i'm|i am|as)\s+an?\s+[^.?!]*?\b(?:student|researcher|engineer|physicist|mathematician|developer)\b/gi,
      ' ',
    )
    .replace(/\b(?:physics|math|mathematics)\s+(?:student|background|major)\b/gi, ' ')
}

function isBroad(goal: string): boolean {
  const text = topicText(goal).toLowerCase()
  if (SPECIFIC.some((word) => text.includes(word))) return false
  return /\b(deep learning|machine learning|neural networks?|artificial intelligence|\bai\b)\b/.test(
    text,
  )
}

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    const key = trimmed.toLowerCase()
    if (!trimmed || seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
  }
  return out
}

function applyUser(slots: Slots, text: string, answering: QuestionKind | null) {
  const time = parseTime(text)
  if (time) slots.timeMinutes = time
  const background = parseBackground(text)
  if (background) {
    slots.backgroundId = background.id
    slots.backgroundLabel = background.label
  }
  const mode = parseMode(text)
  if (mode) slots.preferredMode = mode

  const known = text.match(/(?:already know|i know|familiar with)\s+([^.?!]+)/i)
  if (known) slots.knownPhrases.push(known[1].trim())

  if (answering === 'foundations') {
    const gap = parseGap(text)
    if (gap) slots.focus = gap
    if (/^\s*(yes|yeah|yep|yup)\b/i.test(text) || /\bi (already )?know\b/i.test(text)) {
      slots.foundations = 'yes'
      slots.knownPhrases.push('gradient descent', 'neural networks')
    } else if (
      !gap &&
      (/^\s*(no|nope|not really)\b/i.test(text) || /\b(?:don't|do not) know\b/i.test(text))
    ) {
      slots.foundations = 'no'
    } else if (!gap && text.trim().length > 1) {
      slots.focus = text.trim().replace(/[.?!]+$/g, '')
    }
    return
  }

  if (answering === 'focus') {
    slots.focus = text.trim().replace(/[.?!]+$/g, '')
    return
  }

  if (answering === 'goal') {
    slots.goal = text.trim()
    return
  }

  if (answering === 'time') return

  const gap = parseGap(text)
  if (gap) slots.focus = gap
  if (text.trim().length > 12) slots.goal = text.trim()
}

function effectiveGoal(slots: Slots): string | null {
  if (slots.focus) return `I want to understand ${slots.focus}.`
  return slots.goal
}

function toRequest(slots: Slots): LearnerRequest | null {
  const goal = effectiveGoal(slots)
  if (!goal || !slots.timeMinutes) return null
  if (!slots.focus && isBroad(goal) && slots.foundations == null) return null
  if (!slots.focus && isBroad(goal) && slots.foundations === 'yes') return null
  return {
    goal,
    backgroundId: slots.backgroundId ?? 'other',
    backgroundLabel: slots.backgroundLabel ?? 'Not specified',
    timeMinutes: slots.timeMinutes,
    preferredMode: slots.preferredMode ?? 'mixed',
    knownPhrases: unique(slots.knownPhrases),
  }
}

function nextQuestion(slots: Slots): QuestionKind {
  if (!slots.goal && !slots.focus) return 'goal'
  if (!slots.focus && slots.goal && isBroad(slots.goal) && slots.foundations == null) {
    return 'foundations'
  }
  if (!slots.focus && slots.goal && isBroad(slots.goal) && slots.foundations === 'yes') {
    return 'focus'
  }
  if (!slots.timeMinutes) return 'time'
  return 'goal'
}

function readyReply(slots: Slots, goal: string): string {
  const focus = slots.focus?.toLowerCase() ?? ''
  let lead: string
  if (/transformer|attention/.test(focus)) {
    lead = 'I’ll focus on attention mechanisms and the units that lead into them'
  } else if (slots.focus) {
    lead = `I’ll focus on ${slots.focus} and the units that lead into it`
  } else if (isBroad(goal)) {
    lead = 'I’ll start from the closest foundations and take a short tour of the library'
  } else {
    lead = `I’ll build a path for “${clip(goal, 80).replace(/[.?!]+$/g, '')}”`
  }
  const skip =
    slots.foundations === 'yes'
      ? ', and skip the early network and gradient units you already know'
      : ''
  const time = slots.timeMinutes ? ` About ${formatMinutes(slots.timeMinutes)}.` : ''
  const who = slots.backgroundLabel ? ` Audience: ${slots.backgroundLabel}.` : ''
  const mode = slots.preferredMode ?? 'mixed'
  const modeBit =
    mode === 'mixed'
      ? ' Learning mode is mixed, and you can change it before you start.'
      : ` Learning mode: ${mode}.`
  return `${lead}${skip}. Every step is an existing knowledge unit.${time}${who}${modeBit}`
}

function rulesTurn(history: AdvisorTurn[]): AdvisorOutcome {
  const slots = emptySlots()
  let pending: QuestionKind | null = null
  for (const turn of history) {
    if (turn.role === 'assistant') {
      pending = questionKind(turn.content)
      continue
    }
    applyUser(slots, turn.content, pending)
    pending = null
  }

  const request = toRequest(slots)
  if (request) {
    return {
      reply: readyReply(slots, request.goal),
      ready: true,
      request,
      recommendation: recommendFromRules(request),
      engine: 'rules',
      engineNote: null,
    }
  }

  const ask = nextQuestion(slots)
  const previous = [...history]
    .reverse()
    .find((turn) => turn.role === 'assistant')
  const previousKind = previous ? questionKind(previous.content) : null
  if (ask === 'time' && previousKind === 'time') {
    return {
      reply: 'I didn’t catch a duration. Try “30 minutes”, “2 hours”, “1 day”, or “1 week”.',
      ready: false,
      request: null,
      recommendation: null,
      engine: 'rules',
      engineNote: null,
    }
  }
  if (ask === 'goal' && previousKind === 'goal') {
    return {
      reply: 'What do you want to learn? A sentence is enough.',
      ready: false,
      request: null,
      recommendation: null,
      engine: 'rules',
      engineNote: null,
    }
  }

  const prompts: Record<QuestionKind, string> = {
    goal: 'What do you want to learn?',
    foundations: 'Do you already know gradient descent and basic neural networks?',
    focus:
      'What should the path focus on — for example Transformers, training dynamics, or the physics of learning?',
    time: 'How much time do you have? A half hour, two hours, a day, or a week all work.',
  }
  return {
    reply: prompts[ask],
    ready: false,
    request: null,
    recommendation: null,
    engine: 'rules',
    engineNote: null,
  }
}

export async function runAdvisorTurn(history: AdvisorTurn[]): Promise<AdvisorOutcome> {
  if (advisorEngine() !== 'llm') return rulesTurn(history)
  try {
    return await adviseWithLlm(history)
  } catch {
    const fallback = rulesTurn(history)
    return {
      ...fallback,
      engine: 'rules',
      engineNote:
        'The language model could not be reached, so this reply used the library rules.',
      reply: fallback.engineNote
        ? fallback.reply
        : `${fallback.reply}\n\nThe language model could not be reached, so this reply used the library rules.`,
    }
  }
}

export async function recommend(request: LearnerRequest): Promise<Recommendation> {
  if (advisorEngine() !== 'llm') return recommendFromRules(request)
  try {
    const fromModel = await recommendWithLlm(request)
    if (fromModel) return fromModel
    return {
      ...recommendFromRules(request),
      engineNote:
        'The language model did not return library units, so this path was selected with library rules.',
    }
  } catch {
    return {
      ...recommendFromRules(request),
      engineNote:
        'The language model could not be reached, so this path was selected with library rules.',
    }
  }
}
