import { KNOWLEDGE_BY_ID, KNOWLEDGE_UNITS, learningPaths } from '../knowledge/registry'
import { searchUnits } from '../knowledge/search'
import { clip, minutesForCount, slotCount } from './format'
import type { BackgroundId, LearnerRequest, Recommendation } from './types'

/**
 * Selects and orders knowledge units that already exist in the registry.
 * It never invents lessons. Phrases below are matching keys, not new content.
 */

type Cluster = {
  id: string
  label: string
  phrases: string[]
  /** Prerequisite → core, using real unit ids. */
  units: string[]
  anchors: string[]
  advanced: boolean
}

const CLUSTERS: Cluster[] = [
  {
    id: 'transformers',
    label: 'Attention and Transformers',
    phrases: ['transformer', 'transformers', 'self-attention', 'attention'],
    units: [
      'embedding',
      'residual',
      'layernorm',
      'transformer',
      'attention',
      'posenc',
      'prenorm',
      'attsink',
      'tokenuniform',
      'lostmiddle',
    ],
    anchors: ['transformer', 'attention'],
    advanced: true,
  },
  {
    id: 'physics',
    label: 'Physics of neural network training',
    phrases: [
      'physics',
      'thermodynamic',
      'free energy',
      'langevin',
      'phase diagram',
      'energy landscape',
      'gradient flow',
      'statistical mechanics',
      'edge of chaos',
    ],
    units: [
      'scienceai',
      'gd1d',
      'gradientflow',
      'gd2d',
      'langevin',
      'freeenergy',
      'landscape',
      'phasediagram',
      'edgechaos',
      'manifoldgeo',
    ],
    anchors: ['scienceai', 'gradientflow', 'langevin'],
    advanced: false,
  },
  {
    id: 'theory',
    label: 'Theory of deep learning',
    phrases: [
      'neural tangent',
      'infinite width',
      'mean-field',
      'mean field',
      'random matrix',
      'information bottleneck',
      'superposition',
      'scaling law',
      'renormalization',
      'feature learning',
    ],
    units: [
      'scienceai',
      'theories',
      'infwidth',
      'ntk',
      'meanfield',
      'featurelearn',
      'infobottle',
      'rmt',
      'scaling',
      'superpose',
      'symmetry',
      'renorm',
    ],
    anchors: ['ntk', 'meanfield', 'featurelearn'],
    advanced: true,
  },
  {
    id: 'grokking',
    label: 'Grokking and generalization',
    phrases: ['grokking', 'grok', 'generalization', 'generalisation', 'double descent'],
    units: [
      'weightdecay',
      'implicitbias',
      'spectralbias',
      'grokking',
      'doubledescent',
      'phasediagram',
      'featurelearn',
    ],
    anchors: ['grokking', 'doubledescent'],
    advanced: true,
  },
  {
    id: 'optimization',
    label: 'How training takes steps',
    phrases: [
      'gradient descent',
      'optimizer',
      'optimization',
      'optimisation',
      'learning rate',
      'weight decay',
      'loss landscape',
      'momentum',
      'stochastic',
      'adam',
      'sgd',
    ],
    units: [
      'gd1d',
      'gradientflow',
      'gd2d',
      'sgd',
      'momentum',
      'adamopt',
      'weightdecay',
      'implicitbias',
    ],
    anchors: ['gd1d', 'adamopt', 'gd2d'],
    advanced: false,
  },
  {
    id: 'mlp',
    label: 'From a line to a deep network',
    phrases: [
      'perceptron',
      'linear regression',
      'logistic regression',
      'universal approximation',
      'activation function',
      'multilayer',
      'two-layer',
      'why go deeper',
    ],
    units: [
      'linreg',
      'logreg',
      'perceptron',
      'activation',
      'xor',
      'sawtooth',
      'fold',
      'uat',
      'dead',
      'deep',
      'init',
    ],
    anchors: ['perceptron', 'xor', 'uat'],
    advanced: false,
  },
  {
    id: 'cnn',
    label: 'Convolutional networks',
    phrases: ['convolution', 'convolutional', 'cnn', 'pooling'],
    units: ['cnn', 'pooling'],
    anchors: ['cnn'],
    advanced: true,
  },
  {
    id: 'rnn',
    label: 'Recurrent networks',
    phrases: ['recurrent', 'rnn', 'lstm', 'gru'],
    units: ['rnn', 'lstm'],
    anchors: ['rnn', 'lstm'],
    advanced: true,
  },
  {
    id: 'generative',
    label: 'Generative models',
    phrases: [
      'variational autoencoder',
      'autoencoder',
      'autoregressive',
      'normalizing flow',
      'flow matching',
      'generative',
      'diffusion',
      'vae',
      'gan',
    ],
    units: [
      'autoencoder',
      'autoregressive',
      'vae',
      'flows',
      'gan',
      'diffusion',
      'flowmatching',
    ],
    anchors: ['vae', 'gan', 'diffusion'],
    advanced: true,
  },
  {
    id: 'unsupervised',
    label: 'Learning without labels',
    phrases: ['k-means', 'kmeans', 'clustering', 'unsupervised', 'pca'],
    units: ['kmeans', 'pca', 'autoencoder'],
    anchors: ['kmeans', 'pca'],
    advanced: true,
  },
  {
    id: 'supervised',
    label: 'Learning from labels',
    phrases: ['supervised', 'classification', 'multi-class', 'regression'],
    units: ['linreg', 'logreg', 'supervreg', 'supervcls', 'supervmulti'],
    anchors: ['supervcls', 'supervreg'],
    advanced: false,
  },
  {
    id: 'normalization',
    label: 'Normalization',
    phrases: [
      'batch norm',
      'batch normalization',
      'layer norm',
      'layer normalization',
      'pre-norm',
      'post-norm',
    ],
    units: ['batchnorm', 'layernorm', 'prenorm'],
    anchors: ['batchnorm', 'layernorm'],
    advanced: true,
  },
  {
    id: 'kan',
    label: 'KAN',
    phrases: ['kolmogorov', 'kan'],
    units: ['kan'],
    anchors: ['kan'],
    advanced: true,
  },
  {
    id: 'dead',
    label: 'Dead neurons',
    phrases: ['dead neuron', 'dead neurons'],
    units: ['activation', 'init', 'dead'],
    anchors: ['dead'],
    advanced: false,
  },
  {
    id: 'attsink',
    label: 'Attention sink',
    phrases: ['attention sink', 'lost in the middle'],
    units: ['attention', 'posenc', 'attsink', 'tokenuniform', 'lostmiddle'],
    anchors: ['attsink', 'lostmiddle'],
    advanced: true,
  },
  {
    id: 'survey',
    label: 'A short tour of deep learning',
    phrases: ['deep learning', 'machine learning', 'neural network', 'neural networks'],
    units: [
      'perceptron',
      'activation',
      'xor',
      'gd1d',
      'gd2d',
      'momentum',
      'cnn',
      'embedding',
      'transformer',
      'attention',
      'grokking',
      'vae',
    ],
    anchors: ['perceptron'],
    advanced: false,
  },
]

