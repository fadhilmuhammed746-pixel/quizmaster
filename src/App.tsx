import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import { downloadCertificate, type CertificateData } from './certificate'
import signatureImage from './assets/elegant-shaheem-signature.png'
import './App.css'

type Role = 'student' | 'admin' | 'master'
type AuthTab = Role | 'register' | 'forgot'
type View = 'dashboard' | 'quiz' | 'play' | 'leaderboard' | 'shop' | 'badges' | 'analytics' | 'id' | 'certificate' | 'students' | 'questions'
type Theme = 'coral' | 'blue' | 'green' | 'purple' | 'orange' | 'pink'

type User = {
  id: string
  username: string
  name: string
  passwordHash: string
  role: Role
  email: string
  mobile: string
  school: string
  className: string
  roll: string
  gender: string
  dob: string
  photo: string
  coins: number
  xp: number
  avatar: number
  frame: number
  nameColor: number
  theme: Theme
  owned: string[]
  enabled: boolean
  lastLogin: number
  streak: number
  lastReward: number
  badges: string[]
}

type Question = { id: string; subject: string; prompt: string; options: string[]; answer: number }
type QuizRecord = { username: string; subject: string; score: number; total: number; date: number; fast: boolean }
type Database = { users: User[]; history: QuizRecord[]; questions: Question[]; announcements: string[] }
type QuizQuestion = Omit<Question, 'id'> & { marked: boolean }
type QuizSession = { questions: QuizQuestion[]; answers: (number | null)[]; index: number; seconds: number; negative: boolean; subject: string }
type ShopItem = { key: string; category: string; label: string; price: number; value: number; theme?: Theme }
type QuizResult = { score: number; total: number; coins: number; xp: number; questions: QuizQuestion[]; answers: (number | null)[] }

