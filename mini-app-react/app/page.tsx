'use client';

import {
  ArrowUp,
  BarChart3,
  Bookmark,
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Flame,
  Gift,
  Globe2,
  Heart,
  HelpCircle,
  ListChecks,
  MessageCircle,
  Mic,
  Settings,
  Sparkles,
  Star,
  UserRound,
  Volume2,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  api,
  displayMessage,
  type ExplainResult,
  type PronunciationScore,
  type SavedWord,
  type UserProfile,
  type WordDefinition
} from './api';
import { useAsync } from './useAsync';

type Tab = 'profile' | 'saved' | 'stars' | 'language' | 'settings';
type Mode = 'text' | 'explain' | 'score' | null;

const languages = [
  ['FR', 'French'],
  ['DE', 'German'],
  ['ES', 'Spanish'],
  ['JP', 'Japanese'],
  ['CN', 'Chinese'],
  ['IT', 'Italian'],
  ['KR', 'Korean'],
  ['PT', 'Portuguese'],
  ['RU', 'Russian'],
  ['SA', 'Arabic'],
  ['TR', 'Turkish'],
  ['PL', 'Polish'],
  ['LT', 'Lithuanian'],
  ['MN', 'Mongolian'],
  ['UZ', 'Uzbek']
];

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const botUsername = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'ChattyLinguoBot').replace(/^@/, '');
const appName = 'Aqbota';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [mode, setMode] = useState<Mode>(null);
  const [messageId, setMessageId] = useState<number | null>(null);
  const profile = useAsync(api.getProfile, []);

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();

    const params = new URLSearchParams(window.location.search);
    const nextMode = params.get('mode') as Mode;
    const nextMessageId = Number(params.get('message_id'));
    if (nextMode === 'text' || nextMode === 'explain' || nextMode === 'score') {
      setMode(nextMode);
      setMessageId(Number.isFinite(nextMessageId) ? nextMessageId : null);
    }
  }, []);

  const updateProfile = (next: UserProfile) => profile.setData(next);

  let content: React.ReactNode;
  if (profile.loading) {
    content = <StatePanel text="Loading..." />;
  } else if (profile.error || !profile.data) {
    content = <StatePanel text="Open the bot with /start first, then reopen this Mini App." detail={profile.error ?? undefined} />;
  } else if (mode === 'text') {
    content = <TextScreen messageId={messageId} profile={profile.data} onLanguage={() => { setMode(null); setActiveTab('language'); }} />;
  } else if (mode === 'explain') {
    content = <ExplainScreen messageId={messageId} profile={profile.data} />;
  } else if (mode === 'score') {
    content = <ScoreScreen messageId={messageId} />;
  } else if (activeTab === 'saved') {
    content = <SavedScreen />;
  } else if (activeTab === 'language') {
    content = <LanguageScreen profile={profile.data} onProfile={updateProfile} />;
  } else if (activeTab === 'stars') {
    content = <StarsScreen profile={profile.data} />;
  } else if (activeTab === 'settings') {
    content = <SettingsScreen profile={profile.data} />;
  } else {
    content = <ProfileScreen profile={profile.data} />;
  }

  return (
    <main className="appStage">
      <section className="phoneFrame">
        <div className="screen">{content}</div>
        {mode === null ? <BottomNav active={activeTab} onChange={setActiveTab} /> : null}
      </section>
    </main>
  );
}