const KNOWN_MAP: { phrases: string[]; ids: string[] }[] = [
  {
    phrases: ['gradient descent', 'gradient flow'],
    ids: ['gd1d', 'gradientflow', 'gd2d'],
  },
  {
    phrases: ['neural network', 'neural networks', 'perceptron', 'mlp', 'basic neural'],
    ids: ['linreg', 'logreg', 'perceptron', 'activation', 'xor', 'sawtooth', 'fold', 'uat'],
  },
  {
    phrases: ['optimizer', 'adam', 'momentum', 'sgd'],
    ids: ['sgd', 'momentum', 'adamopt'],
  },
]

const LEFTOVER_IGNORE = new Set([
  'about',
  'already',
  'around',
  'basic',
  'basics',
  'better',
  'course',
  'deep',
  'hours',
  'learn',
  'learning',
  'machine',
  'minutes',
  'model',
  'models',
  'modern',
  'network',
  'networks',
  'neural',
  'please',
  'really',
  'science',
  'should',
  'simple',
  'something',
  'student',
  'their',
  'there',
  'these',
  'those',
  'through',
  'train',
  'training',
  'understand',
  'understanding',
  'using',
  'want',
  'within',
  'without',
  'works',
  'would',
])

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function includesPhrase(text: string, phrase: string): boolean {
  const needle = phrase.toLowerCase().trim()
  if (!needle) return false
  if (needle.includes(' ')) return text.toLowerCase().includes(needle)
  const body =
    needle.length <= 4
      ? `(?:^|[^a-z0-9])${escapeRegExp(needle)}(?:$|[^a-z0-9])`
      : `(?:^|[^a-z0-9])${escapeRegExp(needle)}`
  return new RegExp(body, 'i').test(text)
}

