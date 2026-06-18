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
  FileText,
  Gift,
  Globe2,
  Heart,
  HelpCircle,
  ListChecks,
  MessageCircle,
  Mic,
  Settings,
  Star,
  Ticket,
  UserRound,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  api,
  displayMessage,
  telegramUserPhotoUrl,
  type ExplainResult,
  type PronunciationScore,
  type SavedWord,
  type UserProfile,
  type WordDefinition
} from './api';
import { useAsync } from './useAsync';
import { privacyPolicyText, publicOfferText } from './legalDocuments';

type Tab = 'profile' | 'saved' | 'stars' | 'language' | 'settings';
type Mode = 'text' | 'explain' | 'score' | null;
type InterfaceLanguage = 'en' | 'ru';

const languages = [
  ['GB', 'English'],
  ['FR', 'French'],
  ['DE', 'German'],
  ['ES', 'Spanish'],
  ['JP', 'Japanese'],
  ['CN', 'Chinese'],
  ['IT', 'Italian'],
  ['KR', 'Korean'],
  ['KZ', 'Kazakh'],
  ['PT', 'Portuguese'],
  ['RU', 'Russian'],
  ['SA', 'Arabic'],
  ['TR', 'Turkish'],
  ['PL', 'Polish'],
  ['LT', 'Lithuanian'],
  ['MM', 'Myanmar'],
  ['NO', 'Norwegian'],
  ['IR', 'Persian'],
  ['IN', 'Punjabi'],
  ['RO', 'Romanian'],
  ['RS', 'Serbian'],
  ['SK', 'Slovak'],
  ['SI', 'Slovenian'],
  ['ID', 'Sundanese'],
  ['KE', 'Swahili'],
  ['SE', 'Swedish'],
  ['PH', 'Tagalog'],
  ['TJ', 'Tajik'],
  ['TH', 'Thai'],
  ['UA', 'Ukrainian'],
  ['VN', 'Vietnamese'],
  ['MN', 'Mongolian'],
  ['UZ', 'Uzbek']
];

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const botUsername = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'ChattyLinguoBot').replace(/^@/, '');
const appName = 'Aqbota';
const ui = {
  en: {
    opening: 'Opening...',
    loading: 'Loading...',
    openBotFirst: 'Open the bot with /start first, then reopen this Mini App.',
    learner: 'Learner',
    inviteFriends: 'Invite Friends',
    daysStreak: 'days streak',
    wordsSaid: 'Words Said',
    maxStreak: 'Max streak',
    correct: 'Correct',
    messagesSent: 'Messages Sent',
    loadingTranscript: 'Loading transcript...',
    couldNotLoadTranscript: 'Could not load transcript.',
    couldNotLoadWord: 'Could not load this word.',
    couldNotLoadDefinition: 'Could not load definition.',
    showLanguage: (language: string) => `Show ${language}`,
    tapAnyWord: 'Tap any word to see the definition',
    translating: 'Translating...',
    couldNotTranslate: 'Could not translate this text.',
    translate: 'Translate',
    loadingExplanation: 'Loading explanation...',
    couldNotLoadExplanation: 'Could not load explanation.',
    missingMessage: 'Missing message_id',
    askFollowUp: 'Ask a follow-up question...',
    loadingSavedWords: 'Loading saved words...',
    couldNotLoadSavedWords: 'Could not load saved words.',
    emptySaved: 'You do not have any words saved yet! To save a word:\n1. Open transcription of an Aqbota response\n2. Click on a word you want to save\n3. Click the bookmark icon',
    loadingScore: 'Loading pronunciation analysis...',
    couldNotLoadScore: 'Could not load pronunciation score.',
    pronunciationAnalysis: 'Pronunciation Analysis',
    transcript: 'Transcript',
    metrics: ['Accuracy', 'Fluency', 'Prosody', 'Grammar', 'Vocabulary', 'Topic'],
    saving: 'Saving...',
    settings: 'Settings',
    getUnlimited: 'Get unlimited access',
    changeVoice: (voice: string) => `Change Aqbota voice · ${voice}`,
    changeLevel: (level: string) => `Change your English level · ${level}`,
    changeSpeed: (speed: number) => `Change Aqbota voice speed · ${speed}x`,
    chooseTopics: 'Choose topics',
    howToUse: 'How to use Aqbota',
    interfaceLanguage: (language: InterfaceLanguage) => `Interface language · ${language === 'ru' ? 'Russian' : 'English'}`,
    companyInformation: 'Company information',
    chooseInterfaceLanguage: 'Interface language',
    english: 'English',
    russian: 'Russian',
    unlimitedFeatures: [
      'Unlimited messages and audio with Aqbota',
      'Explanations of mistakes, translations, and pronunciation evaluation',
      'More practice tools for faster English progress',
      'Cancel anytime'
    ],
    unlimitedMonth: 'Unlimited Month',
    monthlySubscription: 'Monthly subscription',
    perMonth: 'per month',
    continue: 'Continue',
    yourStars: 'your stars',
    exchangeStars: 'Exchange',
    exchangeConnector: 'for',
    oneTicket: '1 ticket',
    lotteryTitle: 'Win an iPhone 17 this New Year 2026!',
    lotterySubtitle: 'Get lottery tickets to enter.',
    details: 'Details:',
    tickets: (count: number) => `You have ${count} lottery ${count === 1 ? 'ticket' : 'tickets'}.`,
    noTickets: 'You do not have tickets yet, exchange stars to participate',
    dailyStars: 'Daily stars',
    dailyStarsHint: 'Send 10 correct long messages to Chatty every day to maximize this reward!',
    nav: ['Profile', 'Saved', 'Stars', 'Language', 'Settings'],
    removeSavedWord: 'Remove saved word',
    saveWord: 'Save word',
    closeDefinition: 'Close definition',
    sendQuestion: 'Send question',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    companySections: [
      ['Contacts', 'Contact details:\n- Phone and Telegram: +7 776 661 6110\n- Email: schoolskyling@gmail.com\n- Working hours: Monday to Friday, 10:00-19:00\n- Actual address: Kazakhstan, Karaganda\n- Service format: online'],
      ['About service', 'Aqbota is an online English practice bot that helps users improve their English through daily conversation.\n\nWhat the bot does:\n- Replies to user messages in English\n- Corrects mistakes in long messages\n- Explains grammar and vocabulary mistakes\n- Helps save and review useful words\n- Supports voice practice and pronunciation evaluation where available\n- Tracks learning progress and daily activity\n\nHow to use it:\n- Open the Telegram bot and press Start\n- Send text or voice messages in English\n- Read the correction and continue the conversation\n- Open the Mini App to view saved words, stars, progress, settings, and service information\n- For technical questions, contact support using the Contacts section'],
      ['Pricing', 'Monthly plan:\n- Price: 6,000 KZT per month\n- Online English conversation practice\n- Unlimited messages and audio with Aqbota\n- Mistake explanations, translations, and pronunciation evaluation\n- Saved vocabulary and learning progress tools\n\nThe service is provided online after successful payment.'],
      ['Terms of Service', 'Service conditions:\n- Services are provided online.\n- After successful payment, the user receives access automatically or within 24 hours.\n- Access is provided for the period specified in the selected tariff description.\n- To receive the service, the user must provide correct contact details: Telegram, email, or phone number.\n\nSupport:\n- Email: schoolskyling@gmail.com\n- Phone: +7 776 661 6110'],
      ['Refund Policy', 'Refund conditions:\n- The user may refuse the service before the service begins.\n- If the service has not yet been provided, the user may request a refund.\n- Refunds are made using the same payment method used for payment, within timeframes that depend on the bank and payment system.\n- If access to the digital service has already been provided and the user has started using the service, the refund may be limited by the actual volume of services already provided.\n\nTo request a refund, email schoolskyling@gmail.com and include:\n- Full name\n- Payment date\n- Payment amount\n- Reason for refund\n- Contact phone number or email'],
      ['Company Details', 'Business details:\n- Individual Entrepreneur Muratov\n- IIN: 060611551367\n- Address: Kazakhstan, Karaganda, Baiken Ashimova 21\n- Bank: JSC Kaspi Bank\n- KBe: 19\n- BIK: CASPKZKA\n- Account number: KZ59722S000051751772\n- Phone: +7 702 260 11 77\n- Email: ajbatmuratov2@gmail.com'],
      ['License Agreement and Public Offer', publicOfferText],
      ['Privacy Policy', privacyPolicyText]
    ]
  },
  ru: {
    opening: 'Открываем...',
    loading: 'Загрузка...',
    openBotFirst: 'Сначала откройте бота через /start, затем снова откройте Mini App.',
    learner: 'Ученик',
    inviteFriends: 'Пригласить друзей',
    daysStreak: 'дней подряд',
    wordsSaid: 'Сказано слов',
    maxStreak: 'Макс. серия',
    correct: 'Правильно',
    messagesSent: 'Сообщений',
    loadingTranscript: 'Загружаем текст...',
    couldNotLoadTranscript: 'Не удалось загрузить текст.',
    couldNotLoadWord: 'Не удалось загрузить это слово.',
    couldNotLoadDefinition: 'Не удалось загрузить определение.',
    showLanguage: (language: string) => `Показать ${language}`,
    tapAnyWord: 'Нажмите на любое слово, чтобы увидеть определение',
    translating: 'Переводим...',
    couldNotTranslate: 'Не удалось перевести этот текст.',
    translate: 'Перевести',
    loadingExplanation: 'Загружаем объяснение...',
    couldNotLoadExplanation: 'Не удалось загрузить объяснение.',
    missingMessage: 'Не найден message_id',
    askFollowUp: 'Задайте уточняющий вопрос...',
    loadingSavedWords: 'Загружаем сохраненные слова...',
    couldNotLoadSavedWords: 'Не удалось загрузить сохраненные слова.',
    emptySaved: 'У вас пока нет сохраненных слов. Чтобы сохранить слово:\n1. Откройте текст ответа Aqbota\n2. Нажмите на нужное слово\n3. Нажмите значок закладки',
    loadingScore: 'Загружаем анализ произношения...',
    couldNotLoadScore: 'Не удалось загрузить оценку произношения.',
    pronunciationAnalysis: 'Анализ произношения',
    transcript: 'Текст',
    metrics: ['Точность', 'Беглость', 'Интонация', 'Грамматика', 'Словарь', 'Тема'],
    saving: 'Сохраняем...',
    settings: 'Настройки',
    getUnlimited: 'Получить безлимитный доступ',
    changeVoice: (voice: string) => `Изменить голос Aqbota · ${voice}`,
    changeLevel: (level: string) => `Изменить уровень английского · ${level}`,
    changeSpeed: (speed: number) => `Изменить скорость голоса Aqbota · ${speed}x`,
    chooseTopics: 'Выбрать темы',
    howToUse: 'Как пользоваться Aqbota',
    interfaceLanguage: (language: InterfaceLanguage) => `Язык интерфейса · ${language === 'ru' ? 'Русский' : 'Английский'}`,
    companyInformation: 'Информация о компании',
    chooseInterfaceLanguage: 'Язык интерфейса',
    english: 'Английский',
    russian: 'Русский',
    unlimitedFeatures: [
      'Безлимитные сообщения и аудио с Aqbota',
      'Объяснения ошибок, переводы и оценка произношения',
      'Больше инструментов для быстрого прогресса в английском',
      'Можно отменить в любое время'
    ],
    unlimitedMonth: 'Безлимит на месяц',
    monthlySubscription: 'Ежемесячная подписка',
    perMonth: 'в месяц',
    continue: 'Продолжить',
    yourStars: 'ваши звезды',
    exchangeStars: 'Обменять',
    exchangeConnector: 'на',
    oneTicket: '1 билет',
    lotteryTitle: 'Выиграйте iPhone 17 к Новому 2026 году!',
    lotterySubtitle: 'Получайте билеты для участия.',
    details: 'Подробности:',
    tickets: (count: number) => `У вас ${count} ${count === 1 ? 'лотерейный билет' : 'лотерейных билетов'}.`,
    noTickets: 'У вас пока нет билетов, обменяйте звезды для участия',
    dailyStars: 'Ежедневные звезды',
    dailyStarsHint: 'Отправляйте 10 правильных длинных сообщений Chatty каждый день, чтобы получить максимум награды!',
    nav: ['Профиль', 'Слова', 'Звезды', 'Язык', 'Настройки'],
    removeSavedWord: 'Удалить сохраненное слово',
    saveWord: 'Сохранить слово',
    closeDefinition: 'Закрыть определение',
    sendQuestion: 'Отправить вопрос',
    previousMonth: 'Предыдущий месяц',
    nextMonth: 'Следующий месяц',
    companySections: [
      ['Контакты', 'Контактные данные:\n- Телефон и Telegram: +7 776 661 6110\n- Email: schoolskyling@gmail.com\n- Рабочее время: с понедельника по пятницу, 10:00-19:00\n- Фактический адрес: Казахстан, Караганда\n- Формат услуги: онлайн'],
      ['О сервисе', 'Aqbota - онлайн-бот для практики английского языка, который помогает пользователям улучшать английский через ежедневное общение.\n\nЧто делает бот:\n- Отвечает на сообщения пользователя на английском\n- Исправляет ошибки в длинных сообщениях\n- Объясняет ошибки в грамматике и словарном запасе\n- Помогает сохранять и повторять полезные слова\n- Поддерживает голосовую практику и оценку произношения, где это доступно\n- Отслеживает прогресс обучения и ежедневную активность\n\nКак пользоваться:\n- Откройте Telegram-бота и нажмите Start\n- Отправляйте текстовые или голосовые сообщения на английском\n- Читайте исправления и продолжайте разговор\n- Откройте Mini App, чтобы смотреть сохраненные слова, звезды, прогресс, настройки и информацию о сервисе\n- По техническим вопросам обратитесь в поддержку через раздел «Контакты»'],
      ['Стоимость', 'Месячный тариф:\n- Цена: 6 000 KZT в месяц\n- Онлайн-практика разговорного английского\n- Безлимитные сообщения и аудио с Aqbota\n- Объяснения ошибок, переводы и оценка произношения\n- Сохраненный словарь и инструменты прогресса\n\nУслуга предоставляется онлайн после успешной оплаты.'],
      ['Условия использования', 'Условия оказания услуги:\n- Услуги предоставляются онлайн.\n- После успешной оплаты пользователь получает доступ автоматически или в течение 24 часов.\n- Доступ предоставляется на период, указанный в описании выбранного тарифа.\n- Для получения услуги пользователь должен указать корректные контактные данные: Telegram, email или номер телефона.\n\nПоддержка:\n- Email: schoolskyling@gmail.com\n- Телефон: +7 776 661 6110'],
      ['Политика возврата', 'Условия возврата:\n- Пользователь может отказаться от услуги до начала ее оказания.\n- Если услуга еще не была предоставлена, пользователь может запросить возврат.\n- Возврат выполняется тем же способом оплаты, которым была совершена оплата; сроки зависят от банка и платежной системы.\n- Если доступ к цифровой услуге уже предоставлен и пользователь начал пользоваться сервисом, сумма возврата может быть ограничена фактически оказанным объемом услуг.\n\nДля запроса возврата напишите на schoolskyling@gmail.com и укажите:\n- Полное имя\n- Дату оплаты\n- Сумму оплаты\n- Причину возврата\n- Контактный телефон или email'],
      ['Реквизиты компании', 'Данные бизнеса:\n- Индивидуальный предприниматель Муратов\n- ИИН: 060611551367\n- Адрес: Казахстан, Караганда, Байкена Ашимова 21\n- Банк: АО Kaspi Bank\n- КБе: 19\n- БИК: CASPKZKA\n- Номер счета: KZ59722S000051751772\n- Телефон: +7 702 260 11 77\n- Email: ajbatmuratov2@gmail.com'],
      ['Лицензионное соглашение и публичная оферта', publicOfferText],
      ['Политика конфиденциальности', privacyPolicyText]
    ]
  }
} as const;