function ProfileScreen({ profile }: { profile: UserProfile }) {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const activeDays = useMemo(() => new Set(profile.active_dates ?? []), [profile.active_dates]);
  const monthCells = useMemo(() => buildMonthCells(visibleMonth), [visibleMonth]);
  const title = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function moveMonth(delta: number) {
    setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }

  function inviteFriends() {
    const botLink = `https://t.me/${botUsername}?start=ref_${profile.telegram_user_id}`;
    const shareUrl = new URL('https://t.me/share/url');
    shareUrl.searchParams.set('url', botLink);
    shareUrl.searchParams.set('text', `Practice English with me in ${appName}.`);
    const target = shareUrl.toString();
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(target, { try_instant_view: false });
      return;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="page profilePage">
      <div className="profileHero">
        <Avatar large />
        <h1>{profile.name || profile.username || 'Learner'}</h1>
        <p><Star fill="#f2a51a" /> 0</p>
      </div>
      <button className="primaryButton" onClick={inviteFriends}>Invite Friends</button>
      <button className="secondaryButton">Share Profile</button>
      <Panel className="streakPanel">
        <div className="streakTop">
          <Flame />
          <strong>{profile.current_streak}</strong>
        </div>
        <span>days streak</span>
        <div className="calendarTitle">
          <button onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft /></button>
          <b>{title}</b>
          <button onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight /></button>
        </div>
        <div className="calendar">
          {weekdays.map((day) => <b key={day}>{day}</b>)}
          {monthCells.map((cell, index) => (
            cell ? (
              <span
                className={[
                  cell.iso === toDateKey(today) ? 'today' : '',
                  activeDays.has(cell.iso) ? 'ring' : '',
                  index % 7 > 4 ? 'weekend' : ''
                ].filter(Boolean).join(' ')}
                key={cell.iso}
              >
                {cell.day}
              </span>
            ) : <i key={`blank-${index}`} />
          ))}
        </div>
      </Panel>
      <Panel className="statsGrid">
        <Stat value={`${profile.word_count}`} label="Words Said" />
        <Stat value={`${profile.maximum_streak}`} label="Max streak" />
        <Stat value={`${profile.correct_percent}%`} label="Correct" />
        <Stat value={`${profile.messages_count}`} label="Messages Sent" />
      </Panel>
    </div>
  );
}

