import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdvisorChat } from '../components/personalize/AdvisorChat'
import { Questionnaire } from '../components/personalize/Questionnaire'
import { FlowHeader } from '../components/FlowHeader'
import { courseFromRecommendation } from '../courses/fromRecommendation'
import { writeDraft } from '../courses/storage'
import type { CourseSource } from '../courses/types'
import { advisorEngine } from '../personalize/llm'
import type { Recommendation } from '../personalize/types'

type View = 'choose' | 'chat' | 'questions'

export function PersonalizePage() {
  const navigate = useNavigate()
  const [view, setView] = useState<View>('choose')
  const engine = advisorEngine()

  function finish(recommendation: Recommendation, source: CourseSource) {
    const course = courseFromRecommendation(recommendation, source)
    writeDraft(course)
    navigate('/personalize/preview', { state: { course } })
  }

  return (
    <div className="min-h-full overflow-auto">
      <FlowHeader />
      <main className="mx-auto max-w-xl px-6 pb-20 pt-6">
        {view === 'choose' && (
          <>
            <h1 className="m-0 text-[28px] font-semibold tracking-tight">
              Personalize My Course
            </h1>
            <p className="mt-3 mb-0 max-w-lg text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Both options assemble a course from knowledge units already in the
              library. No new lessons are generated.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                className="entry-card cursor-pointer text-left"
                onClick={() => setView('chat')}
              >
                <h3>Chat with AI</h3>
                <p>
                  Describe what you want to learn. Follow-up questions cover your
                  background, goal, and available time.
                </p>
                <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
                  {engine === 'llm'
                    ? 'A language model is connected. It can only choose units that already exist.'
                    : 'No language model is connected. The conversation follows library rules and does not pretend to be a model.'}
                </p>
              </button>
              <button
                type="button"
                className="entry-card cursor-pointer text-left"
                onClick={() => setView('questions')}
              >
                <h3>Quick Questionnaire</h3>
                <p>
                  Answer a few structured questions about your background, goals,
                  available time, and learning mode.
                </p>
              </button>
            </div>
          </>
        )}

        {view === 'chat' && (
          <AdvisorChat
            onBack={() => setView('choose')}
            onComplete={(recommendation) => finish(recommendation, 'chat')}
          />
        )}
        {view === 'questions' && (
          <Questionnaire
            onBack={() => setView('choose')}
            onComplete={(recommendation) => finish(recommendation, 'questionnaire')}
          />
        )}
      </main>
    </div>
  )
}
