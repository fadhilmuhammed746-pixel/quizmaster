import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import './App.css'

type Role = 'admin' | 'student'
type Page = 'Overview' | 'All students' | 'Quizzes' | 'Leaderboard' | 'Analytics' | 'Rewards' | 'Settings'
type Student = {
  id: string
  name: string
  username: string
  email: string
  className: string
  coins: number
  xp: number
  status: 'Active' | 'Disabled'
  color: string
  initials: string
}
type IconName =
  | 'home' | 'students' | 'book' | 'chart' | 'trophy' | 'settings' | 'bell' | 'search'
  | 'plus' | 'arrow' | 'clock' | 'sparkle' | 'calendar' | 'crown' | 'filter' | 'more'
  | 'close' | 'trash' | 'userplus' | 'target' | 'zap' | 'check' | 'moon' | 'sun'
  | 'shield' | 'medal' | 'chevron' | 'logout'

const iconShapes: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  students: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
  chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /><path d="M19 14V9h-5" /></>,
  trophy: <><path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 7H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.2 1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.2a7 7 0 0 1 0 1.8Z" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1 2.5 2 1-2 1-1 2.5-1-2.5-2-1 2-1 1-2.5Z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
  crown: <><path d="m2 8 5 4 5-8 5 8 5-4-2 12H4L2 8Z" /></>,
  filter: <><path d="M4 7h16M7 12h10m-7 5h4" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
  userplus: <><path d="M15 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6m-3-3h6" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  zap: <><path d="m13 2-3 8h7l-6 12 1-9H5l8-11Z" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  moon: <><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  medal: <><circle cx="12" cy="8" r="6" /><path d="m8.2 13.5-1.5 8L12 19l5.3 2.5-1.5-8" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {iconShapes[name]}
    </svg>
  )
}

function Character({ variant = 'violet', small = false }: { variant?: 'violet' | 'coral' | 'mint'; small?: boolean }) {
  return (
    <div className={`character character-${variant}${small ? ' character-small' : ''}`} role="img" aria-label="Friendly 3D-style quiz mascot">
      <span className="character-shadow" />
      <span className="character-body" />
      <span className="character-arm character-arm-left" />
      <span className="character-arm character-arm-right" />
      <span className="character-neck" />
      <span className="character-face">
        <i className="eye eye-left" /><i className="eye eye-right" />
        <b className="character-smile" />
      </span>
      <span className="character-hair" />
      <span className="character-cap"><i /></span>
    </div>
  )
}

const seedStudents: Student[] = [
  { id: 'QM-24081', name: 'Sofia Chen', username: 'sofia.chen', email: 'sofia.chen@email.com', className: 'Class 10A', coins: 1240, xp: 2840, status: 'Active', color: 'peach', initials: 'SC' },
  { id: 'QM-24082', name: 'Noah Williams', username: 'noahw', email: 'noah.w@email.com', className: 'Class 10B', coins: 980, xp: 2310, status: 'Active', color: 'blue', initials: 'NW' },
  { id: 'QM-24083', name: 'Ava Patel', username: 'avapatel', email: 'ava.p@email.com', className: 'Class 9A', coins: 860, xp: 1980, status: 'Active', color: 'green', initials: 'AP' },
  { id: 'QM-24084', name: 'Liam Johnson', username: 'liamj', email: 'liam.j@email.com', className: 'Class 10A', coins: 620, xp: 1420, status: 'Disabled', color: 'lavender', initials: 'LJ' },
  { id: 'QM-24085', name: 'Mia Garcia', username: 'miagarcia', email: 'mia.g@email.com', className: 'Class 9B', coins: 540, xp: 1190, status: 'Active', color: 'yellow', initials: 'MG' },
]

const pageIcons: Record<Page, IconName> = {
  Overview: 'home', 'All students': 'students', Quizzes: 'book', Leaderboard: 'trophy',
  Analytics: 'chart', Rewards: 'medal', Settings: 'settings',
}

const today = new Date()
const firstQuizDate = new Date(today)
firstQuizDate.setDate(today.getDate() + 3)
const secondQuizDate = new Date(today)
secondQuizDate.setDate(today.getDate() + 7)

