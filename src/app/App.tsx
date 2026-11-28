import { AnimatePresence, MotionConfig } from 'motion/react'
import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { Button } from '../components/Button'

import { downloadBackup, readBackup } from '../lib/backup'
import { Toast, type ToastState } from '../components/Toast'
import { type Item, type Settings, type Subject } from '../data'
import { useToday } from '../lib/clock'
import { addDays, dayLabel, isISODate, type ISODate } from '../lib/dates'
import { formatDuration, uid } from '../lib/format'
import { gameState, rollChest, warmUpSubjects, XP_PER_TICK } from '../lib/game'
import { readiness, rebalance } from '../lib/insights'
import type { Plan } from '../lib/plan'
import { navigate, useRoute } from '../lib/router'
import { useStoragePersistence } from '../lib/storage'
import { emptyState, sampleState, usePlanner, type State } from '../lib/store'
import { SubjectsProvider } from '../lib/subjects'
import { AppHeader, ViewSwitcher, type PlannerView } from './AppHeader'
import { Board } from './Board'
import { ChestReveal } from './ChestReveal'
import { FocusTimer } from './FocusTimer'
import { LevelUpBanner } from './GameHud'
import { Hero } from './Hero'
import { ItemDialog, type ItemDraft } from './ItemDialog'
import { MemoryGame } from './MemoryGame'
import { MobileBoard } from './MobileBoard'
import { InstallPrompt } from './InstallPrompt'
import { MobileTabBar } from './MobileTabBar'
import { MonthView } from './MonthView'
import { captureFlight } from './motion'
import { NotFound } from './NotFound'
import { Onboarding } from './Onboarding'
import { PlanDialog } from './PlanDialog'
import { PrintWeek } from './PrintWeek'
import { QuestsPage } from './QuestsPage'
import type { CardActions } from './SessionCard'
import { SettingsDialog } from './SettingsDialog'
import { StatsPage } from './StatsPage'
import { SubjectDialog, type SubjectDraft } from './SubjectDialog'
import { SubjectsPage } from './SubjectsPage'
import { WeekView } from './WeekView'

// The style guide is documentation, so it loads only when visited.
const StyleGuide = lazy(() => import('./StyleGuide').then((m) => ({ default: m.StyleGuide })))

// Board geometry, measured from the reference at 1440 wide and scaled down
// for phones. Columns, gaps and the edge fades all read these.
const boardVars = {
  '--col-w': 'clamp(262px, 21.2vw, 330px)',
  '--col-gap': 'clamp(12px, 1.32vw, 19px)',
  '--board-pad': 'clamp(16px, 10.9vw, 157px)',
  '--fade-l': 'clamp(20px, 10.4vw, 150px)',
  '--fade-r': 'clamp(20px, 7.6vw, 110px)',
} as CSSProperties

// The hero never changes, so it skips the board's re-renders.
const HeroSlot = memo(Hero)

/** Where the focus timer returns to. */
let lastPlannerPath = '/'