function TextScreen({ messageId, profile, onLanguage }: { messageId: number | null; profile: UserProfile; onLanguage: () => void }) {
  const message = useAsync(() => messageId ? api.getMessage(messageId) : Promise.reject(new Error('Missing message_id')), [messageId]);
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [definitionError, setDefinitionError] = useState<string | null>(null);
  const text = displayMessage(message.data);

  async function openWord(rawWord: string) {
    const word = rawWord.replace(/[^A-Za-z'-]/g, '');
    if (!word) return;
    setDefinition(null);
    setDefinitionError(null);
    try {
      setDefinition(await api.defineWord(word));
    } catch (error) {
      setDefinitionError(error instanceof Error ? error.message : 'Could not load this word.');
    }
  }

  return (
    <div className="page transcriptPage">
      {message.loading ? <StatePanel text="Loading transcript..." /> : null}
      {message.error ? <StatePanel text="Could not load transcript." detail={message.error} /> : null}
      {!message.loading && !message.error ? (
        <>
          <ScrollPanel>
            <p className="largeText">
              {text.split(/(\s+)/).map((piece, index) => {
                const clean = piece.replace(/[^A-Za-z'-]/g, '');
                if (!clean) return <span key={index}>{piece}</span>;
                return <button key={index} className="wordButton" onClick={() => openWord(clean)}>{piece}</button>;
              })}
            </p>
            <button className="translateButton">Перевести</button>
          </ScrollPanel>
          <h2 className="tapHint">Нажмите на любое слово, чтобы увидеть определение</h2>
          {definitionError ? <StatePanel text="Could not load definition." detail={definitionError} /> : null}
          {definition ? <DefinitionBottomSheet entry={definition} onChange={setDefinition} onClose={() => setDefinition(null)} /> : null}
          <button className="languageButton" onClick={onLanguage}>
            <b>{languageCode(profile.native_language)}</b> {profile.native_language}
          </button>
        </>
      ) : null}
    </div>
  );
}

function ExplainScreen({ messageId, profile }: { messageId: number | null; profile: UserProfile }) {
  const explanation = useAsync(() => messageId ? api.getExplanation(messageId) : Promise.reject(new Error('Missing message_id')), [messageId]);
  const [question, setQuestion] = useState('');
  const [followUps, setFollowUps] = useState<Array<[string, string]>>([]);
  const [sending, setSending] = useState(false);

  async function sendFollowUp() {
    if (!question.trim() || !messageId || sending) return;
    setSending(true);
    try {
      const answer = await api.askExplanationFollowUp(messageId, question.trim());
      setFollowUps((rows) => [...rows, [question.trim(), answer]]);
      setQuestion('');
    } finally {
      setSending(false);
    }
  }

  if (explanation.loading) return <StatePanel text="Loading explanation..." />;
  if (explanation.error || !explanation.data) return <StatePanel text="Could not load explanation." detail={explanation.error ?? undefined} />;

  const data: ExplainResult = explanation.data;
  return (
    <div className="page explainPage">
      <ScrollPanel>
        {data.chatty_text ? <ExplainBubble title={appName} text={data.chatty_text} tone="chatty" /> : null}
        <ExplainBubble title={profile.name || 'You'} text={data.corrected_text} tone="learner" />
        <p className="explainText">{data.explanation}</p>
        {followUps.map(([prompt, answer]) => (
          <div key={prompt}>
            <ExplainBubble title={profile.name || 'You'} text={prompt} tone="learner" />
            <ExplainBubble title={appName} text={answer} tone="chatty" />
          </div>
        ))}
        <div className="questionBox">
          <input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void sendFollowUp(); }} placeholder="Задайте уточняющий вопрос..." />
          <button onClick={sendFollowUp} aria-label="Send question"><ArrowUp /></button>
        </div>
      </ScrollPanel>
      <button className="languageButton"><b>{languageCode(profile.native_language)}</b> {profile.native_language}</button>
    </div>
  );
}

function ExplainBubble({ title, text, tone }: { title: string; text: string; tone: 'chatty' | 'learner' }) {
  return (
    <div className={`bubble ${tone === 'chatty' ? 'chattyBubble' : 'learnerBubble'}`}>
      <b>{title}</b>
      <p>{text}</p>
    </div>
  );
}

function SavedScreen() {
  const words = useAsync(api.getSavedWords, []);
  const [selected, setSelected] = useState<SavedWord | null>(null);

  if (words.loading) return <StatePanel text="Loading saved words..." />;
  if (words.error) return <StatePanel text="Could not load saved words." detail={words.error} />;

  const rows = words.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="page savedPage">
        <ScrollPanel>
          <p className="emptySaved">You don&apos;t have any words saved yet! To save a word:<br />1️⃣&nbsp; Open transcription of an Aqbota response<br />2️⃣&nbsp; Click on a word you want to save<br />3️⃣&nbsp; Click bookmark icon</p>
        </ScrollPanel>
        {selected ? <SavedDefinitionSheet selected={selected} setSelected={setSelected} words={words} /> : null}
      </div>
    );
  }

  return (
    <div className="page savedPage">
      <ScrollPanel compact>
        <div className="savedWordList">
          {rows.map((word) => (
            <button key={word.id} onClick={() => setSelected({ ...word, saved: true })}>
              {word.word}
            </button>
          ))}
        </div>
      </ScrollPanel>
      <h2 className="tapHint savedHint">Tap any word to see the definition</h2>
      {selected ? <SavedDefinitionSheet selected={selected} setSelected={setSelected} words={words} /> : null}
    </div>
  );
}

function SavedDefinitionSheet({
  selected,
  setSelected,
  words
}: {
  selected: SavedWord;
  setSelected: (word: SavedWord | null) => void;
  words: ReturnType<typeof useAsync<SavedWord[]>>;
}) {
  return (
    <DefinitionBottomSheet
      entry={selected}
      onClose={() => setSelected(null)}
      onChange={(entry) => {
        if (!entry.saved) {
          words.setData((words.data ?? []).filter((word) => word.word.toLowerCase() !== entry.word.toLowerCase()));
          setSelected(null);
          return;
        }
        const next = { ...selected, ...entry, id: selected.id, saved_at: selected.saved_at, saved: true };
        setSelected(next);
        words.setData((words.data ?? []).map((word) => word.id === selected.id ? next : word));
      }}
    />
  );
}