function App() {
  const [role, setRole] = useState<Role>('admin')
  const [page, setPage] = useState<Page>('Overview')
  const [students, setStudents] = useState(seedStudents)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('All classes')
  const [dialog, setDialog] = useState<'student' | 'admin' | null>(null)
  const [notice, setNotice] = useState('')
  const [darkMode, setDarkMode] = useState(false)

  const visiblePages: Page[] = role === 'admin'
    ? ['Overview', 'All students', 'Quizzes', 'Leaderboard', 'Analytics', 'Settings']
    : ['Overview', 'Quizzes', 'Leaderboard', 'Rewards', 'Settings']

  const filteredStudents = useMemo(() => students.filter((student) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [student.name, student.username, student.id, student.email]
      .some((value) => value.toLowerCase().includes(query))
    return matchesSearch && (classFilter === 'All classes' || student.className === classFilter)
  }), [students, search, classFilter])

  function showNotice(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name')).trim()
    const username = String(data.get('username')).trim().replace(/^@/, '')
    const email = String(data.get('email')).trim()
    const className = String(data.get('className'))
    if (!/^[A-Za-z0-9._-]+$/.test(username)) {
      showNotice('Use only letters, numbers, dots, dashes, or underscores in the username.')
      return
    }
    if (students.some((student) => student.username.toLowerCase() === username.toLowerCase())) {
      showNotice(`@${username} is already in use. Choose a unique username.`)
      return
    }
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
    setStudents((current) => [...current, {
      id: `QM-${String(Math.max(24080, ...current.map((student) => Number(student.id.slice(3)))) + 1).padStart(5, '0')}`,
      name, username, email, className, coins: 0, xp: 0, status: 'Active',
      color: ['peach', 'blue', 'green', 'lavender', 'yellow'][current.length % 5], initials,
    }])
    setDialog(null)
    showNotice(`${name} was added to All students.`)
  }

  function addAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name')).trim()
    const username = String(data.get('username')).trim()
    setDialog(null)
    showNotice(`Admin invite prepared for ${name} (@${username}).`)
  }

  function removeStudent(student: Student) {
    if (!window.confirm(`Remove ${student.name} (@${student.username}) from this demo roster?`)) return
    setStudents((current) => current.filter((item) => item.id !== student.id))
    showNotice(`${student.name} was removed from All students.`)
  }

  function navigate(nextPage: Page) {
    setPage(nextPage)
    setSearch('')
    setClassFilter('All classes')
  }

  const isStudentsPage = page === 'All students' && role === 'admin'

  return (
    <div className={`app-shell${darkMode ? ' theme-dark' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon name="sparkle" size={20} /></div>
          <span>quiz<span className="brand-accent">ly</span></span>
          <span className="brand-dot">.</span>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {visiblePages.map((item) => (
            <button key={item} type="button" className={`nav-item${page === item ? ' active' : ''}`}
              onClick={() => navigate(item)}>
              <Icon name={pageIcons[item]} />
              <span>{item}</span>
              {item === 'All students' && <span className="nav-count">{students.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-promo">
          <div className="promo-orbit orbit-one" /><div className="promo-orbit orbit-two" />
          <Character variant="mint" small />
          <span className="promo-kicker">KEEP IT UP!</span>
          <strong>Every quiz makes<br />you a little brighter.</strong>
          <span className="promo-stars">✦ &nbsp;✦ &nbsp;✦</span>
        </div>

        <div className="role-switcher">
          <span className="workspace-label">DEMO VIEW</span>
          <div className="role-options" role="group" aria-label="Switch demo account role">
            <button type="button" className={role === 'student' ? 'selected' : ''} onClick={() => {
              setRole('student')
              if (page === 'All students' || page === 'Analytics') setPage('Overview')
            }}>
              <span className="role-avatar student-avatar">S</span> Student
            </button>
            <button type="button" className={role === 'admin' ? 'selected' : ''} onClick={() => setRole('admin')}>
              <Icon name="shield" size={15} /> Admin
            </button>
          </div>
          <div className="sidebar-user">
            <div className="profile-avatar avatar-peach">{role === 'admin' ? 'JD' : 'SC'}</div>
            <div className="sidebar-user-copy"><strong>{role === 'admin' ? 'Jordan Davis' : 'Sofia Chen'}</strong><span>{role === 'admin' ? 'Administrator' : '@sofia.chen'}</span></div>
            <button className="icon-button sidebar-more" type="button" aria-label="Account options"><Icon name="more" /></button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{page}</strong></div>
          <div className="topbar-actions">
            <button className="date-pill" type="button"><Icon name="calendar" size={16} /><span>Today, {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span><Icon name="chevron" size={14} /></button>
            <button className="icon-button theme-toggle" type="button" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setDarkMode((current) => !current)}><Icon name={darkMode ? 'sun' : 'moon'} /></button>
            <button className="icon-button notification-button" type="button" aria-label="Notifications" onClick={() => showNotice('You’re all caught up!')}>
              <Icon name="bell" /><i />
            </button>
            <div className="topbar-divider" />
            <button type="button" className="topbar-profile" aria-label={`Switch demo view to ${role === 'admin' ? 'student' : 'admin'}`}
              title={`Switch demo view to ${role === 'admin' ? 'student' : 'admin'}`}
              onClick={() => {
                setRole((current) => current === 'admin' ? 'student' : 'admin')
                if ((role === 'admin' && (page === 'All students' || page === 'Analytics')) ||
                  (role === 'student' && page === 'Rewards')) setPage('Overview')
              }}>
              <div className="profile-avatar avatar-peach">{role === 'admin' ? 'JD' : 'SC'}</div><Icon name="chevron" size={14} />
            </button>
          </div>
        </header>

        {isStudentsPage ? (
          <section className="page-body">
            <div className="page-heading students-heading">
              <div><span className="eyebrow">PEOPLE &amp; PROGRESS</span><h1>All students <span className="heading-count">{students.length}</span></h1>
                <p>Manage your students, track their progress, and keep your community thriving.</p></div>
              <div className="heading-actions">
                <button className="button button-secondary" type="button" onClick={() => setDialog('admin')}><Icon name="shield" size={17} /> Add admin</button>
                <button className="button button-primary" type="button" onClick={() => setDialog('student')}><Icon name="plus" size={18} /> Add student</button>
              </div>
            </div>

            <div className="student-summary-grid">
              <div className="summary-card"><div className="summary-icon summary-lilac"><Icon name="students" /></div><div><span>Total students</span><strong>{students.length.toLocaleString()}</strong></div><span className="summary-trend">↗ 12.8%</span></div>
              <div className="summary-card"><div className="summary-icon summary-mint"><Icon name="target" /></div><div><span>Active this week</span><strong>{students.filter((student) => student.status === 'Active').length}</strong></div><span className="summary-trend">↗ 8.2%</span></div>
              <div className="summary-card"><div className="summary-icon summary-peach"><Icon name="zap" /></div><div><span>Avg. XP earned</span><strong>{students.length ? Math.round(students.reduce((sum, student) => sum + student.xp, 0) / students.length).toLocaleString() : 0}</strong></div><span className="summary-caption">per student</span></div>
              <div className="summary-card"><div className="summary-icon summary-yellow"><Icon name="crown" /></div><div><span>Coins in circulation</span><strong>{students.reduce((sum, student) => sum + student.coins, 0).toLocaleString()}</strong></div><span className="summary-caption">total coins</span></div>
            </div>

            <div className="table-card">
              <div className="table-card-header"><div><h2>Student directory</h2><p>A complete list of everyone in your learning community.</p></div>
                <button type="button" className="button button-secondary export-button" onClick={() => showNotice('Export is available in the full platform.')}>Export <Icon name="chevron" size={14} /></button></div>
              <div className="table-toolbar">
                <label className="search-field"><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, username or ID..." aria-label="Search students" /></label>
                <label className="filter-field"><Icon name="filter" size={16} /><select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} aria-label="Filter by class">
                  <option>All classes</option>{Array.from(new Set(students.map((student) => student.className))).sort().map((className) => <option key={className}>{className}</option>)}
                </select></label>
              </div>
              <div className="table-scroll"><table className="students-table"><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>CLASS</th><th>COINS</th><th>XP</th><th>STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{filteredStudents.map((student) => <tr key={student.id}>
                  <td><div className="student-cell"><div className={`profile-avatar avatar-${student.color}`}>{student.initials}</div><div><strong>{student.name}</strong><span>@{student.username}</span></div></div></td>
                  <td className="student-id">{student.id}</td><td>{student.className}</td>
                  <td><span className="coin-value"><span>◈</span> {student.coins.toLocaleString()}</span></td>
                  <td><span className="xp-value">{student.xp.toLocaleString()} <span>XP</span></span></td>
                  <td><span className={`status-pill${student.status === 'Disabled' ? ' status-disabled' : ''}`}><i />{student.status}</span></td>
                  <td><button className="icon-button row-menu" type="button" aria-label={`Remove ${student.name}`} onClick={() => removeStudent(student)}><Icon name="trash" size={16} /></button></td>
                </tr>)}
                {filteredStudents.length === 0 && <tr><td className="empty-table" colSpan={7}>No students match your search. Try another name, username, ID, or class.</td></tr>}
                </tbody></table></div>
              <div className="table-footer"><span>Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students</span><div className="pagination"><button type="button" disabled aria-label="Previous page"><Icon name="chevron" size={15} /></button><button type="button" className="current-page">1</button><button type="button" disabled aria-label="Next page"><Icon name="chevron" size={15} /></button></div></div>
            </div>
          </section>
        ) : page === 'Overview' ? (
          <section className="page-body dashboard-body">
            <div className="welcome-row">
              <div><span className="eyebrow">{role === 'admin' ? 'YOUR LEARNING COMMUNITY' : today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</span><h1>{role === 'admin' ? 'Good morning, Jordan' : 'Hey Sofia, ready to shine?'} <span className="wave">✦</span></h1>
                <p>{role === 'admin' ? 'Here’s what’s happening with your students today.' : 'You’re doing amazing. Keep your learning streak alive!'}</p></div>
              <button type="button" className="button button-secondary dashboard-date" onClick={() => showNotice('Showing stats for the current week.')}><Icon name="calendar" size={16} /> This week <Icon name="chevron" size={14} /></button>
            </div>

            <div className="stats-grid">
              {(role === 'admin' ? [
                { label: 'Total students', value: students.length.toString(), change: '+12.8%', icon: 'students' as const, tone: 'lilac' },
                { label: 'Quizzes completed', value: '1,284', change: '+18.2%', icon: 'book' as const, tone: 'peach' },
                { label: 'Avg. score', value: '82.6%', change: '+4.6%', icon: 'target' as const, tone: 'mint' },
                { label: 'Coins awarded', value: '24,890', change: '+8.3%', icon: 'crown' as const, tone: 'yellow' },
              ] : [
                { label: 'My coins', value: '1,240', change: '+120 this week', icon: 'crown' as const, tone: 'yellow' },
                { label: 'Experience points', value: '2,840', change: '+320 this week', icon: 'zap' as const, tone: 'lilac' },
                { label: 'Quizzes completed', value: '28', change: '+4 this week', icon: 'book' as const, tone: 'peach' },
                { label: 'Average accuracy', value: '86.4%', change: '+3.2%', icon: 'target' as const, tone: 'mint' },
              ]).map((stat) => <div className="stat-card" key={stat.label}><div className={`stat-icon icon-${stat.tone}`}><Icon name={stat.icon} /></div>
                <div className="stat-label">{stat.label}</div><div className="stat-bottom"><strong>{stat.value}</strong><span className="stat-change">{stat.change}</span></div></div>)}
            </div>

            <div className="dashboard-grid">
              <section className="hero-card">
                <div className="hero-card-copy"><span className="hero-badge"><Icon name="sparkle" size={14} /> YOUR NEXT BIG WIN</span>
                  <h2>{role === 'admin' ? <>Big things happen<br />when we <em>learn together.</em></> : <>You’re one quiz away<br />from your <em>next level!</em></>}</h2>
                  <p>{role === 'admin' ? 'Your students have completed 128 quizzes this week. Keep the momentum going!' : 'Keep your streak going and collect a bonus 50 coins today.'}</p>
                  <button type="button" className="hero-cta" onClick={() => { navigate(role === 'admin' ? 'All students' : 'Quizzes') }}>{role === 'admin' ? 'View student progress' : 'Find a quiz'} <Icon name="arrow" size={17} /></button>
                  <span className="hero-decoration decor-star">✳</span><span className="hero-decoration decor-plus">＋</span>
                </div>
                <div className="hero-art"><div className="hero-art-halo" /><span className="float-star float-star-one">✦</span><span className="float-star float-star-two">✧</span><span className="float-orb" /><Character variant="violet" /></div>
              </section>

              <section className="streak-card">
                <div className="section-title"><div><h2>Daily streak</h2><p>Consistency is your superpower</p></div><span className="streak-flame">✦</span></div>
                <div className="streak-number"><strong>{role === 'admin' ? '7' : '12'}</strong><span>days<br />in a row</span></div>
                <div className="streak-days">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <div className={`streak-day${index < 4 ? ' complete' : index === 4 ? ' today' : ''}`} key={`${day}-${index}`}><span>{day}</span><i>{index < 4 ? <Icon name="check" size={12} /> : index === 4 ? '✦' : ''}</i></div>)}</div>
                <div className="streak-reward"><span>Next reward</span><strong><span>◈</span> +50 coins</strong></div>
              </section>

              <section className="activity-card">
                <div className="section-title"><div><h2>{role === 'admin' ? 'Learning activity' : 'Your activity'}</h2><p>{role === 'admin' ? 'Quiz completions this week' : 'Your quizzes this week'}</p></div><button className="text-button" type="button" onClick={() => navigate('Analytics')}>View report <Icon name="arrow" size={14} /></button></div>
                <div className="chart-legend"><span><i className="legend-purple" /> This week</span><span><i className="legend-gray" /> Last week</span></div>
                <div className="activity-chart" role="img" aria-label="Bar chart comparing quiz activity each day this week and last week">
                  <div className="chart-y-labels"><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div>
                  <div className="chart-plot"><div className="chart-gridlines"><i /><i /><i /><i /><i /></div><div className="bar-groups">{[['M', 42, 30], ['T', 65, 48], ['W', 48, 34], ['T', 78, 57], ['F', 60, 42], ['S', 35, 25], ['S', 22, 16]].map(([day, current, previous], index) =>
                    <div className="bar-group" key={`${day}-${index}`}><div className="bars"><i style={{ height: `${current}%` }} /><i style={{ height: `${previous}%` }} /></div><span>{day}</span></div>)}</div></div>
                </div>
              </section>

              <section className="leaderboard-card">
                <div className="section-title"><div><h2>Top learners</h2><p>{role === 'admin' ? 'Your community leaders' : 'Your school leaderboard'}</p></div><button className="text-button" type="button" onClick={() => navigate('Leaderboard')}>See all <Icon name="arrow" size={14} /></button></div>
                <div className="leader-list">{[
                  ['1', 'Ava Patel', '@avapatel', '2,840', 'avatar-green', '✦'],
                  ['2', 'You', '@sofia.chen', '2,460', 'avatar-peach', ''],
                  ['3', 'Noah Williams', '@noahw', '2,310', 'avatar-blue', ''],
                ].map(([rank, name, username, xp, color, badge]) => <div className={`leader-row${name === 'You' && role === 'student' ? ' leader-you' : ''}`} key={rank}>
                  <span className={`rank rank-${rank}`}>{rank}</span><div className={`profile-avatar ${color}`}>{name === 'Ava Patel' ? 'AP' : name === 'You' ? 'SC' : 'NW'}</div>
                  <div className="leader-copy"><strong>{name}{badge && <span className="leader-badge">{badge}</span>}</strong><span>{role === 'admin' ? username : (name === 'You' ? 'That’s you!' : username)}</span></div><strong className="leader-xp">{xp} <span>XP</span></strong>
                </div>)}</div>
                <div className="leader-footer"><span><Icon name="crown" size={15} /> Your rank</span><strong>#{role === 'admin' ? '1' : '2'} <span>↑ 3 spots this week</span></strong></div>
              </section>

              <section className="upcoming-card">
                <div className="section-title"><div><h2>Coming up</h2><p>Mark your calendar</p></div><button className="icon-button subtle-button" type="button" aria-label="See all upcoming events" onClick={() => navigate('Quizzes')}><Icon name="arrow" size={17} /></button></div>
                <div className="upcoming-event"><div className="event-date"><span>{firstQuizDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span><strong>{firstQuizDate.getDate()}</strong></div><div className="event-copy"><strong>Science Showdown</strong><span><Icon name="clock" size={13} /> 10:30 AM · 15 questions</span></div><span className="event-tag">QUIZ</span></div>
                <div className="upcoming-event"><div className="event-date event-date-mint"><span>{secondQuizDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span><strong>{secondQuizDate.getDate()}</strong></div><div className="event-copy"><strong>Math Masters Live</strong><span><Icon name="clock" size={13} /> 1:00 PM · 20 questions</span></div><span className="event-tag event-tag-mint">LIVE</span></div>
              </section>
            </div>
            <footer className="page-footer"><span>Made for curious minds</span><span>© {today.getFullYear()} Quizly <i>·</i> Learn. Play. Level up.</span></footer>
          </section>
        ) : (
          <section className="page-body placeholder-page">
            <span className="eyebrow">{role === 'admin' ? 'YOUR WORKSPACE' : 'YOUR LEARNING SPACE'}</span>
            <h1>{page}</h1>
            <p>{page === 'Quizzes' ? 'Your next adventure is waiting. Pick a quiz and start earning XP.' : page === 'Leaderboard' ? 'See how you stack up with your learning community.' : page === 'Rewards' ? 'Spend your hard-earned coins on a little something special.' : page === 'Analytics' ? 'A closer look at progress, participation, and learning goals.' : 'Your account, your preferences. Make yourself at home.'}</p>
            <div className="placeholder-card"><div className="placeholder-art"><Character variant="coral" /></div><div><span className="hero-badge"><Icon name="sparkle" size={14} /> COMING UP</span><h2>{page === 'Quizzes' ? 'Ready for a challenge?' : `More ${page.toLowerCase()} goodness is on its way.`}</h2><p>We’re putting the finishing touches on this space. Switch to Overview to explore your dashboard or try the other demo role.</p><button className="button button-primary" type="button" onClick={() => navigate('Overview')}>Back to overview <Icon name="arrow" size={16} /></button></div></div>
            <footer className="page-footer"><span>Made for curious minds</span><span>© {today.getFullYear()} Quizly <i>·</i> Learn. Play. Level up.</span></footer>
          </section>
        )}
      </main>

      {notice && <div className="toast" role="status"><span className="toast-check"><Icon name="check" size={15} /></span>{notice}<button type="button" className="toast-close" aria-label="Dismiss notification" onClick={() => setNotice('')}><Icon name="close" size={15} /></button></div>}

      {dialog && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null) }}>
        <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button type="button" className="icon-button modal-close" aria-label="Close dialog" onClick={() => setDialog(null)}><Icon name="close" /></button>
          <div className={`modal-icon ${dialog === 'student' ? 'summary-lilac' : 'summary-peach'}`}><Icon name={dialog === 'student' ? 'userplus' : 'shield'} size={21} /></div>
          <span className="eyebrow">{dialog === 'student' ? 'GROW YOUR COMMUNITY' : 'TEAM ACCESS'}</span>
          <h2 id="modal-title">{dialog === 'student' ? 'Add a student' : 'Add an admin'}</h2>
          <p className="modal-description">{dialog === 'student' ? 'Create a student profile and give them a place to start learning.' : 'Invite a trusted teammate to help manage your learning community.'}</p>
          <form onSubmit={dialog === 'student' ? addStudent : addAdmin}>
            <label>Full name<input name="name" required maxLength={70} placeholder="e.g. Taylor Morgan" /></label>
            <label>Username<input name="username" required minLength={3} maxLength={24} placeholder="e.g. taylorm" /><span className="field-hint">Letters, numbers, dots, dashes, and underscores.</span></label>
            <label>Email address<input name="email" type="email" required placeholder="name@example.com" /></label>
            {dialog === 'student' && <label>Class<select name="className" defaultValue="Class 10A"><option>Class 9A</option><option>Class 9B</option><option>Class 10A</option><option>Class 10B</option><option>Class 11A</option></select></label>}
            <div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setDialog(null)}>Cancel</button><button type="submit" className="button button-primary">{dialog === 'student' ? 'Add student' : 'Prepare invite'}</button></div>
          </form>
        </section>
      </div>}
    </div>
  )
}

export default App