export function App() {
  const today = useToday()
  const [state, dispatch] = usePlanner(today)
  const { items, subjects, log, settings, bonusXp, warmUp, chest, shields } = state
  const route = useRoute()
  const [planOpen, setPlanOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [replanning, setReplanning] = useState<Item | null>(null)
  const [draft, setDraft] = useState<ItemDraft | null>(null)
  const [subjectDraft, setSubjectDraft] = useState<SubjectDraft | null>(null)
  const [toast, setToast] = useState<ToastState>(null)
  const [scrollTarget, setScrollTarget] = useState<{ date: ISODate; n: number } | null>(null)
  const [warmUpOpen, setWarmUpOpen] = useState(false)
  const [levelUp, setLevelUp] = useState<{ level: number; rank: string } | null>(null)
  const [chestPrize, setChestPrize] = useState<number | null>(null)
  const toastId = useRef(0)
  const backupInput = useRef<HTMLInputElement>(null)
  const persistence = useStoragePersistence()
  const stateRef = useRef(state)
  stateRef.current = state
  const openPlan = useCallback(() => setPlanOpen(true), [])

  // One pass over the same study record the planner uses: XP, level, streak,
  // today's quests. Nothing is stored twice, so the game can't drift.
  const game = useMemo(
    () => gameState(log, today, { bonusXp, warmUp, goalMinutes: settings.dailyGoal, chest, shields }),
    [log, today, bonusXp, warmUp, settings.dailyGoal, chest, shields],
  )

  // Once a day (and after any new study), pay a shield for a missed day or
  // credit a fresh one. The reducer returns the same state when nothing
  // changes, so this settles after one pass.
  useEffect(() => {
    dispatch({ type: 'streakCheck', today })
  }, [dispatch, today, log])
  const warmUpPool = useMemo(() => warmUpSubjects(items, log, today, subjects.map((s) => s.id)), [items, log, today, subjects])

  // Celebrate crossing a level. The first render only records where we are.
  const shownLevel = useRef<number | null>(null)
  useEffect(() => {
    if (shownLevel.current === null) {
      shownLevel.current = game.level.level
      return
    }
    if (game.level.level <= shownLevel.current) return
    shownLevel.current = game.level.level
    setLevelUp({ level: game.level.level, rank: game.level.rank })
    const t = window.setTimeout(() => setLevelUp(null), 4200)
    return () => window.clearTimeout(t)
  }, [game.level.level, game.level.rank])


  const path = route.path.replace(/\/+$/, '') || '/'
  const anchorParam = route.params.get('d')
  const anchor = isISODate(anchorParam) ? anchorParam : null
  const view: PlannerView | null = path === '/' ? 'days' : path === '/week' ? 'week' : path === '/month' ? 'month' : path.startsWith('/focus/') ? 'days' : null
  if (view && !path.startsWith('/focus/')) lastPlannerPath = route.path + (anchor ? `?d=${anchor}` : '')

  const notify = useCallback((message: string, undo?: State) => {
    setToast({
      id: ++toastId.current,
      message,
      action: undo ? { label: 'Annuler', run: () => dispatch({ type: 'replace', state: undo }) } : undefined,
    })
  }, [dispatch])
  const dismissToast = useCallback(() => setToast(null), [])

  // A backup is the whole planner in one file: the only way to move it to
  // another phone or get it back after a browser cleared its storage.
  const exportData = useCallback(() => {
    downloadBackup(stateRef.current)
    notify('Sauvegarde téléchargée')
  }, [notify])
  const importData = useCallback(
    async (file: File) => {
      const snapshot = stateRef.current
      try {
        const next = await readBackup(file)
        dispatch({ type: 'replace', state: next })
        notify(`Sauvegarde importée · ${next.items.length} ${next.items.length === 1 ? 'séance' : 'séances'}`, snapshot)
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Import impossible')
      }
    },
    [dispatch, notify],
  )

  const awardWarmUp = useCallback(
    (xp: number) => {
      dispatch({ type: 'warmUp', date: today, xp })
      notify(`Échauffement réussi · +${xp} XP bonus`)
    },
    [dispatch, notify, today],
  )

  // The prize is banked at once; the reveal is only the staging around it.
  const openChest = useCallback(() => {
    if (!game.chest.available) return
    const xp = rollChest()
    dispatch({ type: 'chest', date: today, xp })
    setChestPrize(xp)
  }, [dispatch, game.chest.available, today])
  const closeChest = useCallback(() => setChestPrize(null), [])

  const remove = useCallback(
    (item: Item) => {
      const snapshot = stateRef.current
      if (item.kind === 'test') {
        const linked = snapshot.items.filter((i) => i.testId === item.id && !i.done).map((i) => i.id)
        dispatch({ type: 'remove', ids: [item.id, ...linked] })
        notify(linked.length ? `${item.title} supprimé, ainsi que ${linked.length} séances` : `${item.title} supprimé`, snapshot)
      } else {
        dispatch({ type: 'remove', ids: [item.id] })
        notify(`${item.title} supprimé`, snapshot)
      }
    },
    [dispatch, notify],
  )

  const runRebalance = useCallback(
    (date: ISODate) => {
      const snapshot = stateRef.current
      const limit = snapshot.settings.dailyLimit
      if (!limit) return
      const { moves, left } = rebalance(snapshot.items, date, limit, today)
      if (moves.length === 0) {
        notify(`Pas de place à proximité. Augmente la limite quotidienne ou déplace une séance à la main.`)
        return
      }
      for (const m of moves) {
        captureFlight(m.id)
        dispatch({ type: 'move', id: m.id, date: m.to, index: 99 })
      }
      const where = [...new Set(moves.map((m) => dayLabel(m.to)))].join(', ')
      notify(
        left ? `${moves.length} séance(s) déplacée(s) vers ${where} ; il reste ${formatDuration(left)} de trop` : `${moves.length} ${moves.length === 1 ? 'séance déplacée' : 'séances déplacées'} vers ${where}`,
        snapshot,
      )
    },
    [dispatch, notify, today],
  )

  const actions: CardActions = useMemo(
    () => ({
      edit: (item) => setDraft({ mode: 'edit', item }),
      duplicate: (item) => {
        dispatch({ type: 'add', items: [{ ...item, id: uid(), done: false }] })
      },
      shift: (item, days) => {
        captureFlight(item.id)
        const date = addDays(item.date, days)
        dispatch({ type: 'move', id: item.id, date, index: 99 })
        notify(`Déplacé vers ${dayLabel(date)}`)
      },
      toggleDone: (item) => {
        const snapshot = stateRef.current
        dispatch({ type: 'setDone', id: item.id, done: !item.done, today })
        if (!item.done) notify(`+${item.minutes + XP_PER_TICK} XP · ${item.title} validé`, snapshot)
      },
      warmUp: () => setWarmUpOpen(true),
      remove,
      replan: (item) => {
        setReplanning(item)
        setPlanOpen(true)
      },
      focus: (item) => navigate(`/focus/${item.id}`),
      rebalance: runRebalance,
      readiness: (test) => readiness(test, stateRef.current.items, stateRef.current.log, today),
    }),
    // Readiness reads the latest state; re-create when it changes so test cards update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, notify, remove, runRebalance, today, items, log],
  )

  const confirmPlan = (plan: Plan) => {
    const snapshot = state
    if (replanning) {
      const stale = items.filter((i) => i.testId === replanning.id && !i.done).map((i) => i.id)
      dispatch({ type: 'remove', ids: [replanning.id, ...stale] })
    }
    dispatch({ type: 'add', items: [...plan.sessions, plan.test] })
    setPlanOpen(false)
    setReplanning(null)
    if (path !== '/') navigate('/')
    setScrollTarget({ date: plan.sessions[0]?.date ?? plan.test.date, n: Date.now() })
    notify(`${plan.sessions.length} séances planifiées pour ${plan.test.title}`, snapshot)
  }

  const loadSample = () => {
    const snapshot = state
    dispatch({ type: 'replace', state: { ...sampleState(today), settings } })
    setPlanOpen(false)
    notify('Planning d’exemple chargé', snapshot)
  }
  const startFresh = () => {
    const snapshot = state
    dispatch({ type: 'replace', state: emptyState(subjects, settings) })
    if (view === null) navigate('/')
    notify('Planning vidé', snapshot)
  }

  const usage = useMemo(() => {
    const m = new Map<string, number>()
    for (const i of items) m.set(i.subject, (m.get(i.subject) ?? 0) + 1)
    return m
  }, [items])

  const focusItem = path.startsWith('/focus/') ? items.find((i) => i.id === decodeURIComponent(path.slice(7))) : undefined
  const leaveFocus = () => navigate(lastPlannerPath)

  let page: ReactNode
  if (view) {
    const empty = items.length === 0
    page = (
      <main id="main" className="relative z-10 flex flex-1 flex-col">
        <HeroSlot onStart={openPlan} compact={view !== 'days' && items.length > 0} slim={items.length > 0} />
        <div className="no-print -mt-2 mb-4 flex justify-center md:hidden">
          <ViewSwitcher view={view} name="Vue du planning (mobile)" anchor={anchor} />
        </div>
        {empty ? (
          <Onboarding onPlan={openPlan} onAddToday={() => setDraft({ mode: 'create', date: today })} onSample={loadSample} />
        ) : view === 'week' ? (
          <WeekView
            items={items}
            today={today}
            anchor={anchor ?? today}
            settings={settings}
            actions={actions}
            onAdd={(date) => setDraft({ mode: 'create', date })}
            onMove={(id, date, index) => dispatch({ type: 'move', id, date, index })}
          />
        ) : view === 'month' ? (
          <MonthView items={items} today={today} anchor={anchor ?? today} settings={settings} />
        ) : (
          <>
            <div className="hidden min-h-0 flex-1 flex-col md:flex">
              <Board
                items={items}
                today={today}
                settings={settings}
                focusDate={anchor}
                actions={actions}
                onAdd={(date) => setDraft({ mode: 'create', date })}
                onMove={(id, date, index) => dispatch({ type: 'move', id, date, index })}
                scrollTarget={scrollTarget}
              />
            </div>
            <div className="md:hidden">
              <MobileBoard
                items={items}
                today={today}
                settings={settings}
                focusDate={anchor}
                actions={actions}
                onAdd={(date) => setDraft({ mode: 'create', date })}
                scrollTarget={scrollTarget}
              />
            </div>
          </>
        )}
      </main>
    )
  } else if (path === '/stats') {
    page = (
      <main id="main" className="relative z-10 flex flex-1 flex-col">
        <StatsPage items={items} log={log} settings={settings} today={today} onPlan={openPlan} />
      </main>
    )
  } else if (path === '/quests') {
    page = (
      <main id="main" className="relative z-10 flex flex-1 flex-col">
        <QuestsPage
          items={items}
          log={log}
          today={today}
          game={game}
          onOpenChest={openChest}
          onPlan={openPlan}
          onWarmUp={() => setWarmUpOpen(true)}
        />
      </main>
    )
  } else if (path === '/subjects') {
    page = (
      <main id="main" className="relative z-10 flex flex-1 flex-col">
        <SubjectsPage items={items} log={log} today={today} onAdd={() => setSubjectDraft({ mode: 'create' })} onEdit={(subject) => setSubjectDraft({ mode: 'edit', subject })} />
      </main>
    )
  } else if (path === '/print') {
    page = (
      <main id="main" className="relative z-10 flex flex-1 flex-col">
        <PrintWeek items={items} today={today} anchor={anchor ?? today} />
      </main>
    )
  } else if (path === '/styleguide') {
    page = (
      <main id="main" className="relative z-10 flex flex-1 flex-col">
        <Suspense fallback={<div className="flex-1" />}>
          <StyleGuide />
        </Suspense>
      </main>
    )
  } else {
    page = (
      <main id="main" className="relative z-10 flex flex-1 flex-col">
        <NotFound />
      </main>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <SubjectsProvider subjects={subjects}>
        <div className="relative flex min-h-dvh flex-col pb-[calc(60px_+_env(safe-area-inset-bottom))] md:pb-0" style={boardVars}>
          <a href="#main" className="sr-only z-50 rounded-full bg-white px-4 py-2 text-teal-900 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
            Aller au contenu
          </a>
          {/* A slow light drifting across the teal, behind everything. */}
          <div aria-hidden className="no-print pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -top-[30%] left-[15%] h-[80vh] w-[70vw] animate-drift rounded-full bg-[radial-gradient(closest-side,rgb(64_196_180/0.16),transparent)]" />
          </div>

          <AppHeader
            path={path}
            view={path.startsWith('/focus/') ? null : view}
            anchor={anchor}
            empty={items.length === 0}
            game={game}
            onSettings={() => setSettingsOpen(true)}
            onFresh={startFresh}
            onSample={loadSample}
            onExport={exportData}
            onImport={() => backupInput.current?.click()}
            persistence={persistence}
          />
          <input
            ref={backupInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              // Clear first so picking the same file again still fires.
              e.target.value = ''
              if (file) void importData(file)
            }}
          />
          {page}
          <MobileTabBar path={path} chestReady={game.chest.available} />
          <InstallPrompt />
        </div>

        <AnimatePresence>
          {focusItem && (
            <FocusTimer
              key={focusItem.id}
              item={focusItem}
              settings={settings}
              onComplete={(minutes) => {
                dispatch({ type: 'setDone', id: focusItem.id, done: true, today, minutes })
                notify(`+${minutes + XP_PER_TICK} XP · ${focusItem.title} validé`)
              }}
              onExit={(minutes) => {
                if (minutes > 0) {
                  dispatch({ type: 'logFocus', subject: focusItem.subject, minutes, date: today, itemId: focusItem.id })
                  notify(`${formatDuration(minutes)} de concentration enregistrées`)
                }
                leaveFocus()
              }}
            />
          )}
        </AnimatePresence>
        {path.startsWith('/focus/') && !focusItem && <FocusMissing onBack={leaveFocus} />}

        <PlanDialog
          open={planOpen}
          onClose={() => {
            setPlanOpen(false)
            setReplanning(null)
          }}
          today={today}
          items={items}
          settings={settings}
          existing={replanning}
          onConfirm={confirmPlan}
          onReset={loadSample}
        />

        <ItemDialog
          draft={draft}
          onClose={() => setDraft(null)}
          onDelete={(item) => {
            setDraft(null)
            remove(item)
          }}
          onSave={(values, d) => {
            if (d.mode === 'create') {
              dispatch({ type: 'add', items: [{ id: uid(), kind: 'session', order: 0, ...values }] })
            } else {
              if (values.date !== d.item.date) captureFlight(d.item.id)
              dispatch({ type: 'update', id: d.item.id, patch: values })
            }
            setDraft(null)
          }}
        />

        <SubjectDialog
          draft={subjectDraft}
          usage={usage}
          onClose={() => setSubjectDraft(null)}
          onSave={(subject: Subject) => {
            const isNew = subjectDraft?.mode === 'create'
            dispatch({ type: 'subject.save', subject })
            setSubjectDraft(null)
            notify(isNew ? `${subject.name} ajoutée` : `${subject.name} enregistrée`)
          }}
          onDelete={(subject) => {
            const snapshot = state
            dispatch({ type: 'subject.remove', id: subject.id })
            setSubjectDraft(null)
            notify(`${subject.name} supprimée`, snapshot)
          }}
        />

        <SettingsDialog
          open={settingsOpen}
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={(s: Settings) => {
            dispatch({ type: 'settings', patch: s })
            setSettingsOpen(false)
            notify(s.dailyLimit ? `Limite quotidienne fixée à ${formatDuration(s.dailyLimit)}` : 'Limite quotidienne désactivée')
          }}
        />

        <MemoryGame open={warmUpOpen} onClose={() => setWarmUpOpen(false)} onReward={awardWarmUp} subjectPool={warmUpPool} playsLeft={game.warmUpLeft} />

        <Toast toast={toast} onDismiss={dismissToast} />
        <LevelUpBanner level={levelUp} />
        <ChestReveal prize={chestPrize} onDone={closeChest} />
      </SubjectsProvider>
    </MotionConfig>
  )
}

/** /focus/<id> for a card that no longer exists (deleted, or another browser's link). */
function FocusMissing({ onBack }: { onBack: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#023a37]/95 p-6 text-center text-white">
      <div>
        <p className="text-[20px] font-semibold">Cette séance n’est pas dans ton planning</p>
        <p className="mt-1 text-white/85">Elle a peut-être été supprimée.</p>
        <Button variant="pill" onClick={onBack} className="mt-5" autoFocus>
          Retour au planning
        </Button>
      </div>
    </div>
  )
}