function scoreCluster(text: string, cluster: Cluster): number {
  return cluster.phrases.reduce((sum, phrase) => {
    if (!includesPhrase(text, phrase)) return sum
    return sum + (phrase.includes(' ') ? 3 : 2)
  }, 0)
}

function dedupe(ids: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    if (seen.has(id) || !KNOWLEDGE_BY_ID[id]) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

function orderByPath(ids: string[]): string[] {
  return [...ids].sort(
    (a, b) =>
      (KNOWLEDGE_BY_ID[a]?.pathIndex ?? 0) - (KNOWLEDGE_BY_ID[b]?.pathIndex ?? 0),
  )
}

function titleMatches(title: string, goal: string): boolean {
  const name = title.toLowerCase()
  if (!name) return false
  if (name.includes(' ')) {
    const words = name.split(/[^a-z0-9]+/).filter((word) => word.length > 3)
    return words.length > 0 && words.every((word) => includesPhrase(goal, word))
  }
  return includesPhrase(goal, name)
}

function matchingIds(ids: string[], goal: string): string[] {
  const units = ids
    .map((id) => KNOWLEDGE_BY_ID[id])
    .filter((unit) => unit && titleMatches(unit.title, goal))
  const kept = units.filter(
    (unit) =>
      !units.some(
        (other) =>
          other.id !== unit.id &&
          other.title.toLowerCase().includes(unit.title.toLowerCase()) &&
          other.title.length > unit.title.length,
      ),
  )
  return kept.map((unit) => unit.id)
}

function goalTargetsUnit(id: string, goal: string): boolean {
  const unit = KNOWLEDGE_BY_ID[id]
  if (!unit) return false
  if (titleMatches(unit.title, goal) || includesPhrase(goal, id)) return true
  return unit.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 4)
    .some((word) => includesPhrase(goal, word))
}

function knownUnitIds(req: LearnerRequest): Set<string> {
  const blob = req.knownPhrases.join('\n').toLowerCase()
  const ids = new Set<string>()
  for (const row of KNOWN_MAP) {
    if (!row.phrases.some((phrase) => blob.includes(phrase))) continue
    if (row.ids.some((id) => goalTargetsUnit(id, req.goal))) continue
    for (const id of row.ids) ids.add(id)
  }
  if (req.backgroundId === 'researcher') {
    for (const id of ['linreg', 'logreg', 'perceptron', 'activation', 'xor', 'sawtooth']) {
      if (!goalTargetsUnit(id, req.goal)) ids.add(id)
    }
  }
  return ids
}

function knowsFoundations(req: LearnerRequest): boolean {
  const blob = req.knownPhrases.join(' ').toLowerCase()
  const knowsNets = ['neural network', 'perceptron', 'mlp'].some((phrase) =>
    blob.includes(phrase),
  )
  const knowsGd =
    blob.includes('gradient descent') || blob.includes('gradient flow')
  return knowsNets && knowsGd
}