const STORAGE_KEY = 'quizverse_demo_v1'
const XP_PER_LEVEL = 100
const themes: Theme[] = ['coral', 'blue', 'green', 'purple', 'orange', 'pink']
const themeColors: Record<Theme, string> = {
  coral: '#ff6b6b', blue: '#3b9cff', green: '#2bb673',
  purple: '#a66cff', orange: '#ff9f1c', pink: '#e83e8c',
}
const timestamp = () => Date.now()
const formatDate = (value: number, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', options).format(value)
const localDateKey = (value: number) => new Date(value).toDateString()
const avatarBackgrounds = ['#ffb3b3', '#b3e0ff', '#c9f2c7', '#ffe9a8', '#e2c6ff', '#ffcf9e', '#a8f0e6', '#f7b6e0']
const badgeNames = ['Beginner', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Quiz Champion', 'Fast Thinker', 'Top Scorer', 'Perfect Score', 'Daily Streak', 'Weekly Winner']
const sampleQuestions: Question[] = [
  { id: 'q1', subject: 'Geography', prompt: 'What is the capital city of Japan?', options: ['Tokyo', 'Seoul', 'Kyoto', 'Osaka'], answer: 0 },
  { id: 'q2', subject: 'Geography', prompt: 'Which is the largest ocean on Earth?', options: ['Atlantic', 'Pacific', 'Indian', 'Arctic'], answer: 1 },
  { id: 'q3', subject: 'Science', prompt: 'What is the chemical symbol for gold?', options: ['Ag', 'Au', 'Gd', 'Go'], answer: 1 },
  { id: 'q4', subject: 'Science', prompt: 'Which planet is closest to the Sun?', options: ['Venus', 'Earth', 'Mercury', 'Mars'], answer: 2 },
  { id: 'q5', subject: 'Science', prompt: 'Which gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], answer: 2 },
  { id: 'q6', subject: 'History', prompt: 'Who was the first president of the United States?', options: ['Lincoln', 'Washington', 'Adams', 'Jefferson'], answer: 1 },
  { id: 'q7', subject: 'History', prompt: 'In which country is the Great Wall?', options: ['India', 'Japan', 'Egypt', 'China'], answer: 3 },
  { id: 'q8', subject: 'Maths', prompt: 'What is 12 × 12?', options: ['124', '144', '134', '122'], answer: 1 },
  { id: 'q9', subject: 'Maths', prompt: 'What is the square root of 81?', options: ['7', '8', '9', '11'], answer: 2 },
  { id: 'q10', subject: 'Languages', prompt: 'What does “gracias” mean in English?', options: ['Hello', 'Thank you', 'Sorry', 'Goodbye'], answer: 1 },
  { id: 'q11', subject: 'Sports', prompt: 'How many players are on a soccer team on the field?', options: ['9', '10', '11', '12'], answer: 2 },
  { id: 'q12', subject: 'Literature', prompt: 'Who wrote Hamlet?', options: ['Dickens', 'Shakespeare', 'Austen', 'Twain'], answer: 1 },
]

const shopItems: ShopItem[] = [
  ...Array.from({ length: 8 }, (_, value) => ({ key: `avatar-${value}`, category: 'avatar', label: `Character ${value + 1}`, price: value ? 60 + value * 20 : 0, value })),
  ...themes.map((theme, value) => ({ key: `theme-${theme}`, category: 'theme', label: `${theme[0].toUpperCase()}${theme.slice(1)} theme`, price: value ? 80 : 0, value, theme })),
  ...Array.from({ length: 6 }, (_, value) => ({ key: `frame-${value}`, category: 'frame', label: `Frame ${value + 1}`, price: value ? 50 : 0, value })),
  ...Array.from({ length: 6 }, (_, value) => ({ key: `color-${value}`, category: 'color', label: `Name color ${value + 1}`, price: value ? 40 : 0, value })),
]

const navByRole: Record<Role, { id: View; label: string; icon: string }[]> = {
  student: [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'quiz', label: 'Play Quiz', icon: '🎮' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'shop', label: 'Shop', icon: '🛍️' },
    { id: 'badges', label: 'Badges', icon: '🏅' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'id', label: 'My ID', icon: '🪪' },
    { id: 'certificate', label: 'Certificate', icon: '📜' },
  ],
  admin: [
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'questions', label: 'Questions', icon: '❓' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  ],
  master: [
    { id: 'questions', label: 'Questions', icon: '❓' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ],
}

function hashPassword(password: string): Promise<string> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
    .then((buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join(''))
}

function createUser(input: Partial<User> & Pick<User, 'id' | 'username' | 'name' | 'passwordHash' | 'role'>): User {
  return {
    id: input.id, username: input.username, name: input.name, passwordHash: input.passwordHash, role: input.role,
    email: input.email ?? '', mobile: input.mobile ?? '', school: input.school ?? '—', className: input.className ?? '—',
    roll: input.roll ?? '', gender: input.gender ?? 'Other', dob: input.dob ?? '', photo: input.photo ?? '',
    coins: input.coins ?? 0, xp: input.xp ?? 0, avatar: input.avatar ?? 0, frame: input.frame ?? 0,
    nameColor: input.nameColor ?? 0, theme: input.theme ?? 'coral', owned: input.owned ?? ['avatar-0', 'theme-coral', 'frame-0', 'color-0'],
    enabled: input.enabled ?? true, lastLogin: input.lastLogin ?? timestamp(), streak: input.streak ?? 0,
    lastReward: input.lastReward ?? 0, badges: input.badges ?? [],
  }
}

async function createSeedDatabase(): Promise<Database> {
  const [adminPassword, masterPassword, studentPassword] = await Promise.all([
    hashPassword('admin123'), hashPassword('master123'), hashPassword('pass123'),
  ])
  const students = [
    ['Nova Patel', 'nova', 'Green Valley', '10A'],
    ['Leo Chen', 'leo', 'Green Valley', '10B'],
    ['Maya Singh', 'maya', 'Sunrise High', '9A'],
    ['Ravi Kumar', 'ravi', 'Sunrise High', '10A'],
    ['Zoe Adams', 'zoe', 'Green Valley', '10A'],
  ]
  const users = [
    createUser({ id: 'ADM-0001', username: 'admin', name: 'Administrator', passwordHash: adminPassword, role: 'admin' }),
    createUser({ id: 'QM-0001', username: 'master', name: 'Quiz Master', passwordHash: masterPassword, role: 'master' }),
    ...students.map(([name, username, school, className], index) => createUser({
      id: `STU-${1001 + index}`, username, name, passwordHash: studentPassword, role: 'student',
      school, className, email: `${username}@mail.com`, mobile: `90000000${index}`, roll: String(index + 1),
      coins: 100 + index * 55, xp: 80 + index * 130, avatar: index + 1, owned: ['avatar-0', 'theme-coral', 'frame-0', 'color-0', `avatar-${index + 1}`],
    })),
  ]
  const history: QuizRecord[] = users.filter((user) => user.role === 'student').flatMap((user, userIndex) =>
    Array.from({ length: 4 + userIndex }, (_, index) => ({
      username: user.username,
      subject: sampleQuestions[(index * 3 + userIndex) % sampleQuestions.length].subject,
      score: Math.max(1, (index * 2 + userIndex) % 6),
      total: 5,
      date: timestamp() - index * 86400000 * (1 + userIndex % 3) * 2,
      fast: index % 3 === 0,
    })),
  )
  return { users, history, questions: sampleQuestions, announcements: ['Welcome to QuizVerse! Win coins by completing quizzes.'] }
}

async function loadDatabase(): Promise<Database> {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return createSeedDatabase()
  const parsed: unknown = JSON.parse(saved)
  if (
    typeof parsed !== 'object' || parsed === null ||
    !('users' in parsed) || !Array.isArray(parsed.users) ||
    !('history' in parsed) || !Array.isArray(parsed.history) ||
    !('questions' in parsed) || !Array.isArray(parsed.questions) ||
    !('announcements' in parsed) || !Array.isArray(parsed.announcements)
  ) throw new Error('Saved QuizVerse data is invalid. Clear this site’s local storage to restart the demo.')
  return parsed as Database
}

function shuffle<T>(values: T[]): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

function Icon({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span aria-hidden="true" className={`emoji-icon ${className}`}>{children}</span>
}

function AppDownloadButton({ compact = false }: { compact?: boolean }) {
  if (Capacitor.isNativePlatform()) return null

  return (
    <a
      className={compact ? 'side-link app-download-side-link' : 'btn blue full-width app-download-link'}
      href={`${import.meta.env.BASE_URL}downloads/quizverse.apk`}
      download="QuizVerse.apk"
      aria-label="Download QuizVerse Android app"
    >
      <Icon>📲</Icon>{compact ? 'Download app' : 'Download Android app (.APK)'}
    </a>
  )
}

function Avatar({ user, size = 48, className = '' }: { user: Pick<User, 'avatar' | 'frame' | 'photo'>; size?: number; className?: string }) {
  const avatar = ((user.avatar % avatarBackgrounds.length) + avatarBackgrounds.length) % avatarBackgrounds.length
  return (
    <span className={`avatar avatar-${avatar} ${className}`} style={{ width: size, height: size, fontSize: Math.max(13, size * .4) }}>
      {user.photo ? <img src={user.photo} alt="" /> : <span>{['🧑🏻‍🎓', '👩🏼‍🚀', '🧑🏽‍🔬', '👨🏾‍🎨', '🧑🏼‍🚀', '👩🏽‍🎓', '🧑🏻‍🏫', '👩🏾‍🔬'][avatar]}</span>}
      {user.frame > 0 && <i className={`frame frame-${user.frame}`} />}
    </span>
  )
}

function Cube() {
  return (
    <div className="scene" aria-label="Rotating quiz character cube">
      <div className="cube">{[1, 2, 3, 4, 5, 6].map((face) => <div className={`cube-face cube-face-${face}`} key={face}><span>{['🧑🏻‍🎓', '👩🏽‍🚀', '🧑🏾‍🔬', '👨🏻‍🎨', '👩🏼‍🎓', '🧑🏽‍🚀'][face - 1]}</span><b>✦</b></div>)}</div>
    </div>
  )
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

function App() {
  const [database, setDatabase] = useState<Database | null>(null)
  const [loadError, setLoadError] = useState('')
  const [roleTab, setRoleTab] = useState<AuthTab>('student')
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  const [view, setView] = useState<View>('dashboard')
  const [darkMode, setDarkMode] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [notice, setNotice] = useState('')
  const [quiz, setQuiz] = useState<QuizSession | null>(null)
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [scope, setScope] = useState('all')
  const [studentSearch, setStudentSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [dialog, setDialog] = useState<'student' | 'admin' | 'announcement' | 'remove-all' | null>(null)
  const [profileStudent, setProfileStudent] = useState<User | null>(null)

  useEffect(() => {
    let active = true
    loadDatabase().then((loaded) => { if (active) setDatabase(loaded) })
      .catch((error: unknown) => { if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load QuizVerse data.') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!database) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(database)) }
    catch (error) {
      console.error('Could not persist QuizVerse demo data.', error)
      queueMicrotask(() => setNotice('Could not save your demo changes. Check browser storage settings.'))
    }
  }, [database])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const currentUser = database?.users.find((user) => user.username === currentUsername) ?? null
  const navItems = currentUser ? navByRole[currentUser.role] : []

  const filteredStudents = useMemo(() => {
    if (!database) return []
    const query = studentSearch.trim().toLowerCase()
    return database.users.filter((user) => {
      if (user.role !== 'student') return false
      const matchesQuery = !query || [user.name, user.username, user.id, user.email].some((value) => value.toLowerCase().includes(query))
      return matchesQuery && (classFilter === 'all' || user.className === classFilter)
    })
  }, [database, studentSearch, classFilter])

  function updateUser(username: string, changes: Partial<User>) {
    setDatabase((current) => current ? { ...current, users: current.users.map((user) => user.username === username ? { ...user, ...changes } : user) } : current)
  }

  function navigate(nextView: View) {
    setView(nextView)
    setProfileStudent(null)
    if (nextView === 'quiz') { setQuiz(null); setQuizResult(null) }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!database) return
    const form = new FormData(event.currentTarget)
    const username = String(form.get('username') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const user = database.users.find((item) => item.username.toLowerCase() === username.toLowerCase())
    const passwordHash = await hashPassword(password)
    if (!user || user.passwordHash !== passwordHash || user.role !== roleTab) {
      setNotice('Those login details do not match this account type.')
      return
    }
    if (!user.enabled) { setNotice('This account is currently disabled. Please contact an administrator.'); return }
    const loggedIn = { ...user, lastLogin: timestamp() }
    setDatabase((current) => current ? { ...current, users: current.users.map((item) => item.username === user.username ? loggedIn : item) } : current)
    setCurrentUsername(user.username)
    setView(user.role === 'student' ? 'dashboard' : user.role === 'admin' ? 'students' : 'questions')
    setNotice(`Welcome to QuizVerse, ${user.name}!`)
  }

  async function handleRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!database) return
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const username = String(form.get('username') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const confirmPassword = String(form.get('confirmPassword') ?? '')
    if (!name || !username || !password) { setNotice('Please fill in your name, username, and password.'); return }
    if (!/^[A-Za-z0-9._-]{3,24}$/.test(username)) { setNotice('Use 3–24 letters, numbers, dots, dashes, or underscores for your username.'); return }
    if (database.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) { setNotice('That username is already taken. Try another one.'); return }
    if (password !== confirmPassword) { setNotice('Your passwords do not match.'); return }
    const photoFile = form.get('photo')
    const photo = photoFile instanceof File && photoFile.size > 0
      ? await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read profile photo.'))
        reader.onerror = () => reject(new Error('Could not read profile photo.'))
        reader.readAsDataURL(photoFile)
      })
      : ''
    const id = `STU-${Math.max(1000, ...database.users.filter((user) => user.role === 'student').map((user) => Number(user.id.replace('STU-', '')) || 0)) + 1}`
    const user = createUser({
      id, username, name, passwordHash: await hashPassword(password), role: 'student',
      mobile: String(form.get('mobile') ?? '').trim(), email: String(form.get('email') ?? '').trim(),
      school: String(form.get('school') ?? '').trim() || '—', className: String(form.get('className') ?? '').trim() || '—',
      roll: String(form.get('roll') ?? '').trim(), gender: String(form.get('gender') ?? 'Other'),
      dob: String(form.get('dob') ?? ''), photo, coins: 50,
    })
    setDatabase((current) => current ? { ...current, users: [...current.users, user] } : current)
    setRoleTab('student')
    setCurrentUsername(user.username)
    setView('dashboard')
    setNotice(`Registration complete! Your Student ID is ${id}.`)
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!database) return
    const form = new FormData(event.currentTarget)
    const username = String(form.get('username') ?? '').trim()
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const password = String(form.get('password') ?? '')
    const user = database.users.find((item) => item.username.toLowerCase() === username.toLowerCase() && item.email.toLowerCase() === email)
    if (!user || !password) { setNotice('Those account details did not match.'); return }
    updateUser(user.username, { passwordHash: await hashPassword(password) })
    setRoleTab(user.role)
    setNotice('Password reset. You can now sign in with your new password.')
  }

  function logout() {
    setCurrentUsername(null)
    setRoleTab('student')
    setQuiz(null)
    setView('dashboard')
    setProfileStudent(null)
  }

  const finishQuiz = useCallback(() => {
    if (!quiz || !currentUser || !database) return
    const correct = quiz.questions.reduce((count, question, index) => count + (quiz.answers[index] === question.answer ? 1 : 0), 0)
    const wrong = quiz.questions.reduce((count, _question, index) => count + (quiz.answers[index] !== null && quiz.answers[index] !== undefined && quiz.answers[index] !== quiz.questions[index].answer ? 1 : 0), 0)
    const score = Math.max(0, correct - (quiz.negative ? wrong * .25 : 0))
    const perfect = correct === quiz.questions.length
    const coins = correct * 5 + 10 + (perfect ? 25 : 0)
    const xp = correct * 10 + 20
    const record: QuizRecord = { username: currentUser.username, subject: quiz.subject, score, total: quiz.questions.length, date: timestamp(), fast: quiz.seconds > 45 }
    setDatabase((current) => current ? {
      ...current,
      history: [...current.history, record],
      users: current.users.map((user) => user.username === currentUser.username ? { ...user, coins: user.coins + coins, xp: user.xp + xp } : user),
    } : current)
    setQuizResult({ score, total: quiz.questions.length, coins, xp, questions: quiz.questions, answers: quiz.answers })
    setQuiz(null)
    setView('quiz')
    setNotice(`Quiz complete! +${coins} coins and +${xp} XP.`)
  }, [quiz, currentUser, database])

  useEffect(() => {
    if (!quiz) return
    const timer = window.setTimeout(() => {
      if (quiz.seconds <= 1) { finishQuiz(); return }
      setQuiz((current) => current ? { ...current, seconds: current.seconds - 1 } : null)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [quiz, finishQuiz])

  function startQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!database) return
    const form = new FormData(event.currentTarget)
    const subject = String(form.get('subject') ?? 'All')
    const negative = form.get('negative') === 'on'
    const candidates = database.questions.filter((question) => subject === 'All' || question.subject === subject)
    if (!candidates.length) { setNotice('There are no questions for this subject yet.'); return }
    const questions = shuffle(candidates).slice(0, 5).map((question) => {
      const shuffledOptions = shuffle(question.options.map((option, index) => ({ option, answer: index === question.answer })))
      return {
        subject: question.subject, prompt: question.prompt, options: shuffledOptions.map((item) => item.option),
        answer: shuffledOptions.findIndex((item) => item.answer), marked: false,
      }
    })
    setQuiz({ questions, answers: questions.map(() => null), index: 0, seconds: 90, negative, subject })
    setQuizResult(null)
    if (form.get('fullscreen') === 'on' && document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen().catch(() => setNotice('Fullscreen is unavailable in this browser.'))
    }
    setView('play')
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!database) return
    const form = new FormData(event.currentTarget)
    const role = dialog === 'admin' ? 'admin' : 'student'
    const username = String(form.get('username') ?? '').trim()
    const name = String(form.get('name') ?? '').trim()
    const password = String(form.get('password') ?? '')
    if (!username || !name || !password) { setNotice('Name, username, and password are required.'); return }
    if (!/^[A-Za-z0-9._-]{3,24}$/.test(username)) { setNotice('Use 3–24 letters, numbers, dots, dashes, or underscores for the username.'); return }
    if (database.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) { setNotice('That username is already in use.'); return }
    const prefix = role === 'admin' ? 'ADM-' : 'STU-'
    const id = `${prefix}${Math.max(0, ...database.users.filter((user) => user.id.startsWith(prefix)).map((user) => Number(user.id.slice(prefix.length)) || 0)) + 1}`
    const user = createUser({
      id, username, name, passwordHash: await hashPassword(password), role,
      email: String(form.get('email') ?? '').trim(), school: String(form.get('school') ?? '').trim() || '—',
      className: String(form.get('className') ?? '').trim() || '—', coins: role === 'student' ? 50 : 0,
    })
    setDatabase((current) => current ? { ...current, users: [...current.users, user] } : current)
    setDialog(null)
    setNotice(`${role === 'admin' ? 'Admin' : 'Student'} account created for @${username}.`)
  }

  function updateCoins(username: string, amount: number) {
    const user = database?.users.find((item) => item.username === username)
    if (!user) return
    updateUser(username, { coins: Math.max(0, user.coins + amount) })
    setNotice(`${amount >= 0 ? 'Awarded' : 'Removed'} ${Math.abs(amount)} coins ${amount >= 0 ? 'to' : 'from'} @${username}.`)
  }

  function removeStudent(username: string) {
    const user = database?.users.find((item) => item.username === username)
    if (!database || !user || !window.confirm(`Remove ${user.name} (@${username}) and their quiz history?`)) return
    setDatabase({ ...database, users: database.users.filter((item) => item.username !== username), history: database.history.filter((record) => record.username !== username) })
    setNotice(`${user.name} was removed.`)
  }

  function removeAllStudents() {
    if (!database) return
    const count = database.users.filter((user) => user.role === 'student').length
    if (!count) { setNotice('There are no students to remove.'); return }
    if (!window.confirm(`Remove all ${count} students and their quiz history? Admins and Quiz Masters will be kept.`)) return
    setDatabase({ ...database, users: database.users.filter((user) => user.role !== 'student'), history: [] })
    setDialog(null)
    setNotice('All student accounts were removed.')
  }

  async function resetPassword(username: string) {
    updateUser(username, { passwordHash: await hashPassword('pass123') })
    setNotice(`@${username}’s demo password was reset to pass123.`)
  }

  function downloadCsv() {
    if (!database) return
    const students = database.users.filter((user) => user.role === 'student')
    const rows = [
      ['Student ID', 'Username', 'Full Name', 'Email', 'School', 'Class', 'Coins', 'XP', 'Quizzes', 'Accuracy'],
      ...students.map((user) => {
        const records = database.history.filter((record) => record.username === user.username)
        const total = records.reduce((sum, record) => sum + record.total, 0)
        const accuracy = total ? Math.round(records.reduce((sum, record) => sum + record.score, 0) / total * 100) : 0
        return [user.id, user.username, user.name, user.email, user.school, user.className, String(user.coins), String(user.xp), String(records.length), `${accuracy}%`]
      }),
    ]
    const csv = rows.map((row) => row.map((field) => `"${field.replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'quizverse-students.csv'
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice('Student roster exported as CSV.')
  }

  function claimDailyReward() {
    if (!currentUser) return
    if (timestamp() - currentUser.lastReward < 86400000) { setNotice('Your next daily reward will be ready tomorrow.'); return }
    updateUser(currentUser.username, { coins: currentUser.coins + 20, xp: currentUser.xp + 10, streak: currentUser.streak + 1, lastReward: timestamp() })
    setNotice('Daily reward claimed: +20 coins and +10 XP!')
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!database) return
    const form = new FormData(event.currentTarget)
    const prompt = String(form.get('prompt') ?? '').trim()
    const subject = String(form.get('subject') ?? '').trim() || 'General'
    const correctAnswer = String(form.get('correct') ?? '').trim()
    const wrongAnswers = [form.get('wrong1'), form.get('wrong2'), form.get('wrong3')].map((item) => String(item ?? '').trim())
    if (!prompt || !correctAnswer || !wrongAnswers[0]) { setNotice('Add a question, its answer, and at least one incorrect option.'); return }
    setDatabase({ ...database, questions: [...database.questions, { id: `custom-${timestamp()}`, subject, prompt, options: [correctAnswer, ...wrongAnswers.filter(Boolean)], answer: 0 }] })
    event.currentTarget.reset()
    setNotice('Question added to the quiz bank.')
  }

  function sendAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!database) return
    const message = String(new FormData(event.currentTarget).get('message') ?? '').trim()
    if (!message) return
    setDatabase({ ...database, announcements: [...database.announcements, message] })
    setDialog(null)
    setNotice('Announcement sent to student dashboards.')
  }

  if (loadError) return <main className="load-error"><strong>QuizVerse could not start.</strong><p>{loadError}</p><button className="btn" onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload() }}>Reset demo data</button></main>
  if (!database) return <main className="loading-screen"><div className="brand-logo">QUIZVERSE</div><div className="loading-orbit">✦</div><p>Setting up your quiz universe…</p></main>

  if (!currentUser) {
    return (
      <div className={`quizverse auth-screen${darkMode ? ' theme-dark' : ''}`}>
        <div className="auth-card card">
          <div className="auth-brand"><div className="brand-logo">QUIZVERSE</div><p>Learn. Play. Level up.</p><Cube /></div>
          <div className="auth-tabs" role="tablist" aria-label="Sign-in type">
            {([['student', 'Student'], ['register', 'Register'], ['master', 'Quiz Master'], ['admin', 'Admin'], ['forgot', 'Forgot?']] as [AuthTab, string][]).map(([tab, label]) =>
              <button type="button" className={`btn small auth-tab${roleTab === tab ? ' selected' : ''}`} key={tab} onClick={() => setRoleTab(tab)}>{label}</button>,
            )}
          </div>
          {roleTab === 'register' ? (
            <form className="auth-form register-form" onSubmit={(event) => void handleRegistration(event)}>
              <div className="form-grid">
                <label>Full name<input name="name" autoComplete="name" placeholder="Your full name" required /></label>
                <label>Unique username<input name="username" autoComplete="username" minLength={3} maxLength={24} placeholder="Choose a username" required /></label>
                <label>Password<input name="password" type="password" autoComplete="new-password" minLength={6} placeholder="At least 6 characters" required /></label>
                <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" placeholder="Type your password again" required /></label>
                <label>Mobile number<input name="mobile" type="tel" placeholder="Mobile number" /></label>
                <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" /></label>
                <label>School / College<input name="school" placeholder="Your school or college" /></label>
                <label>Class<input name="className" placeholder="e.g. Class 10A" /></label>
                <label>Roll number<input name="roll" placeholder="Roll number" /></label>
                <label>Gender<select name="gender" defaultValue="Other"><option>Other</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></label>
                <label>Date of birth<input name="dob" type="date" /></label>
                <label>Profile picture<input name="photo" type="file" accept="image/*" /></label>
              </div>
              <button className="btn green full-width" type="submit">Create student account</button>
            </form>
          ) : roleTab === 'forgot' ? (
            <form className="auth-form" onSubmit={(event) => void handleForgotPassword(event)}>
              <label>Username<input name="username" autoComplete="username" required placeholder="Your username" /></label>
              <label>Registered email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
              <label>New password<input name="password" type="password" minLength={6} autoComplete="new-password" required placeholder="Choose a new password" /></label>
              <button className="btn blue full-width" type="submit">Reset password</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={(event) => void handleLogin(event)}>
              <label>Username<input name="username" autoComplete="username" required placeholder="Enter your username" /></label>
              <label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="Enter your password" /></label>
              <button className="btn full-width" type="submit">Login as {roleTab === 'student' ? 'Student' : roleTab === 'master' ? 'Quiz Master' : 'Admin'}</button>
            </form>
          )}
          <p className="prototype-note">Frontend demo only · do not use real or sensitive data</p>
          <AppDownloadButton />
        </div>
        {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      </div>
    )
  }

  const activeDatabase = database
  const activeUser = currentUser
  const studentHistory = activeDatabase.history.filter((record) => record.username === activeUser.username)
  const totalScore = studentHistory.reduce((sum, record) => sum + record.score, 0)
  const totalAnswered = studentHistory.reduce((sum, record) => sum + record.total, 0)
  const accuracy = totalAnswered ? Math.round(totalScore / totalAnswered * 100) : 0
  const leaderboard = leaderboardRecords(activeDatabase.users, activeDatabase.history, 'all', activeUser)
  const globalRank = leaderboard.findIndex((entry) => entry.user.username === activeUser.username) + 1
  const level = Math.floor(activeUser.xp / XP_PER_LEVEL) + 1
  const isDark = darkMode
  const certificateData: CertificateData = {
    name: activeUser.name,
    username: activeUser.username,
    studentId: activeUser.id,
    email: activeUser.email,
    mobile: activeUser.mobile,
    school: activeUser.school,
    className: activeUser.className,
    roll: activeUser.roll,
    gender: activeUser.gender,
    dateOfBirth: activeUser.dob,
    photo: activeUser.photo,
    quizzesPlayed: studentHistory.length,
    totalScore: studentHistory.reduce((sum, record) => sum + record.score, 0),
    totalQuestions: studentHistory.reduce((sum, record) => sum + record.total, 0),
    accuracy,
    coins: activeUser.coins,
    xp: activeUser.xp,
    level,
    rank: globalRank,
    badges: [...earnedBadges(activeUser, studentHistory, globalRank)],
    subjects: [...new Set(studentHistory.map((record) => record.subject))],
    issuedOn: formatDate(timestamp(), { year: 'numeric', month: 'long', day: 'numeric' }),
  }

  async function handleDownloadCertificate() {
    try {
      await downloadCertificate(certificateData)
      setNotice(Capacitor.isNativePlatform() ? 'Certificate ready to save or share.' : 'Your certificate PDF has been downloaded.')
    } catch (error) {
      console.error('Could not generate the QuizVerse certificate.', error)
      setNotice(error instanceof Error ? `Certificate download failed: ${error.message}` : 'Certificate download failed.')
    }
  }

  function renderMainView(): ReactNode {
    switch (view) {
      case 'dashboard':
        return activeUser.role === 'student'
          ? <StudentDashboard user={activeUser} history={studentHistory} announcements={activeDatabase.announcements} leaders={leaderboard.slice(0, 4).map((entry) => entry.user)} rank={globalRank} accuracy={accuracy} level={level} onClaim={claimDailyReward} onNavigate={navigate} />
          : <AdminDashboard database={activeDatabase} onNavigate={navigate} />
      case 'quiz':
        return <QuizSetup questions={activeDatabase.questions} result={quizResult} history={studentHistory} onStart={startQuiz} />
      case 'play':
        return quiz ? <QuizPlay quiz={quiz} onAnswer={(answer) => setQuiz((current) => current ? { ...current, answers: current.answers.map((item, index) => index === current.index ? answer : item) } : current)} onNavigateQuestion={(index) => setQuiz((current) => current ? { ...current, index: Math.max(0, Math.min(current.questions.length - 1, index)) } : current)} onToggleBookmark={() => setQuiz((current) => current ? { ...current, questions: current.questions.map((question, index) => index === current.index ? { ...question, marked: !question.marked } : question) } : current)} onSubmit={finishQuiz} />
          : <QuizSetup questions={activeDatabase.questions} result={quizResult} history={studentHistory} onStart={startQuiz} />
      case 'leaderboard':
        return <Leaderboard users={activeDatabase.users} history={activeDatabase.history} currentUser={activeUser} scope={scope} onScope={setScope} />
      case 'shop':
        return <Shop user={activeUser} items={shopItems} onBuy={(item) => {
          if (!activeUser.owned.includes(item.key) && activeUser.coins < item.price) { setNotice('You need more coins to unlock that reward.'); return }
          const changes: Partial<User> = { owned: activeUser.owned.includes(item.key) ? activeUser.owned : [...activeUser.owned, item.key] }
          if (item.category === 'avatar') changes.avatar = item.value
          if (item.category === 'frame') changes.frame = item.value
          if (item.category === 'color') changes.nameColor = item.value
          if (item.theme) changes.theme = item.theme
          if (!activeUser.owned.includes(item.key)) changes.coins = activeUser.coins - item.price
          updateUser(activeUser.username, changes)
          setNotice(`${item.label} ${activeUser.owned.includes(item.key) ? 'equipped' : 'unlocked'}!`)
        }} />
      case 'badges':
        return <Badges user={activeUser} history={studentHistory} rank={globalRank} />
      case 'analytics':
        return activeUser.role === 'student'
          ? <StudentAnalytics records={studentHistory} accuracy={accuracy} totalScore={totalScore} onExport={downloadCsv} />
          : <AdminAnalytics database={activeDatabase} />
      case 'id':
        return <StudentId user={activeUser} level={level} />
      case 'certificate':
        return <StudentCertificate data={certificateData} onDownload={() => void handleDownloadCertificate()} />
      case 'students':
        return <StudentManagement users={filteredStudents} allStudents={activeDatabase.users.filter((user) => user.role === 'student')} history={activeDatabase.history} search={studentSearch} classFilter={classFilter} onSearch={setStudentSearch} onClassFilter={setClassFilter} onAddStudent={() => setDialog('student')} onAddAdmin={() => setDialog('admin')} onRemoveAll={() => setDialog('remove-all')} onExport={downloadCsv} onAnnouncement={() => setDialog('announcement')} onCoins={updateCoins} onToggle={(user) => updateUser(user.username, { enabled: !user.enabled })} onResetPassword={(username) => void resetPassword(username)} onRemove={removeStudent} onProfile={setProfileStudent} />
      case 'questions':
        return <QuestionBank questions={activeDatabase.questions} onAdd={submitQuestion} onRemove={(id) => setDatabase((current) => current ? { ...current, questions: current.questions.filter((question) => question.id !== id) } : current)} />
    }
  }

  return (
    <div className={`quizverse app-screen${isDark ? ' theme-dark' : ''}`} style={{ '--accent': themeColors[activeUser.theme] } as React.CSSProperties}>
      <aside className="side">
        <div className="brand-logo">QUIZVERSE</div>
        <span className="side-caption">{activeUser.role === 'student' ? 'YOUR LEARNING SPACE' : 'MANAGEMENT'}</span>
        <nav className="side-nav" aria-label={`${activeUser.role} navigation`}>
          {navItems.map((item) => <button type="button" className={`side-link${view === item.id ? ' on' : ''}`} key={item.id} onClick={() => navigate(item.id)}><Icon>{item.icon}</Icon>{item.label}</button>)}
        </nav>
        <div className="side-spacer" />
        <Card className="sidebar-motivation">
          <span>✦ KEEP GOING ✦</span><strong>Every quiz makes you a little brighter.</strong><div className="tiny-mascots">🧑🏻‍🎓 🧑🏽‍🚀</div>
        </Card>
        <div className="side-tools">
          <button type="button" className="side-link" onClick={() => setDarkMode((previous) => !previous)}><Icon>{darkMode ? '☀️' : '🌓'}</Icon>{darkMode ? 'Light mode' : 'Dark mode'}</button>
          <AppDownloadButton compact />
          <button type="button" className="side-link" onClick={logout}><Icon>🚪</Icon>Log out</button>
        </div>
        <button type="button" className="signed-in-user" onClick={() => activeUser.role === 'student' ? navigate('id') : setNotice(`Signed in as ${activeUser.name} · ${activeUser.role}`)}>
          <Avatar user={activeUser} size={38} /><span><b>{activeUser.name}</b><small>@{activeUser.username} · {activeUser.role}</small></span><b className="user-menu-dot">•••</b>
        </button>
      </aside>
      <main className="main">
        <header className="top-header"><div><span className="muted">QuizVerse</span><b> / </b><strong>{pageTitle(view, activeUser.role)}</strong></div><div className="header-right"><span className="today-pill">📅 {formatDate(timestamp(), { month: 'short', day: 'numeric' })}</span><button type="button" className="header-icon" aria-label="Notifications" onClick={() => setNotice(activeDatabase.announcements.at(-1) ?? 'You’re all caught up!')}>🔔<i /></button><button type="button" className="header-profile" onClick={() => activeUser.role === 'student' ? navigate('id') : setNotice(`${activeUser.name} · ${activeUser.role}`)}><Avatar user={activeUser} size={34} /><span>@{activeUser.username}</span></button></div></header>
        <div className="view-content">{renderMainView()}</div>
      </main>
      {dialog && <AppDialog kind={dialog} onClose={() => setDialog(null)} onSubmit={dialog === 'announcement' ? sendAnnouncement : dialog === 'remove-all' ? (event) => { event.preventDefault(); removeAllStudents() } : (event) => void createAccount(event)} />}
      {profileStudent && <StudentProfile user={profileStudent} records={database.history.filter((record) => record.username === profileStudent.username)} onClose={() => setProfileStudent(null)} />}
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
    </div>
  )
}

function pageTitle(view: View, role: Role): string {
  if (view === 'dashboard') return role === 'student' ? 'Dashboard' : 'Overview'
  return ({ quiz: 'Play Quiz', play: 'Quiz time', leaderboard: 'Leaderboard', shop: 'Rewards shop', badges: 'My badges', analytics: role === 'student' ? 'My analytics' : 'Admin analytics', id: 'Student ID', certificate: 'Certificate', students: 'Students', questions: 'Question bank' })[view]
}

function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: ReactNode; description?: string; children?: ReactNode }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{children && <div className="heading-actions">{children}</div>}</div>
}

function StudentDashboard({ user, history, announcements, leaders, rank, accuracy, level, onClaim, onNavigate }: { user: User; history: QuizRecord[]; announcements: string[]; leaders: User[]; rank: number; accuracy: number; level: number; onClaim: () => void; onNavigate: (view: View) => void }) {
  const rewardReady = timestamp() - user.lastReward >= 86400000
  const progress = user.xp % XP_PER_LEVEL
  return (
    <>
      <PageHeading eyebrow={`${user.id} · ${user.school} · ${user.className}`} title={<>Welcome back, {user.name}! <span>👋</span></>} description="A new day is a new chance to learn something brilliant." />
      <div className="grid stats-grid">
        {[[`🪙 Coins`, user.coins.toLocaleString()], ['⚡ XP', user.xp.toLocaleString()], ['⭐ Level', level], ['🏆 Rank', `#${rank || '—'}`]].map(([label, value]) => <Card className="tilt stat-card" key={label}><span className="muted">{label}</span><strong>{value}</strong>{label === '⚡ XP' && <div className="level-progress"><i style={{ width: `${progress}%` }} /></div>}</Card>)}
      </div>
      <div className="grid dashboard-grid">
        <Card className="tilt"><h2>🎁 Daily reward</h2><p className="muted">You’re on a {user.streak}-day streak. Keep showing up!</p><button type="button" className="btn yellow" disabled={!rewardReady} onClick={onClaim}>{rewardReady ? 'Claim +20 coins · +10 XP' : 'Come back tomorrow'}</button></Card>
        <Card className="tilt"><h2>🔔 Notifications</h2>{announcements.slice(-3).reverse().map((announcement, index) => <p className="announcement-line" key={`${announcement}-${index}`}>📢 {announcement}</p>)}<p className="announcement-line">📝 A new quiz is ready to play!</p></Card>
        <Card className="tilt"><h2>📝 Recent quizzes</h2>{history.slice(-3).reverse().map((record, index) => <p className="list-line" key={`${record.date}-${index}`}><span>{record.subject}</span><b>{record.score}/{record.total}</b></p>)}{!history.length && <p className="muted">Your first quiz is just around the corner.</p>}<h3 className="subheading">Coming up</h3><p className="muted">Weekly Challenge · Saturday</p></Card>
        <Card className="tilt"><div className="card-title-row"><h2>🏆 Leaderboard</h2><button className="text-link" type="button" onClick={() => onNavigate('leaderboard')}>See all →</button></div>{leaders.map((leader, index) => <p className="list-line" key={leader.id}><span>{index + 1}. @{leader.username}</span><b>{leader.xp.toLocaleString()} XP</b></p>)}</Card>
        <Card className="tilt dashboard-cta"><div><span className="eyebrow">READY, SET, LEARN!</span><h2>Your next big win starts with one question.</h2><button type="button" className="btn" onClick={() => onNavigate('quiz')}>Play a quiz <span>→</span></button></div><div className="cta-mascot" aria-hidden="true">🧑🏻‍🎓</div></Card>
        <Card className="tilt"><h2>📈 Your progress</h2><div className="mini-metric"><strong>{accuracy}%</strong><span className="muted">accuracy across your quizzes</span></div><div className="progress-track"><i style={{ width: `${accuracy}%` }} /></div><button className="text-link" type="button" onClick={() => onNavigate('analytics')}>View my analytics →</button></Card>
        <Card className="tilt"><h2>📜 Your achievement certificate</h2><p className="muted">Download a personalized certificate with your quiz history, coins, XP, level, and badges.</p><button type="button" className="btn blue" onClick={() => onNavigate('certificate')}>View certificate →</button></Card>
      </div>
    </>
  )
}

function AdminDashboard({ database, onNavigate }: { database: Database; onNavigate: (view: View) => void }) {
  const students = database.users.filter((user) => user.role === 'student')
  const active = students.filter((user) => user.enabled).length
  const score = database.history.length ? Math.round(database.history.reduce((sum, record) => sum + record.score / record.total, 0) / database.history.length * 100) : 0
  const today = localDateKey(timestamp())
  const logins = database.users.filter((user) => localDateKey(user.lastLogin) === today).length
  return <>
    <PageHeading eyebrow="YOUR LEARNING COMMUNITY" title="Welcome back, Administrator!" description="Here’s how your learning community is doing." />
    <div className="grid stats-grid admin-stats">{[['👥 Students', students.length], ['✅ Active', active], ['🎮 Quizzes taken', database.history.length], ['❓ Questions', database.questions.length], ['📊 Average score', `${score}%`], ['🪙 Coins awarded', students.reduce((sum, user) => sum + user.coins, 0).toLocaleString()], ['🔔 Logins today', logins], ['📣 Announcements', database.announcements.length]].map(([label, value]) => <Card className="tilt stat-card" key={label}><span className="muted">{label}</span><strong>{value}</strong></Card>)}</div>
    <div className="grid dashboard-grid">
      <Card><h2>📈 Student activity</h2><BarChart values={students.slice(0, 8).map((user) => ({ label: user.username, value: user.xp }))} /></Card>
      <Card><h2>⚡ Quick actions</h2><div className="quick-actions"><button className="btn green" onClick={() => onNavigate('students')}>👥 Manage students</button><button className="btn blue" onClick={() => onNavigate('questions')}>❓ Add questions</button><button className="btn yellow" onClick={() => onNavigate('leaderboard')}>🏆 Open leaderboard</button></div></Card>
    </div>
  </>
}

function QuizSetup({ questions, result, history, onStart }: { questions: Question[]; result: QuizResult | null; history: QuizRecord[]; onStart: (event: FormEvent<HTMLFormElement>) => void }) {
  const subjects = [...new Set(questions.map((question) => question.subject))]
  return <>
    <PageHeading eyebrow="PICK A SUBJECT, MAKE YOUR MARK" title="🎮 Ready to play?" description="Up to five random questions. Ninety seconds. How many can you get right?" />
    <Card className="quiz-setup-card">
      <form className="quiz-setup-form" onSubmit={onStart}>
        <label>Choose a subject<select name="subject" defaultValue="All"><option>All</option>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select></label>
        <label className="check-label"><input type="checkbox" name="negative" /> Enable negative marking (−0.25 per wrong answer)</label>
        <label className="check-label"><input type="checkbox" name="fullscreen" /> Open the quiz in fullscreen</label>
        <p className="muted">Questions and answer choices are shuffled every time. Bookmark a question to find it during review.</p>
        <button type="submit" className="btn green">Start quiz · up to 5 questions · 90s</button>
      </form>
    </Card>
    {result && <Card className="result-card"><span className="eyebrow">QUIZ COMPLETE</span><h2>🎉 You scored {result.score}/{result.total}</h2><p>+{result.coins} coins · +{result.xp} XP</p><div className="answer-review"><h3>Review your answers</h3>{result.questions.map((question, questionIndex) => <div className="review-question" key={`${question.prompt}-${questionIndex}`}><strong>{questionIndex + 1}. {question.prompt} {question.marked && '★'}</strong>{question.options.map((option, optionIndex) => <span className={`review-option${optionIndex === question.answer ? ' correct' : result.answers[questionIndex] === optionIndex ? ' incorrect' : ''}`} key={`${option}-${optionIndex}`}>{optionIndex === question.answer ? '✓ ' : result.answers[questionIndex] === optionIndex ? '✗ ' : ''}{option}</span>)}</div>)}</div></Card>}
    <Card className="history-card"><h2>📝 Your quiz history</h2>{history.slice(-8).reverse().map((record, index) => <p className="list-line" key={`${record.date}-${index}`}><span>{record.subject} · {formatDate(record.date)}</span><b>{record.score}/{record.total}</b></p>)}{!history.length && <p className="muted">Completed quizzes will appear here.</p>}</Card>
  </>
}

function QuizPlay({ quiz, onAnswer, onNavigateQuestion, onToggleBookmark, onSubmit }: { quiz: QuizSession; onAnswer: (answer: number) => void; onNavigateQuestion: (index: number) => void; onToggleBookmark: () => void; onSubmit: () => void }) {
  const question = quiz.questions[quiz.index]
  const selected = quiz.answers[quiz.index]
  const marked = quiz.questions.map((item, index) => item.marked ? index + 1 : null).filter((item): item is number => item !== null)
  return <div className="play-screen">
    <PageHeading eyebrow={`SUBJECT · ${quiz.subject}`} title="🎮 Quiz time!" description="Take your time. You’ve got this." />
    <Card className="play-card">
      <div className="quiz-meta"><strong>Question {quiz.index + 1} of {quiz.questions.length}</strong><strong className={quiz.seconds < 20 ? 'timer-warning' : ''}>⏱ {Math.floor(quiz.seconds / 60)}:{String(quiz.seconds % 60).padStart(2, '0')}</strong></div>
      <div className="progress-track quiz-progress"><i style={{ width: `${((quiz.index + 1) / quiz.questions.length) * 100}%` }} /></div>
      <span className="pill">{question.subject}</span><h2 className="question-prompt">{question.prompt}</h2>
      <div className="options-list">{question.options.map((option, index) => <button type="button" className={`answer-option${selected === index ? ' selected' : ''}`} key={`${question.prompt}-${index}`} onClick={() => onAnswer(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
      <div className="quiz-actions"><button className={`btn small yellow${question.marked ? ' bookmark-active' : ''}`} type="button" onClick={onToggleBookmark}>{question.marked ? '★ Bookmarked' : '☆ Bookmark'}</button><span className="spacer" /><button className="btn small secondary" type="button" disabled={quiz.index === 0} onClick={() => onNavigateQuestion(quiz.index - 1)}>← Previous</button>{quiz.index < quiz.questions.length - 1 ? <button className="btn small blue" type="button" onClick={() => onNavigateQuestion(quiz.index + 1)}>Next →</button> : <button className="btn small green" type="button" onClick={onSubmit}>Submit quiz</button>}</div>
      <p className="muted bookmark-list">Bookmarked: {marked.length ? marked.join(', ') : 'none'}</p>
    </Card>
  </div>
}

function leaderboardRecords(users: User[], history: QuizRecord[], scope: string, me: User) {
  const days = ({ weekly: 7, monthly: 30, yearly: 365 } as Record<string, number>)[scope]
  return users.filter((user) => {
    if (user.role !== 'student' || !user.enabled) return false
    if (scope === 'school' && user.school !== me.school) return false
    if (scope === 'class' && (user.school !== me.school || user.className !== me.className)) return false
    if (scope === 'friends' && user.username !== me.username && (user.school !== me.school || user.className !== me.className)) return false
    return true
  }).map((user) => {
    const records = history.filter((record) => record.username === user.username && (!days || timestamp() - record.date <= days * 86400000))
    const score = records.reduce((sum, record) => sum + record.score, 0)
    const total = records.reduce((sum, record) => sum + record.total, 0)
    return { user, score, accuracy: total ? Math.round(score / total * 100) : 0 }
  }).sort((left, right) => right.score - left.score || right.user.xp - left.user.xp)
}

function Leaderboard({ users, history, currentUser, scope, onScope }: { users: User[]; history: QuizRecord[]; currentUser: User; scope: string; onScope: (scope: string) => void }) {
  const entries = leaderboardRecords(users, history, scope, currentUser)
  const scopes = [['all', 'Global / All-time'], ['school', 'School'], ['class', 'Class'], ['friends', 'Friends'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']]
  return <>
    <PageHeading eyebrow="A LITTLE FRIENDLY COMPETITION" title="🏆 Leaderboard" description="Celebrate the curious minds reaching new heights." />
    <div className="scope-tabs">{scopes.map(([value, label]) => <button type="button" className={`btn small${scope === value ? ' selected' : ' secondary'}`} key={value} onClick={() => onScope(value)}>{label}</button>)}</div>
    <Card className="table-card"><div className="table-scroll"><table><thead><tr><th>RANK</th><th>STUDENT</th><th>COINS</th><th>XP</th><th>TOTAL SCORE</th><th>ACCURACY</th></tr></thead><tbody>{entries.map(({ user, score, accuracy }, index) => <tr key={user.id} className={user.username === currentUser.username ? 'current-row' : ''}><td>{['🥇', '🥈', '🥉'][index] ?? `#${index + 1}`}</td><td><span className="table-user"><Avatar user={user} size={36} /><span><b>@{user.username}</b><small>{user.name}</small></span></span></td><td>🪙 {user.coins.toLocaleString()}</td><td>⚡ {user.xp.toLocaleString()}</td><td>{score}</td><td>{accuracy}%</td></tr>)}</tbody></table></div></Card>
  </>
}

function Shop({ user, items, onBuy }: { user: User; items: ShopItem[]; onBuy: (item: ShopItem) => void }) {
  const groups = [...new Set(items.map((item) => item.category))]
  return <>
    <PageHeading eyebrow="MAKE YOUR PROFILE YOUR OWN" title={<>🛍️ The reward shop <span className="pill">🪙 {user.coins}</span></>} description="Spend your quiz coins on a little personality." />
    {groups.map((category) => <section className="shop-section" key={category}><h2>{({ avatar: '🧑‍🎤 Avatars', theme: '🎨 Themes', frame: '🖼️ Frames', color: '🌈 Name colors' } as Record<string, string>)[category]}</h2><div className="grid shop-grid">{items.filter((item) => item.category === category).map((item) => {
      const owned = user.owned.includes(item.key)
      const equipped = item.category === 'avatar' ? user.avatar === item.value : item.category === 'frame' ? user.frame === item.value : item.category === 'color' ? user.nameColor === item.value : user.theme === item.theme
      return <Card className="tilt shop-item" key={item.key}><div className={`shop-preview preview-${category}`} style={item.theme ? { background: themeColors[item.theme] } : undefined}>{category === 'avatar' ? <span>{['🧑🏻‍🎓', '👩🏼‍🚀', '🧑🏽‍🔬', '👨🏾‍🎨', '🧑🏼‍🚀', '👩🏽‍🎓', '🧑🏻‍🏫', '👩🏾‍🔬'][item.value]}</span> : category === 'frame' ? <span className={`frame-demo frame-${item.value}`}>✦</span> : category === 'color' ? <b style={{ color: ['#1c2b2d', '#e04848', '#2b8bff', '#2bb673', '#b66dff', '#e8a900'][item.value] }}>@{user.username}</b> : <span>✦</span>}</div><b>{item.label}</b><button type="button" className={`btn small ${owned ? 'green' : 'yellow'}`} disabled={equipped} onClick={() => onBuy(item)}>{equipped ? 'Equipped' : owned ? 'Equip' : `🪙 ${item.price}`}</button></Card>
    })}</div></section>)}
  </>
}

function earnedBadges(user: User, history: QuizRecord[], rank: number): Set<string> {
  const earned = new Set(user.badges)
  if (history.length) earned.add('Beginner')
  ;[['Bronze', 100], ['Silver', 300], ['Gold', 600], ['Platinum', 1000], ['Diamond', 2000]].forEach(([name, xp]) => { if (user.xp >= Number(xp)) earned.add(String(name)) })
  if (history.length >= 10) earned.add('Quiz Champion')
  if (history.some((record) => record.fast)) earned.add('Fast Thinker')
  if (history.some((record) => record.score === record.total)) earned.add('Perfect Score')
  if (user.streak >= 3) earned.add('Daily Streak')
  if (rank === 1) { earned.add('Top Scorer'); earned.add('Weekly Winner') }
  return earned
}

function Badges({ user, history, rank }: { user: User; history: QuizRecord[]; rank: number }) {
  const earned = earnedBadges(user, history, rank)
  return <><PageHeading eyebrow="EVERY ACHIEVEMENT TELLS A STORY" title="🏅 Your badges" description="Keep exploring to unlock them all." /><div className="grid badge-grid">{badgeNames.map((name) => <Card className={`tilt badge-card${earned.has(name) ? '' : ' locked'}`} key={name}><span className="badge-art">{earned.has(name) ? '🏅' : '🔒'}</span><b>{name}</b><span className="muted">{earned.has(name) ? 'Unlocked!' : 'Keep playing to unlock'}</span></Card>)}</div></>
}

function BarChart({ values }: { values: { label: string; value: number }[] }) {
  const max = Math.max(1, ...values.map((item) => item.value))
  return <div className="bar-chart">{values.map((item) => <div className="bar-column" key={item.label}><span>{item.value}</span><i style={{ height: `${Math.max(5, item.value / max * 100)}%` }} /><small>{item.label}</small></div>)}</div>
}

function StudentAnalytics({ records, accuracy, totalScore, onExport }: { records: QuizRecord[]; accuracy: number; totalScore: number; onExport: () => void }) {
  const subjects = [...new Set(records.map((record) => record.subject))].map((subject) => {
    const subjectRecords = records.filter((record) => record.subject === subject)
    const score = subjectRecords.reduce((sum, record) => sum + record.score, 0)
    const total = subjectRecords.reduce((sum, record) => sum + record.total, 0)
    return { label: subject, value: total ? Math.round(score / total * 100) : 0 }
  })
  return <>
    <PageHeading eyebrow="YOUR PERSONAL PROGRESS REPORT" title="📊 My analytics" description="See what you’ve learned and where you’re headed." />
    <div className="grid stats-grid"><Card className="stat-card"><span className="muted">Accuracy</span><strong>{accuracy}%</strong></Card><Card className="stat-card"><span className="muted">Quiz attempts</span><strong>{records.length}</strong></Card><Card className="stat-card"><span className="muted">Total score</span><strong>{totalScore}</strong></Card></div>
    <Card className="chart-card"><h2>📈 Recent quiz scores</h2><BarChart values={records.slice(-8).map((record, index) => ({ label: `#${index + 1}`, value: record.total ? Math.round(record.score / record.total * 100) : 0 }))} /></Card>
    <Card className="chart-card"><h2>📚 Subject performance</h2>{subjects.length ? <BarChart values={subjects} /> : <p className="muted">Complete a quiz to see your subject performance.</p>}</Card>
    <div className="report-actions"><button type="button" className="btn blue" onClick={onExport}>Export report (CSV)</button><button type="button" className="btn yellow" onClick={() => window.print()}>Print report card</button></div>
  </>
}

function AdminAnalytics({ database }: { database: Database }) {
  const students = database.users.filter((user) => user.role === 'student')
  const active = students.filter((user) => user.enabled).length
  const average = database.history.length ? Math.round(database.history.reduce((sum, record) => sum + record.score / record.total, 0) / database.history.length * 100) : 0
  const passed = database.history.filter((record) => record.score / record.total >= .4).length
  return <>
    <PageHeading eyebrow="THE BIG PICTURE" title="📈 Admin analytics" description="A snapshot of activity across your learning community." />
    <div className="grid stats-grid admin-stats">{[['Total students', students.length], ['Active students', active], ['Quizzes taken', database.history.length], ['Questions created', database.questions.length], ['Average score', `${average}%`], ['Pass percentage', `${database.history.length ? Math.round(passed / database.history.length * 100) : 0}%`], ['Coins distributed', students.reduce((sum, user) => sum + user.coins, 0)], ['Daily logins', database.users.filter((user) => localDateKey(user.lastLogin) === localDateKey(timestamp())).length]].map(([label, value]) => <Card className="stat-card" key={label}><span className="muted">{label}</span><strong>{value}</strong></Card>)}</div>
    <Card className="chart-card"><h2>⚡ XP by student</h2><BarChart values={students.map((user) => ({ label: user.username, value: user.xp }))} /></Card>
  </>
}

function makeQr(userId: string): ReactNode {
  let seed = 5381
  for (const char of userId) seed = (Math.imul(seed, 33) ^ char.charCodeAt(0)) >>> 0
  const cells: ReactNode[] = []
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
    const localX = x > 13 ? x - 14 : x
    const localY = y > 13 ? y - 14 : y
    const inFinder = finder && ((localX === 0 || localX === 6 || localY === 0 || localY === 6) || (localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4))
    seed = (Math.imul(seed, 1103515245) + 12345 + x * 7 + y) >>> 0
    const randomCell = !finder && ((seed >>> 16) & 1) === 1
    if (inFinder || randomCell) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)
  }
  return <svg className="qr-code" viewBox="-1 -1 23 23" role="img" aria-label="Decorative QR-style student ID code"><rect x="-1" y="-1" width="23" height="23" fill="white" rx="1" /><g fill="#1c2b2d">{cells}</g></svg>
}

function StudentId({ user, level }: { user: User; level: number }) {
  return <>
    <PageHeading eyebrow="YOUR PERSONAL LEARNER CARD" title="🪪 Student ID" description="Show off your progress and your place in the QuizVerse." />
    <Card className="id-card tilt"><div className="id-card-top"><span className="brand-logo">QUIZVERSE</span><span className="pill">STUDENT</span></div><div className="id-card-main"><Avatar user={user} size={104} /><div className="id-identity"><strong style={{ color: user.nameColor ? ['#1c2b2d', '#e04848', '#2b8bff', '#2bb673', '#b66dff', '#e8a900'][user.nameColor] : undefined }}>@{user.username}</strong><h2>{user.name}</h2><p>{user.school} · {user.className}</p><span className="pill">{user.id}</span></div>{makeQr(user.id)}</div><div className="id-card-stats"><span>⚡ {user.xp} XP</span><span>⭐ Level {level}</span><span>🪙 {user.coins} coins</span></div></Card>
  </>
}

function StudentCertificate({ data, onDownload }: { data: CertificateData; onDownload: () => void }) {
  const fields = [
    ['Student ID', data.studentId], ['Username', `@${data.username}`], ['Email', data.email],
    ['Mobile', data.mobile], ['School / College', data.school], ['Class', data.className],
    ['Roll number', data.roll], ['Gender', data.gender], ['Date of birth', data.dateOfBirth || '—'],
  ]
  const stats = [
    ['Quizzes played', data.quizzesPlayed.toLocaleString()],
    ['Total score', data.totalQuestions ? `${data.totalScore} / ${data.totalQuestions}` : String(data.totalScore)],
    ['Accuracy', `${data.accuracy}%`],
    ['Global rank', data.rank ? `#${data.rank}` : 'Unranked'],
    ['Coins', data.coins.toLocaleString()],
    ['XP', data.xp.toLocaleString()],
    ['Level', String(data.level)],
    ['Badges', String(data.badges.length)],
  ]

  return <>
    <PageHeading eyebrow="YOUR QUIZVERSE MILESTONE" title="📜 Achievement certificate" description="A personalized record of your profile, quiz activity, and rewards.">
      <button type="button" className="btn blue" onClick={onDownload}>⬇ Download certificate PDF</button>
    </PageHeading>
    <Card className="certificate-preview">
      <div className="certificate-frame">
        <div className="certificate-brand">✦ QUIZVERSE ✦<small>LEARN · PLAY · LEVEL UP</small></div>
        <h2>CERTIFICATE OF ACHIEVEMENT</h2>
        <p className="certificate-presented">This certificate is proudly presented to</p>
        <div className="certificate-student">
          {data.photo ? <img src={data.photo} alt="" /> : <span aria-hidden="true">🎓</span>}
          <div><strong>{data.name}</strong><small>@{data.username} · {data.school} · {data.className}</small></div>
        </div>
        <p className="certificate-description">For curiosity, effort, and progress in the QuizVerse learning community.</p>
        <h3>Student profile</h3>
        <dl className="certificate-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>
        <h3>Quiz &amp; reward record</h3>
        <dl className="certificate-stats">{stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <p className="certificate-extra"><b>Subjects:</b> {data.subjects.length ? data.subjects.join(', ') : 'No quizzes completed yet'}</p>
        <p className="certificate-extra"><b>Badges:</b> {data.badges.length ? data.badges.join(', ') : 'No badges earned yet'}</p>
        <div className="certificate-footer">
          <div className="certificate-signature"><img src={signatureImage} alt="Shaheem's signature" /><span>QuizVerse President</span></div>
          <div className="certificate-seal" aria-label="QuizVerse achievement seal"><span>✦</span><b>QUIZVERSE</b><small>ACHIEVEMENT</small></div>
          <span className="certificate-issued">Issued {data.issuedOn}</span>
        </div>
        <p className="certificate-disclaimer">QuizVerse demo achievement record · Not an academic or government credential</p>
      </div>
    </Card>
    <p className="certificate-privacy muted">Your PDF includes the profile details shown above. Only download or share it with people you trust.</p>
  </>
}

function StudentManagement({ users, allStudents, history, search, classFilter, onSearch, onClassFilter, onAddStudent, onAddAdmin, onRemoveAll, onExport, onAnnouncement, onCoins, onToggle, onResetPassword, onRemove, onProfile }: { users: User[]; allStudents: User[]; history: QuizRecord[]; search: string; classFilter: string; onSearch: (value: string) => void; onClassFilter: (value: string) => void; onAddStudent: () => void; onAddAdmin: () => void; onRemoveAll: () => void; onExport: () => void; onAnnouncement: () => void; onCoins: (username: string, amount: number) => void; onToggle: (user: User) => void; onResetPassword: (username: string) => void; onRemove: (username: string) => void; onProfile: (user: User) => void }) {
  const active = allStudents.filter((user) => user.enabled).length
  const coinTotal = allStudents.reduce((sum, user) => sum + user.coins, 0)
  return <>
    <PageHeading eyebrow="YOUR LEARNING COMMUNITY" title={<>👥 All students <span className="pill">{allStudents.length}</span></>} description="Manage your students, celebrate their progress, and keep the community thriving.">
      <button type="button" className="btn blue" onClick={onAddAdmin}>+ Add admin</button>
      <button type="button" className="btn green" onClick={onAddStudent}>+ Add student</button>
    </PageHeading>
    <div className="grid stats-grid student-summary"><Card className="stat-card"><span className="muted">Total students</span><strong>{allStudents.length}</strong></Card><Card className="stat-card"><span className="muted">Active students</span><strong>{active}</strong></Card><Card className="stat-card"><span className="muted">Quiz attempts</span><strong>{history.length}</strong></Card><Card className="stat-card"><span className="muted">Coins in circulation</span><strong>{coinTotal.toLocaleString()}</strong></Card></div>
    <Card className="table-card"><div className="table-heading"><div><h2>Student directory</h2><p className="muted">Search a name, username, ID, or email to find someone.</p></div><div className="table-tools"><button type="button" className="btn blue small" onClick={onExport}>Export CSV</button><button type="button" className="btn yellow small" onClick={onAnnouncement}>📢 Announce</button><button type="button" className="btn small" onClick={onRemoveAll}>🗑 Remove all students</button></div></div>
      <div className="table-filters"><input aria-label="Search students" placeholder="Search students…" value={search} onChange={(event) => onSearch(event.target.value)} /><select aria-label="Filter by class" value={classFilter} onChange={(event) => onClassFilter(event.target.value)}><option value="all">All classes</option>{[...new Set(allStudents.map((user) => user.className))].filter((value) => value !== '—').sort().map((value) => <option key={value}>{value}</option>)}</select></div>
      <div className="table-scroll"><table className="admin-student-table"><thead><tr><th>STUDENT</th><th>ID</th><th>COINS</th><th>XP / LEVEL</th><th>QUIZZES</th><th>SCORE / ACC.</th><th>LAST LOGIN</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{users.map((user) => {
        const records = history.filter((record) => record.username === user.username)
        const score = records.reduce((sum, record) => sum + record.score, 0)
        const total = records.reduce((sum, record) => sum + record.total, 0)
        return <tr key={user.id}><td><button className="table-user student-profile-button" type="button" onClick={() => onProfile(user)}><Avatar user={user} size={36} /><span><b>{user.name}</b><small>@{user.username}</small></span></button></td><td>{user.id}</td><td>🪙 {user.coins}</td><td>{user.xp} · {Math.floor(user.xp / XP_PER_LEVEL) + 1}</td><td>{records.length}</td><td>{score} · {total ? Math.round(score / total * 100) : 0}%</td><td>{formatDate(user.lastLogin)}</td><td><span className={`status-tag ${user.enabled ? 'active' : 'disabled'}`}>{user.enabled ? 'Active' : 'Disabled'}</span></td><td><div className="row-actions"><button title="Award 50 coins" onClick={() => onCoins(user.username, 50)}>+🪙</button><button title="Remove 50 coins" onClick={() => onCoins(user.username, -50)}>−🪙</button><button title={user.enabled ? 'Disable student' : 'Enable student'} onClick={() => onToggle(user)}>{user.enabled ? '⏸' : '▶️'}</button><button title="Reset password to pass123" onClick={() => onResetPassword(user.username)}>🔑</button><button title="Remove student" onClick={() => onRemove(user.username)}>🗑</button></div></td></tr>
      })}</tbody></table></div><p className="table-count">Showing {users.length} of {allStudents.length} students</p>
    </Card>
  </>
}

function QuestionBank({ questions, onAdd, onRemove }: { questions: Question[]; onAdd: (event: FormEvent<HTMLFormElement>) => void; onRemove: (id: string) => void }) {
  return <>
    <PageHeading eyebrow="BUILD YOUR NEXT CHALLENGE" title="❓ Question bank" description={`${questions.length} questions are ready to keep curious minds thinking.`} />
    <Card className="question-form-card"><h2>✏️ Write a question</h2><form className="question-form" onSubmit={onAdd}><label>Question<input name="prompt" required placeholder="Enter the question" /></label><label>Subject<input name="subject" placeholder="e.g. Science" /></label><label>Correct answer<input name="correct" required placeholder="The right answer" /></label><label>Incorrect answer 1<input name="wrong1" required placeholder="Another option" /></label><label>Incorrect answer 2<input name="wrong2" placeholder="Optional" /></label><label>Incorrect answer 3<input name="wrong3" placeholder="Optional" /></label><button className="btn green" type="submit">Add question</button></form></Card>
    <Card className="table-card question-list"><div className="table-scroll"><table><thead><tr><th>SUBJECT</th><th>QUESTION</th><th>CORRECT ANSWER</th><th /></tr></thead><tbody>{questions.map((question) => <tr key={question.id}><td><span className="pill">{question.subject}</span></td><td>{question.prompt}</td><td>{question.options[question.answer]}</td><td><button className="btn small" type="button" onClick={() => onRemove(question.id)} aria-label={`Remove ${question.prompt}`}>🗑</button></td></tr>)}</tbody></table></div></Card>
  </>
}

function StudentProfile({ user, records, onClose }: { user: User; records: QuizRecord[]; onClose: () => void }) {
  const score = records.reduce((sum, record) => sum + record.score, 0)
  const total = records.reduce((sum, record) => sum + record.total, 0)
  return <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="dialog-card card profile-dialog" role="dialog" aria-modal="true" aria-labelledby="student-profile-title"><button className="dialog-close" type="button" onClick={onClose} aria-label="Close">×</button><Avatar user={user} size={82} /><h2 id="student-profile-title">{user.name}</h2><p className="muted">@{user.username} · {user.id}</p><p>{user.email}</p><p>{user.school} · {user.className}</p><div className="grid stats-grid"><span>🪙 {user.coins}</span><span>⚡ {user.xp} XP</span><span>🎮 {records.length} quizzes</span><span>🎯 {total ? Math.round(score / total * 100) : 0}% accuracy</span></div><h3>Recent quiz activity</h3>{records.slice(-5).reverse().map((record) => <p className="list-line" key={record.date}><span>{record.subject}</span><b>{record.score}/{record.total}</b></p>)}</section></div>
}

function AppDialog({ kind, onClose, onSubmit }: { kind: 'student' | 'admin' | 'announcement' | 'remove-all'; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const isAccount = kind === 'student' || kind === 'admin'
  const title = kind === 'student' ? 'Add a student' : kind === 'admin' ? 'Add an admin' : kind === 'announcement' ? 'Send an announcement' : 'Remove all students?'
  return <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="dialog-card card" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button className="dialog-close" type="button" onClick={onClose} aria-label="Close">×</button><span className="eyebrow">{kind === 'admin' ? 'TEAM ACCESS' : kind === 'student' ? 'GROW YOUR COMMUNITY' : 'ADMIN TOOL'}</span><h2 id="dialog-title">{title}</h2>
    {kind === 'remove-all' ? <form onSubmit={onSubmit}><p className="muted">This removes student accounts and their quiz history. Admin and Quiz Master accounts will remain.</p><div className="dialog-actions"><button type="button" className="btn secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn">Remove all students</button></div></form>
      : <form onSubmit={onSubmit}>{isAccount ? <><label>Full name<input name="name" required placeholder="e.g. Taylor Morgan" /></label><label>Unique username<input name="username" required minLength={3} maxLength={24} placeholder="e.g. taylorm" /></label><label>Email address<input name="email" type="email" placeholder="name@example.com" /></label><label>Password<input name="password" type="password" required minLength={6} placeholder="At least 6 characters" /></label>{kind === 'student' && <><label>School / College<input name="school" placeholder="School or college" /></label><label>Class<input name="className" placeholder="e.g. Class 10A" /></label></>}</> : <label>Message to students<textarea name="message" rows={4} required placeholder="Write an announcement…" /></label>}<div className="dialog-actions"><button type="button" className="btn secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn green">{kind === 'announcement' ? 'Send announcement' : `Add ${kind}`}</button></div></form>}
  </section></div>
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return <div className="toast" role="status"><span>✦</span>{message}<button type="button" onClick={onDismiss} aria-label="Dismiss notification">×</button></div>
}

export default App