type UiCopy = (typeof ui)[InterfaceLanguage];

function copyFor(language: string | null | undefined): UiCopy {
  return language === 'ru' ? ui.ru : ui.en;
}

function interfaceLanguage(language: string | null | undefined): InterfaceLanguage {
  return language === 'ru' ? 'ru' : 'en';
}

export default function Home() {
  const [launchState, setLaunchState] = useState<'checking' | 'telegram' | 'browser'>('checking');

  useEffect(() => {
    let attempts = 0;
    let timer: number | undefined;

    const decideLaunchState = () => {
      const webApp = window.Telegram?.WebApp;
      const hasTelegramLaunchData = Boolean(
        webApp?.initData ||
        webApp?.initDataUnsafe?.query_id ||
        webApp?.initDataUnsafe?.user?.id
      );

      if (hasTelegramLaunchData) {
        setLaunchState('telegram');
        return;
      }

      attempts += 1;
      if (attempts >= 5) {
        setLaunchState('browser');
        return;
      }

      timer = window.setTimeout(decideLaunchState, 150);
    };

    decideLaunchState();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (launchState === 'checking') {
    return (
      <main className="appStage">
        <section className="phoneFrame">
          <div className="screen">
            <StatePanel text={ui.en.opening} />
          </div>
        </section>
      </main>
    );
  }

  if (launchState === 'browser') {
    return <BrowserLaunchPage />;
  }

  return <MainApp />;
}

function BrowserLaunchPage() {
  const botUrl = `https://t.me/${botUsername}`;

  return (
    <main className="launchStage">
      <section className="launchCard" aria-labelledby="launch-title">
        <Avatar large />
        <h1 id="launch-title">Chatty - English Tutor</h1>
        <p className="launchHandle">@{botUsername}</p>
        <p className="launchUsers">80 018 monthly users</p>
        <div className="launchCopy">
          <p>Bot No.1 for studying English.</p>
          <p>Channel: <a href="https://t.me/ChattyEnglishBotChannel">@ChattyEnglishBotChannel</a></p>
          <p>Any questions: <a href="https://t.me/karpenoid">@karpenoid</a></p>
        </div>
        <a className="launchButton" href={botUrl}>Start Bot</a>
        <p className="launchFootnote">
          If you have <strong>Telegram</strong>, you can launch <strong>Chatty - English Tutor</strong> right away.
        </p>
      </section>
    </main>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [mode, setMode] = useState<Mode>(null);
  const [messageId, setMessageId] = useState<number | null>(null);
  const profile = useAsync(api.getProfile, []);
  const copy = copyFor(profile.data?.interface_language);

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
    content = <StatePanel text={copy.loading} />;
  } else if (profile.error || !profile.data) {
    content = <StatePanel text={copy.openBotFirst} detail={profile.error ?? undefined} />;
  } else if (mode === 'text') {
    content = <TextScreen messageId={messageId} profile={profile.data} copy={copy} onProfile={updateProfile} onLanguage={() => { setMode(null); setActiveTab('language'); }} />;
  } else if (mode === 'explain') {
    content = <ExplainScreen messageId={messageId} profile={profile.data} copy={copy} />;
  } else if (mode === 'score') {
    content = <ScoreScreen messageId={messageId} copy={copy} />;
  } else if (activeTab === 'saved') {
    content = <SavedScreen copy={copy} />;
  } else if (activeTab === 'language') {
    content = <LanguageScreen profile={profile.data} copy={copy} onProfile={updateProfile} />;
  } else if (activeTab === 'stars') {
    content = <StarsScreen profile={profile.data} copy={copy} />;
  } else if (activeTab === 'settings') {
    content = <SettingsScreen profile={profile.data} copy={copy} onProfile={updateProfile} />;
  } else {
    content = <ProfileScreen profile={profile.data} copy={copy} />;
  }

  return (
    <main className="appStage">
      <section className="phoneFrame">
        <div className="screen">{content}</div>
        {mode === null ? <BottomNav active={activeTab} copy={copy} onChange={setActiveTab} /> : null}
      </section>
    </main>
  );
}

function ProfileScreen({ profile, copy }: { profile: UserProfile; copy: UiCopy }) {
  const today = useMemo(() => new Date(), []);
  const profilePhotoUrl = useMemo(() => telegramUserPhotoUrl(), []);
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
        <Avatar large src={profilePhotoUrl} alt={`${profile.name || profile.username || copy.learner} profile photo`} />
        <h1>{profile.name || profile.username || copy.learner}</h1>
        <p><Star fill="#f2a51a" /> {profile.stars_count}</p>
      </div>
      <button className="primaryButton" onClick={inviteFriends}>{copy.inviteFriends}</button>
      <Panel className="streakPanel">
        <div className="streakTop">
          <Flame />
          <strong>{profile.current_streak}</strong>
        </div>
        <span>{copy.daysStreak}</span>
        <div className="calendarTitle">
          <button onClick={() => moveMonth(-1)} aria-label={copy.previousMonth}><ChevronLeft /></button>
          <b>{title}</b>
          <button onClick={() => moveMonth(1)} aria-label={copy.nextMonth}><ChevronRight /></button>
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
        <Stat value={`${profile.word_count}`} label={copy.wordsSaid} />
        <Stat value={`${profile.maximum_streak}`} label={copy.maxStreak} />
        <Stat value={`${profile.correct_percent}%`} label={copy.correct} />
        <Stat value={`${profile.messages_count}`} label={copy.messagesSent} />
      </Panel>
    </div>
  );
}

function TextScreen({ messageId, profile, copy, onProfile }: { messageId: number | null; profile: UserProfile; copy: UiCopy; onProfile: (profile: UserProfile) => void; onLanguage: () => void }) {
  const message = useAsync(() => messageId ? api.getMessage(messageId) : Promise.reject(new Error(copy.missingMessage)), [messageId, copy.missingMessage]);
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [definitionError, setDefinitionError] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState(profile.native_language);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const text = displayMessage(message.data);

  async function openWord(rawWord: string) {
    const word = rawWord.replace(/[^A-Za-z'-]/g, '');
    if (!word) return;
    setDefinition(null);
    setDefinitionError(null);
    try {
      setDefinition(await api.defineWord(word));
    } catch (error) {
      setDefinitionError(error instanceof Error ? error.message : copy.couldNotLoadWord);
    }
  }

  async function selectTargetLanguage(language: string) {
    setTargetLanguage(language);
    setLanguagePickerOpen(false);
    setShowTranslation(true);
    try {
      onProfile(await api.updateLanguage(language));
    } catch {
      // Keep the immediate selection even if persistence fails; the next profile load will retry from the server.
    }
  }

  if (!message.loading && !message.error && showTranslation) {
    return (
      <TranslationScreen
        text={text}
        targetLanguage={targetLanguage}
        copy={copy}
        onBack={() => setShowTranslation(false)}
        onLanguage={() => setLanguagePickerOpen(true)}
        onTargetLanguage={selectTargetLanguage}
        languagePickerOpen={languagePickerOpen}
        onCloseLanguagePicker={() => setLanguagePickerOpen(false)}
      />
    );
  }

  return (
    <div className="page transcriptPage">
      {message.loading ? <StatePanel text={copy.loadingTranscript} /> : null}
      {message.error ? <StatePanel text={copy.couldNotLoadTranscript} detail={message.error} /> : null}
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
            <button className="translateButton" onClick={() => setShowTranslation(true)} disabled={!text.trim()}>{copy.showLanguage(targetLanguage)}</button>
          </ScrollPanel>
          <h2 className="tapHint">{copy.tapAnyWord}</h2>
          {definitionError ? <StatePanel text={copy.couldNotLoadDefinition} detail={definitionError} /> : null}
          {definition ? <DefinitionBottomSheet entry={definition} copy={copy} onChange={setDefinition} onClose={() => setDefinition(null)} /> : null}
          <button className="languageButton" onClick={() => setLanguagePickerOpen(true)}>
            <b>{languageCode(targetLanguage)}</b> {targetLanguage}
          </button>
          {languagePickerOpen ? (
            <TranslationLanguagePicker
              selectedLanguage={targetLanguage}
              onSelect={selectTargetLanguage}
              onClose={() => setLanguagePickerOpen(false)}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function TranslationScreen({
  text,
  targetLanguage,
  copy,
  onBack,
  onLanguage,
  onTargetLanguage,
  languagePickerOpen,
  onCloseLanguagePicker
}: {
  text: string;
  targetLanguage: string;
  copy: UiCopy;
  onBack: () => void;
  onLanguage: () => void;
  onTargetLanguage: (language: string) => void;
  languagePickerOpen: boolean;
  onCloseLanguagePicker: () => void;
}) {
  const translation = useAsync(() => api.translateText(text, targetLanguage), [text, targetLanguage]);

  return (
    <div className="page translationPage">
      {translation.loading ? <StatePanel text={copy.translating} /> : null}
      {translation.error ? <StatePanel text={copy.couldNotTranslate} detail={translation.error} /> : null}
      {translation.data ? <TranslationResultView translatedText={translation.data.translated_text} copy={copy} onBack={onBack} /> : null}
      <button className="languageButton" onClick={onLanguage}>
        <b>{languageCode(targetLanguage)}</b> {targetLanguage}
      </button>
      {languagePickerOpen ? (
        <TranslationLanguagePicker
          selectedLanguage={targetLanguage}
          onSelect={(language) => {
            onTargetLanguage(language);
            onCloseLanguagePicker();
          }}
          onClose={onCloseLanguagePicker}
        />
      ) : null}
    </div>
  );
}

function TranslationResultView({ translatedText, copy, onBack }: { translatedText: string; copy: UiCopy; onBack: () => void }) {
  return (
    <ScrollPanel>
      <p className="largeText translatedLargeText">{translatedText}</p>
      <button className="translateButton" onClick={onBack}>{copy.translate}</button>
    </ScrollPanel>
  );
}

function TranslationLanguagePicker({
  selectedLanguage,
  onSelect,
  onClose
}: {
  selectedLanguage: string;
  onSelect: (language: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="sheetBackdrop languagePickerBackdrop" onClick={onClose}>
      <div className="sheetSurface languagePickerSheet" onClick={(event) => event.stopPropagation()}>
        <div className="languageRows translationLanguageRows">
          {languages.map(([code, name]) => (
            <button className={name === selectedLanguage ? 'selected' : ''} onClick={() => onSelect(name)} key={name}>
              <span><b>{code}</b> {name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExplainScreen({ messageId, profile, copy }: { messageId: number | null; profile: UserProfile; copy: UiCopy }) {
  const explanation = useAsync(() => messageId ? api.getExplanation(messageId) : Promise.reject(new Error(copy.missingMessage)), [messageId, copy.missingMessage]);
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

  if (explanation.loading) return <StatePanel text={copy.loadingExplanation} />;
  if (explanation.error || !explanation.data) return <StatePanel text={copy.couldNotLoadExplanation} detail={explanation.error ?? undefined} />;

  const data: ExplainResult = explanation.data;
  return (
    <div className="page explainPage">
      <ScrollPanel>
        {data.chatty_text ? <ExplainBubble title={appName} text={data.chatty_text} tone="chatty" /> : null}
        <ExplainBubble title={profile.name || copy.learner} text={data.corrected_text} tone="learner" />
        <p className="explainText">{data.explanation}</p>
        {followUps.map(([prompt, answer]) => (
          <div key={prompt}>
            <ExplainBubble title={profile.name || copy.learner} text={prompt} tone="learner" />
            <ExplainBubble title={appName} text={answer} tone="chatty" />
          </div>
        ))}
        <div className="questionBox">
          <input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void sendFollowUp(); }} placeholder={copy.askFollowUp} />
          <button onClick={sendFollowUp} aria-label={copy.sendQuestion}><ArrowUp /></button>
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

function SavedScreen({ copy }: { copy: UiCopy }) {
  const words = useAsync(api.getSavedWords, []);
  const [selected, setSelected] = useState<SavedWord | null>(null);

  if (words.loading) return <StatePanel text={copy.loadingSavedWords} />;
  if (words.error) return <StatePanel text={copy.couldNotLoadSavedWords} detail={words.error} />;

  const rows = words.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="page savedPage">
        <ScrollPanel>
          <p className="emptySaved">{copy.emptySaved}</p>
        </ScrollPanel>
        {selected ? <SavedDefinitionSheet selected={selected} copy={copy} setSelected={setSelected} words={words} /> : null}
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
      <h2 className="tapHint savedHint">{copy.tapAnyWord}</h2>
      {selected ? <SavedDefinitionSheet selected={selected} copy={copy} setSelected={setSelected} words={words} /> : null}
    </div>
  );
}

function SavedDefinitionSheet({
  selected,
  copy,
  setSelected,
  words
}: {
  selected: SavedWord;
  copy: UiCopy;
  setSelected: (word: SavedWord | null) => void;
  words: ReturnType<typeof useAsync<SavedWord[]>>;
}) {
  return (
    <DefinitionBottomSheet
      entry={selected}
      copy={copy}
      showPronunciation={false}
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
  copy,
  showPronunciation = true,
  onChange,
  onClose
}: {
  entry: WordDefinition;
  copy: UiCopy;
  showPronunciation?: boolean;
  onChange: (entry: WordDefinition) => void;
  onClose: () => void;
}) {
  return (
    <div className="sheetBackdrop" onClick={onClose}>
      <div className="sheetSurface" onClick={(event) => event.stopPropagation()}>
        <DefinitionSheet entry={entry} copy={copy} showPronunciation={showPronunciation} onChange={onChange} onClose={onClose} />
      </div>
    </div>
  );
}

function DefinitionSheet({
  entry,
  copy,
  showPronunciation,
  onChange,
  onClose
}: {
  entry: WordDefinition;
  copy: UiCopy;
  showPronunciation: boolean;
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
        {showPronunciation && entry.pronunciation ? <span className="pronounce">{entry.pronunciation}</span> : null}
        {entry.translation ? <span>{entry.translation}</span> : null}
        <button className={entry.saved ? 'bookmarkButton active' : 'bookmarkButton'} onClick={toggleSave} aria-label={entry.saved ? copy.removeSavedWord : copy.saveWord}>
          <Bookmark fill={entry.saved ? 'black' : 'none'} />
        </button>
        <button className="roundClose" onClick={onClose} aria-label={copy.closeDefinition}><X /></button>
      </div>
      {entry.examples[0] ? <p className="example">{entry.examples[0]}</p> : null}
      {entry.part_of_speech ? <h3>{entry.part_of_speech}</h3> : null}
      {entry.definition ? <ul><li>{entry.definition}</li></ul> : null}
      {entry.examples.slice(1).length ? <ul>{entry.examples.slice(1).map((example) => <li key={example}><i>{example}</i></li>)}</ul> : null}
    </section>
  );
}

function ScoreScreen({ messageId, copy }: { messageId: number | null; copy: UiCopy }) {
  const score = useAsync(() => messageId ? api.getScore(messageId) : Promise.reject(new Error(copy.missingMessage)), [messageId, copy.missingMessage]);

  if (score.loading) return <StatePanel text={copy.loadingScore} />;
  if (score.error || !score.data) return <StatePanel text={copy.couldNotLoadScore} detail={score.error ?? undefined} />;

  const data: PronunciationScore = score.data;
  const metrics = [
    [copy.metrics[0], data.accuracy_score],
    [copy.metrics[1], data.fluency_score],
    [copy.metrics[2], data.prosody_score],
    [copy.metrics[3], data.grammar_score],
    [copy.metrics[4], data.vocabulary_score],
    [copy.metrics[5], data.topic_score]
  ] as const;

  return (
    <div className="page scorePage">
      <h1>{copy.pronunciationAnalysis}</h1>
      <Panel className="scoreGrid">
        {metrics.map(([label, amount]) => (
          <div className="metric" key={label}>
            <span>{label} <CircleHelp size={14} /></span>
            <div><i className={amount >= 70 ? 'good' : 'warn'} style={{ width: `${amount}%` }} /></div>
          </div>
        ))}
      </Panel>
      <h1>{copy.transcript}</h1>
      <Panel className="scoreTranscript">{data.transcript}</Panel>
      {data.feedback ? <Panel className="feedbackPanel">{data.feedback}</Panel> : null}
    </div>
  );
}

function LanguageScreen({ profile, copy, onProfile }: { profile: UserProfile; copy: UiCopy; onProfile: (profile: UserProfile) => void }) {
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
            {saving === name ? <i>{copy.saving}</i> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function StarsScreen({ profile, copy }: { profile: UserProfile; copy: UiCopy }) {
  const [stars, setStars] = useState(profile.stars_count);
  const [tickets, setTickets] = useState(profile.tickets_count);
  const [dailyStars, setDailyStars] = useState(profile.daily_message_stars_count);
  const [exchanging, setExchanging] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const dailySlots = Array.from({ length: 10 }, (_, index) => index < Math.min(dailyStars, 10));

  async function exchangeStars() {
    if (exchanging || stars < 100) return;
    setExchanging(true);
    setExchangeError(null);
    try {
      const next = await api.exchangeStars();
      setStars(next.stars_count);
      setTickets(next.tickets_count);
      setDailyStars(next.daily_message_stars_count);
    } catch (error) {
      setExchangeError(error instanceof Error ? error.message : 'Could not exchange stars.');
    } finally {
      setExchanging(false);
    }
  }

  return (
    <div className="page starsPage">
      <div className="starsHeader">
        <div className="starsBalance">
          <Star fill="#ffb21c" />
          <strong>{stars}</strong>
        </div>
        <span>{copy.yourStars}</span>
      </div>

      <button className="exchangeButton" disabled={stars < 100 || exchanging} onClick={exchangeStars}>
        {copy.exchangeStars} <Star fill="#ffb21c" />100 {copy.exchangeConnector} <Ticket fill="#ff7bab" />{copy.oneTicket}
      </button>
      {exchangeError ? <p className="starsError">{exchangeError}</p> : null}

      <div className="lotteryCopy">
        <p>{copy.lotteryTitle} <Gift fill="#ff3f79" /></p>
        <p>{copy.lotterySubtitle}</p>
        <p>{copy.details} <a href="https://t.me/ChattyEnglishBotChannel">@ChattyEnglishBotChannel</a></p>
      </div>

      <div className="ticketsBox">
        {tickets > 0 ? (
          <span>{copy.tickets(tickets)}</span>
        ) : (
          <span>{copy.noTickets}</span>
        )}
      </div>

      <Panel className="dailyStarsPanel">
        <h2>{copy.dailyStars}</h2>
        <div className="dailyStarRow">
          {dailySlots.map((earned, index) => (
            <Star key={index} fill={earned ? '#ffb21c' : '#858585'} />
          ))}
        </div>
        <p>{copy.dailyStarsHint}</p>
      </Panel>
    </div>
  );
}

function SettingsScreen({ profile, copy, onProfile }: { profile: UserProfile; copy: UiCopy; onProfile: (profile: UserProfile) => void }) {
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showInterfaceLanguage, setShowInterfaceLanguage] = useState(false);

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

  async function selectInterfaceLanguage(language: InterfaceLanguage) {
    onProfile(await api.updateInterfaceLanguage(language));
    setShowInterfaceLanguage(false);
  }

  if (showPlans) {
    return <PlansScreen copy={copy} onBack={() => setShowPlans(false)} onContinue={() => sendCommand('/unlimited')} />;
  }

  if (showCompanyInfo) {
    return <CompanyInfoScreen copy={copy} onBack={() => setShowCompanyInfo(false)} />;
  }

  if (showInterfaceLanguage) {
    return (
      <InterfaceLanguageScreen
        copy={copy}
        selected={interfaceLanguage(profile.interface_language)}
        onBack={() => setShowInterfaceLanguage(false)}
        onSelect={selectInterfaceLanguage}
      />
    );
  }

  return (
    <div className="page settingsPage">
      <SettingsRow icon={Heart} label={copy.getUnlimited} premium onClick={() => setShowPlans(true)} />
      <SettingsGroup>
        <SettingsRow icon={UserRound} label={copy.inviteFriends} onClick={() => sendCommand('/invite')} />
      </SettingsGroup>
      <SettingsGroup>
        <SettingsRow icon={Mic} label={copy.changeVoice(profile.selected_voice)} onClick={() => sendCommand('/voice')} />
        <SettingsRow icon={BarChart3} label={copy.changeLevel(profile.english_level)} onClick={() => sendCommand('/level')} />
        <SettingsRow icon={Flame} label={copy.changeSpeed(profile.voice_speed)} onClick={() => sendCommand('/voice_speed')} />
        <SettingsRow icon={ListChecks} label={copy.chooseTopics} onClick={() => sendCommand('/topics')} />
      </SettingsGroup>
      <SettingsGroup>
        <SettingsRow icon={HelpCircle} label={copy.howToUse} onClick={() => sendCommand('/help')} />
        <SettingsRow icon={Globe2} label={copy.interfaceLanguage(interfaceLanguage(profile.interface_language))} onClick={() => setShowInterfaceLanguage(true)} />
        <SettingsRow icon={FileText} label={copy.companyInformation} onClick={() => setShowCompanyInfo(true)} />
      </SettingsGroup>
    </div>
  );
}

function PlansScreen({ copy, onBack, onContinue }: { copy: UiCopy; onBack: () => void; onContinue: () => void }) {
  return (
    <div className="page plansPage">
      <button className="backButton" onClick={onBack}>
        <ChevronLeft /> {copy.settings}
      </button>
      <div className="plansHero">
        <Heart fill="#ff2b62" />
        <h1>Aqbota Unlimited</h1>
      </div>
      <div className="planFeatures">
        {copy.unlimitedFeatures.map((feature) => (
          <p key={feature}><Check /> {feature}</p>
        ))}
      </div>
      <button className="planOption selected">
        <span>
          <strong>{copy.unlimitedMonth}</strong>
          <small>{copy.monthlySubscription}</small>
        </span>
        <b>
          6000 ₸
          <small>{copy.perMonth}</small>
        </b>
      </button>
      <button className="planContinue" onClick={onContinue}>{copy.continue}</button>
    </div>
  );
}

function InterfaceLanguageScreen({ copy, selected, onBack, onSelect }: { copy: UiCopy; selected: InterfaceLanguage; onBack: () => void; onSelect: (language: InterfaceLanguage) => void }) {
  return (
    <div className="page languagePage">
      <button className="backButton" onClick={onBack}>
        <ChevronLeft /> {copy.settings}
      </button>
      <h1 className="settingsSubTitle">{copy.chooseInterfaceLanguage}</h1>
      <div className="languageRows">
        {([
          ['en', 'GB', copy.english],
          ['ru', 'RU', copy.russian]
        ] as const).map(([id, code, label]) => (
          <button className={id === selected ? 'selected' : ''} onClick={() => onSelect(id)} key={id}>
            <Avatar />
            <span><b>{code}</b> {label}</span>
            <ChevronDown />
          </button>
        ))}
      </div>
    </div>
  );
}

function CompanyInfoScreen({ copy, onBack }: { copy: UiCopy; onBack: () => void }) {
  const legalSections = copy.companySections.slice(-2);
  const [openSection, setOpenSection] = useState<string | null>(legalSections[0][0]);

  return (
    <div className="page companyInfoPage">
      <button className="backButton" onClick={onBack}>
        <ChevronLeft /> {copy.settings}
      </button>
      <h1>{copy.companyInformation}</h1>
      <div className="companyInfoList">
        {legalSections.map(([title, body]) => (
          <button
            className={openSection === title ? 'companyInfoPanel open' : 'companyInfoPanel'}
            key={title}
            onClick={() => setOpenSection(openSection === title ? null : title)}
          >
            <span>
              <h2>{title}</h2>
              <ChevronDown />
            </span>
            {openSection === title ? <p>{body}</p> : null}
          </button>
        ))}
      </div>
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

function BottomNav({ active, copy, onChange }: { active: Tab; copy: UiCopy; onChange: (tab: Tab) => void }) {
  const items = [
    ['profile', UserRound, copy.nav[0]],
    ['saved', Bookmark, copy.nav[1]],
    ['stars', Star, copy.nav[2]],
    ['language', Globe2, copy.nav[3]],
    ['settings', Settings, copy.nav[4]]
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

function Avatar({ large = false, src, alt = 'Aqbota avatar' }: { large?: boolean; src?: string | null; alt?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(src && !imageFailed);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <span className={[large ? 'avatar large' : 'avatar', showPhoto ? 'photoAvatar' : ''].filter(Boolean).join(' ')}>
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src!} alt={alt} onError={() => setImageFailed(true)} />
      ) : <Bot />}
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