function previousInSection(id: string): string | null {
  const unit = KNOWLEDGE_BY_ID[id]
  if (!unit) return null
  const section = learningPaths().find((path) => path.id === unit.sectionId)
  const index = section?.units.findIndex((item) => item.id === id) ?? -1
  if (!section || index <= 0) return null
  return section.units[index - 1]?.id ?? null
}

function takeWindow(chain: string[], slots: number, anchorIds: string[]): string[] {
  if (slots <= 0) return []
  if (chain.length <= slots) return chain
  const indexes = anchorIds
    .map((id) => chain.indexOf(id))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)
  if (indexes.length === 0) return chain.slice(0, slots)
  const last = indexes[indexes.length - 1]
  let end = last + 1
  let start = end - slots
  if (start < 0) {
    start = 0
    end = Math.min(chain.length, slots)
  }
  return chain.slice(start, end)
}

function anchorsFor(cluster: Cluster, goal: string, chain: string[]): string[] {
  const dynamic = matchingIds(chain, goal)
  if (dynamic.length === 0) {
    return cluster.anchors.filter((id) => chain.includes(id))
  }
  const expanded = new Set<string>()
  for (const id of dynamic) {
    const index = chain.indexOf(id)
    if (index > 0) expanded.add(chain[index - 1])
    expanded.add(id)
  }
  return [...expanded]
}

function selectFromCluster(
  cluster: Cluster,
  goal: string,
  slots: number,
  known: Set<string>,
  backgroundId: BackgroundId,
): string[] {
  const chain = cluster.units.filter((id) => KNOWLEDGE_BY_ID[id] && !known.has(id))
  if (chain.length === 0 || slots <= 0) return []
  if (backgroundId === 'researcher' && cluster.id === 'survey') {
    return chain.slice(-slots)
  }
  return takeWindow(chain, slots, anchorsFor(cluster, goal, chain))
}

function buildRamp(
  req: LearnerRequest,
  clusters: Cluster[],
  slots: number,
  known: Set<string>,
): string[] {
  if (slots <= 3 || req.backgroundId === 'researcher' || knowsFoundations(req)) {
    return []
  }
  if (!clusters.some((cluster) => cluster.advanced)) return []
  const covered = new Set(clusters.flatMap((cluster) => cluster.units))
  const earlyOnly = [...covered].every((id) => {
    const unit = KNOWLEDGE_BY_ID[id]
    return unit != null && unit.sectionId <= 2
  })
  if (earlyOnly) return []
  if (
    clusters.some((cluster) =>
      ['physics', 'theory', 'optimization', 'mlp', 'supervised'].includes(cluster.id),
    )
  ) {
    return []
  }

  const full =
    req.backgroundId === 'beginner'
      ? ['perceptron', 'activation', 'gd1d']
      : ['gd1d']
  const ramp = full.filter(
    (id) => KNOWLEDGE_BY_ID[id] && !known.has(id) && !covered.has(id),
  )
  return ramp.slice(0, Math.max(0, slots - 2))
}

function selectAroundDirect(
  directIds: string[],
  slots: number,
  req: LearnerRequest,
  known: Set<string>,
): string[] {
  const core = orderByPath(directIds.filter((id) => !known.has(id)))
  if (core.length === 0) return []
  const predecessors: string[] = []
  if (req.backgroundId === 'beginner' || req.backgroundId === 'other') {
    let cursor = core[0]
    for (let step = 0; step < 2; step += 1) {
      const prev = previousInSection(cursor)
      if (!prev || known.has(prev) || core.includes(prev)) break
      predecessors.unshift(prev)
      cursor = prev
    }
  }
  return takeWindow(dedupe([...predecessors, ...core]), slots, core)
}