function DefinitionBottomSheet({
  entry,
  onChange,
  onClose
}: {
  entry: WordDefinition;
  onChange: (entry: WordDefinition) => void;
  onClose: () => void;
}) {
  return (
    <div className="sheetBackdrop" onClick={onClose}>
      <div className="sheetSurface" onClick={(event) => event.stopPropagation()}>
        <DefinitionSheet entry={entry} onChange={onChange} onClose={onClose} />
      </div>
    </div>
  );
}

function DefinitionSheet({
  entry,
  onChange,
  onClose
}: {
  entry: WordDefinition;
  onChange: (entry: WordDefinition) => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function toggleSave() {
    if (saving) return;
    setSaving(true);
    try {
      if (entry.saved) {
        await api.removeWord(entry.word);
        onChange({ ...entry, saved: false });
      } else {
        const saved = await api.saveWord(entry);
        onChange({ ...saved, saved: true });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="definitionSheet">
      <div className="definitionHeader">
        <h2>{entry.word}</h2>
        {entry.pronunciation ? <span className="pronounce">{entry.pronunciation} <Volume2 size={15} /></span> : null}
        {entry.translation ? <span>{entry.translation}</span> : null}
        <button className={entry.saved ? 'bookmarkButton active' : 'bookmarkButton'} onClick={toggleSave} aria-label={entry.saved ? 'Remove saved word' : 'Save word'}>
          <Bookmark fill={entry.saved ? 'black' : 'none'} />
        </button>
        <button className="roundClose" onClick={onClose} aria-label="Close definition"><X /></button>
      </div>
      {entry.examples[0] ? <p className="example">{entry.examples[0]}</p> : null}
      {entry.part_of_speech ? <h3>{entry.part_of_speech}</h3> : null}
      {entry.definition ? <ul><li>{entry.definition}</li></ul> : null}
      {entry.examples.slice(1).length ? <ul>{entry.examples.slice(1).map((example) => <li key={example}><i>{example}</i></li>)}</ul> : null}
    </section>
  );
}

function ScoreScreen({ messageId }: { messageId: number | null }) {
  const score = useAsync(() => messageId ? api.getScore(messageId) : Promise.reject(new Error('Missing message_id')), [messageId]);

  if (score.loading) return <StatePanel text="Loading pronunciation analysis..." />;
  if (score.error || !score.data) return <StatePanel text="Could not load pronunciation score." detail={score.error ?? undefined} />;

  const data: PronunciationScore = score.data;
  const metrics = [
    ['Accuracy', data.accuracy_score],
    ['Fluency', data.fluency_score],
    ['Prosody', data.prosody_score],
    ['Grammar', data.grammar_score],
    ['Vocabulary', data.vocabulary_score],
    ['Topic', data.topic_score]
  ] as const;

  return (
    <div className="page scorePage">
      <h1>Pronunciation Analysis</h1>
      <Panel className="scoreGrid">
        {metrics.map(([label, amount]) => (
          <div className="metric" key={label}>
            <span>{label} <CircleHelp size={14} /></span>
            <div><i className={amount >= 70 ? 'good' : 'warn'} style={{ width: `${amount}%` }} /></div>
          </div>
        ))}
      </Panel>
      <h1>Transcript</h1>
      <Panel className="scoreTranscript">{data.transcript}</Panel>
      {data.feedback ? <Panel className="feedbackPanel">{data.feedback}</Panel> : null}
    </div>
  );
}

function LanguageScreen({ profile, onProfile }: { profile: UserProfile; onProfile: (profile: UserProfile) => void }) {
  const [saving, setSaving] = useState<string | null>(null);

  async function selectLanguage(language: string) {
    setSaving(language);
    try {
      onProfile(await api.updateLanguage(language));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="page languagePage">
      <div className="languageRows">
        {languages.map(([code, name]) => (
          <button className={name === profile.native_language ? 'selected' : ''} onClick={() => selectLanguage(name)} key={name}>
            <Avatar />
            <span><b>{code}</b> {name}</span>
            <ChevronDown />
            {saving === name ? <i>Saving...</i> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function StarsScreen({ profile }: { profile: UserProfile }) {
  return (
    <div className="page starsPage">
      <Panel>
        <div className="starsHero">
          <Sparkles />
          <h1>Aqbota Unlimited</h1>
          <p>Status: {profile.subscription_status}</p>
        </div>
        <button className="primaryButton">Monthly subscription · $9.99</button>
        <button className="secondaryButton">Yearly subscription · $49.99</button>
      </Panel>
    </div>
  );
}

function SettingsScreen({ profile }: { profile: UserProfile }) {
  async function sendCommand(command: string) {
    const queryId = window.Telegram?.WebApp?.initDataUnsafe?.query_id;
    if (queryId) {
      await api.answerWebAppCommand(queryId, command);
      window.Telegram?.WebApp?.close?.();
      return;
    }
    if (window.Telegram?.WebApp?.sendData) {
      window.Telegram.WebApp.sendData(command);
      window.Telegram.WebApp.close?.();
      return;
    }
    const target = `https://t.me/${botUsername}`;
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(target, { try_instant_view: false });
      return;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="page settingsPage">
      <SettingsRow icon={Heart} label="Get unlimited access" premium onClick={() => sendCommand('/unlimited')} />
      <SettingsGroup>
        <SettingsRow icon={UserRound} label="Invite friends" onClick={() => sendCommand('/invite')} />
        <SettingsRow icon={Gift} label="Gift subscription" onClick={() => sendCommand('/unlimited')} />
      </SettingsGroup>
      <SettingsGroup>
        <SettingsRow icon={Mic} label={`Change Aqbota voice · ${profile.selected_voice}`} onClick={() => sendCommand('/voice')} />
        <SettingsRow icon={BarChart3} label={`Change your English level · ${profile.english_level}`} onClick={() => sendCommand('/level')} />
        <SettingsRow icon={Flame} label={`Change Aqbota voice speed · ${profile.voice_speed}x`} onClick={() => sendCommand('/voice_speed')} />
        <SettingsRow icon={ListChecks} label="Choose topics" onClick={() => sendCommand('/topics')} />
      </SettingsGroup>
      <SettingsGroup>
        <SettingsRow icon={HelpCircle} label="How to use Aqbota" onClick={() => sendCommand('/help')} />
      </SettingsGroup>
    </div>
  );
}

function SettingsRow({ icon: Icon, label, premium, onClick }: { icon: typeof Heart; label: string; premium?: boolean; onClick?: () => void }) {
  return (
    <button className={premium ? 'settingsRow premium' : 'settingsRow'} onClick={onClick}>
      <span><Icon /></span>
      {label}
      <ChevronRight />
    </button>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <div className="settingsGroup">{children}</div>;
}

function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const items = [
    ['profile', UserRound, 'Profile'],
    ['saved', Bookmark, 'Saved'],
    ['stars', Star, 'Stars'],
    ['language', Globe2, 'Language'],
    ['settings', Settings, 'Settings']
  ] as const;

  return (
    <nav className="bottomNav">
      {items.map(([id, Icon, label]) => (
        <button className={active === id ? 'active' : ''} onClick={() => onChange(id)} key={id}>
          <Icon />
          {label}
        </button>
      ))}
    </nav>
  );
}

function ScrollPanel({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <section className={compact ? 'scrollPanel compact' : 'scrollPanel'}>
      {children}
    </section>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

function StatePanel({ text, detail }: { text: string; detail?: string }) {
  return (
    <div className="page">
      <Panel className="statePanel">
        <p>{text}</p>
        {detail ? <small>{detail}</small> : null}
      </Panel>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Avatar({ large = false }: { large?: boolean }) {
  return (
    <span className={large ? 'avatar large' : 'avatar'}>
      <Bot />
    </span>
  );
}

function languageCode(language: string) {
  return languages.find(([, name]) => name === language)?.[0] ?? language.slice(0, 2).toUpperCase();
}

function buildMonthCells(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<{ day: number; iso: string } | null> = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, iso: toDateKey(new Date(year, monthIndex, day)) });
  }
  return cells;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