function stripGoal(goal: string): string {
  return goal
    .replace(/\s+/g, ' ')
    .trim()
    .replace(
      /^i(?:'d| would)? (?:like|want) to (?:understand|learn|study|know)\s+/i,
      '',
    )
    .replace(/^please\s+/i, '')
    .replace(/[.?!]+$/g, '')
    .trim()
}

function makeTitle(goal: string, clusterLabel: string | null): string {
  const stripped = stripGoal(goal)
  const titled = stripped ? stripped.charAt(0).toUpperCase() + stripped.slice(1) : ''
  if (titled.length >= 16 && titled.length <= 72) return titled
  if (clusterLabel) return clusterLabel
  if (titled) return clip(titled, 72)
  return 'Personalized learning path'
}

function leftoverNote(
  goal: string,
  clusters: Cluster[],
  picked: string[],
): string | null {
  const blob = picked
    .map((id) => {
      const unit = KNOWLEDGE_BY_ID[id]
      if (!unit) return ''
      return `${unit.title} ${unit.description} ${unit.keywords.join(' ')}`
    })
    .join(' ')
    .toLowerCase()
  const phrases = clusters.flatMap((cluster) => cluster.phrases).join(' ')
  const tokens = [
    ...new Set(
      goal
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 6 && !LEFTOVER_IGNORE.has(token)),
    ),
  ]
  const left = tokens.filter((token) => !blob.includes(token) && !phrases.includes(token))
  if (left.length === 0) return null
  const list = left
    .slice(0, 3)
    .map((token) => `“${token}”`)
    .join(', ')
  return `No knowledge unit is specifically about ${list}. This path is the closest sequence in the library.`
}

function buildReasons(
  picked: string[],
  goal: string,
  ramp: string[],
  anchorIds: string[],
  clusterLabel: string | null,
): Record<string, string> {
  const reasons: Record<string, string> = {}
  const anchors = new Set(anchorIds.filter((id) => picked.includes(id)))
  if (anchors.size === 0 && picked.length > 0) {
    anchors.add(picked[Math.min(picked.length - 1, ramp.length)])
  }
  const shortGoal = clip(stripGoal(goal) || goal, 80)
  let usedClosest = false
  for (let index = 0; index < picked.length; index += 1) {
    const id = picked[index]
    if (ramp.includes(id)) {
      reasons[id] = 'A foundation for your background, before the topic you asked for.'
      continue
    }
    if (anchors.has(id)) {
      reasons[id] = usedClosest
        ? 'Also one of the closest units to your goal.'
        : `Closest unit in the library to “${shortGoal}”.`
      usedClosest = true
      continue
    }
    const later = picked.slice(index + 1).find((next) => anchors.has(next))
    const laterTitle = later ? KNOWLEDGE_BY_ID[later]?.title : undefined
    if (laterTitle) {
      reasons[id] = `Comes before ${laterTitle} so the sequence stays in order.`
      continue
    }
    reasons[id] = clusterLabel
      ? `Extends the path on ${clusterLabel}.`
      : 'One of the closest units in the library to your goal.'
  }
  return reasons
}

function baseRecommendation(
  req: LearnerRequest,
  unitIds: string[],
  reasons: Record<string, string>,
  title: string,
  coverageNote: string | null,
): Recommendation {
  return {
    title,
    description: `For a ${req.backgroundLabel} learner. Built only from knowledge units already in the library.`,
    goal: req.goal.trim(),
    background: req.backgroundLabel,
    backgroundId: req.backgroundId,
    preferredMode: req.preferredMode,
    knownPhrases: req.knownPhrases,
    timeBudgetMinutes: req.timeMinutes,
    unitIds,
    reasons,
    estimatedMinutes: minutesForCount(unitIds.length),
    coverageNote,
    engine: 'rules',
    engineNote: null,
  }
}

export function recommendFromRules(req: LearnerRequest): Recommendation {
  const goal = req.goal.trim()
  const text = goal.toLowerCase()
  const slots = slotCount(req.timeMinutes)
  const known = knownUnitIds(req)

  const specific = CLUSTERS
    .filter((cluster) => cluster.id !== 'survey')
    .map((cluster) => ({ cluster, score: scoreCluster(text, cluster) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  const survey = CLUSTERS.find((cluster) => cluster.id === 'survey')
  const surveyScore = survey ? scoreCluster(text, survey) : 0
  const chosen =
    specific.length > 0
      ? specific
      : survey && surveyScore > 0
        ? [{ cluster: survey, score: surveyScore }]
        : []

  const directIds = matchingIds(
    KNOWLEDGE_UNITS.map((unit) => unit.id),
    goal,
  ).filter((id) => !known.has(id))

  let picked: string[] = []
  let coverageNote: string | null = null
  let ramp: string[] = []
  let anchorIds: string[] = []
  let primary: Cluster | null = null

  if (chosen.length > 0) {
    const useSecond =
      chosen.length > 1 && chosen[1].score >= chosen[0].score * 0.8
    const active = useSecond ? chosen.slice(0, 2) : chosen.slice(0, 1)
    primary = active[0].cluster
    ramp = buildRamp(
      req,
      active.map((item) => item.cluster),
      slots,
      known,
    )
    const bodySlots = Math.max(1, slots - ramp.length)
    const parts =
      active.length === 2
        ? [
            selectFromCluster(
              active[0].cluster,
              goal,
              Math.ceil(bodySlots / 2),
              known,
              req.backgroundId,
            ),
            selectFromCluster(
              active[1].cluster,
              goal,
              Math.floor(bodySlots / 2),
              known,
              req.backgroundId,
            ),
          ]
        : [
            selectFromCluster(
              active[0].cluster,
              goal,
              bodySlots,
              known,
              req.backgroundId,
            ),
          ]
    picked = dedupe([...ramp, ...parts.flat()])
    for (const id of directIds) {
      if (picked.length >= slots) break
      if (!picked.includes(id)) picked.push(id)
    }
    anchorIds = dedupe([
      ...active.flatMap((item) =>
        anchorsFor(
          item.cluster,
          goal,
          item.cluster.units.filter((id) => picked.includes(id)),
        ),
      ),
      ...directIds,
    ])
    if (primary.id === 'survey') {
      coverageNote = `“${clip(goal, 90)}” is broader than any single unit. This is a short tour of the closest units in the library, not a complete course on that topic.`
    }
    const soft = leftoverNote(
      goal,
      active.map((item) => item.cluster),
      picked,
    )
    if (soft) coverageNote = coverageNote ? `${coverageNote} ${soft}` : soft
  } else if (directIds.length > 0) {
    picked = selectAroundDirect(directIds, slots, req, known)
    anchorIds = directIds
    const soft = leftoverNote(goal, [], picked)
    if (soft) coverageNote = soft
  } else {
    const hits = searchUnits(goal, 6)
      .map((hit) => hit.unit.id)
      .filter((id) => !known.has(id))
    const closest = orderByPath(hits).slice(0, Math.min(slots, 4))
    picked =
      closest.length > 0
        ? closest
        : dedupe(['perceptron', 'gd1d', 'transformer']).slice(0, slots)
    anchorIds = picked.slice(0, 1)
    coverageNote = `The library does not cover “${clip(goal, 100)}”. This is the closest path from units that already exist.`
  }

  picked = dedupe(picked).slice(0, slots)
  if (picked.length === 0) {
    picked = dedupe(['perceptron', 'gd1d']).slice(0, slots)
    coverageNote = `The library does not cover “${clip(goal, 100)}”. No closer knowledge unit is registered.`
  }

  return baseRecommendation(
    req,
    picked,
    buildReasons(picked, goal, ramp, anchorIds, primary?.label ?? null),
    makeTitle(goal, primary && primary.id !== 'survey' ? primary.label : null),
    coverageNote,
  )
}
