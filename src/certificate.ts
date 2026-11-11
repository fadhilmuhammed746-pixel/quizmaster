import signatureImage from './assets/elegant-shaheem-signature.png'

export type CertificateData = {
  name: string
  username: string
  studentId: string
  email: string
  mobile: string
  school: string
  className: string
  roll: string
  gender: string
  dateOfBirth: string
  photo: string
  quizzesPlayed: number
  totalScore: number
  totalQuestions: number
  accuracy: number
  coins: number
  xp: number
  level: number
  rank: number
  badges: string[]
  subjects: string[]
  issuedOn: string
}

const page = { width: 1684, height: 1190 }
const colors = { ink: '#1c2b2d', coral: '#ff6b6b', gold: '#d8a52a', muted: '#647274', paper: '#fffdf5', card: '#ffffff' }

export async function downloadCertificate(data: CertificateData): Promise<void> {
  const image = await renderCertificate(data)
  const pdf = createPdf(image, page.width, page.height)
  const url = URL.createObjectURL(pdf)
  const link = document.createElement('a')
  link.href = url
  link.download = `QuizVerse-Certificate-${safeFileName(data.username)}.pdf`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function renderCertificate(data: CertificateData): Promise<Uint8Array> {
  const canvas = document.createElement('canvas')
  canvas.width = page.width
  canvas.height = page.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser does not support certificate rendering.')

  context.fillStyle = colors.paper
  context.fillRect(0, 0, page.width, page.height)
  context.strokeStyle = colors.ink
  context.lineWidth = 5
  context.strokeRect(22, 22, page.width - 44, page.height - 44)
  context.strokeStyle = colors.gold
  context.lineWidth = 2
  context.strokeRect(39, 39, page.width - 78, page.height - 78)

  drawText(context, 'QUIZVERSE', page.width / 2, 94, 30, colors.coral, '800', 'center')
  drawText(context, 'LEARN  ·  PLAY  ·  LEVEL UP', page.width / 2, 123, 17, colors.muted, '600', 'center')
  context.fillStyle = colors.gold
  context.fillRect(300, 151, page.width - 600, 2)

  drawText(context, 'CERTIFICATE OF ACHIEVEMENT', page.width / 2, 205, 47, colors.ink, '800', 'center')
  drawText(context, 'This certificate is proudly presented to', page.width / 2, 253, 22, colors.muted, '500', 'center')

  const portrait = data.photo ? await loadPortrait(data.photo) : null
  if (portrait) drawPortrait(context, portrait)
  drawText(context, data.name, page.width / 2, 321, 46, colors.coral, '800', 'center')
  drawText(context, `@${data.username}  ·  ${data.school || 'School not provided'}  ·  ${data.className || 'Class not provided'}`, page.width / 2, 361, 20, colors.ink, '500', 'center')
  drawText(context, 'For curiosity, effort, and progress in the QuizVerse learning community.', page.width / 2, 398, 19, colors.muted, '500', 'center')

  drawText(context, 'STUDENT PROFILE', 128, 443, 17, colors.coral, '800', 'left')
  const profile = [
    ['Student ID', data.studentId], ['Username', `@${data.username}`], ['Email', data.email],
    ['Mobile', data.mobile], ['School / College', data.school], ['Class', data.className],
    ['Roll number', data.roll], ['Gender', data.gender], ['Date of birth', formatDate(data.dateOfBirth)],
  ]
  profile.forEach(([label, value], index) => {
    const column = index % 3
    const row = Math.floor(index / 3)
    const x = 128 + column * 486
    const y = 461 + row * 64
    drawInfoCard(context, x, y, 454, 54, label, value)
  })

  drawText(context, 'QUIZ & REWARD RECORD', 128, 675, 17, colors.coral, '800', 'left')
  const attempted = data.totalQuestions ? `${data.totalScore} / ${data.totalQuestions} points` : `${data.totalScore} points`
  const stats = [
    ['Quizzes played', data.quizzesPlayed.toLocaleString()],
    ['Total score', attempted],
    ['Accuracy', `${data.accuracy}%`],
    ['Global rank', data.rank ? `#${data.rank}` : 'Unranked'],
    ['Coins', data.coins.toLocaleString()],
    ['Experience points', `${data.xp.toLocaleString()} XP`],
    ['Level', `${data.level}`],
    ['Badges earned', `${data.badges.length}`],
  ]
  stats.forEach(([label, value], index) => {
    const column = index % 4
    const row = Math.floor(index / 4)
    const x = 128 + column * 366
    const y = 696 + row * 86
    drawInfoCard(context, x, y, 340, 72, label, value, true)
  })

  const subjects = data.subjects.length ? data.subjects.join(', ') : 'No quizzes completed yet'
  drawWrappedText(context, `Subjects played: ${subjects}`, 128, 891, 1110, 22, colors.ink, '500')
  const badges = data.badges.length ? data.badges.join(', ') : 'No badges earned yet'
  drawWrappedText(context, `Badges: ${badges}`, 128, 930, 1110, 22, colors.ink, '500')

  const signature = await loadSignature()
  drawSignature(context, signature)
  drawSeal(context)
  drawText(context, `Issued ${data.issuedOn}`, 128, 1096, 15, colors.muted, '500', 'left')
  drawText(context, 'QuizVerse demo achievement record · Not an academic or government credential', page.width / 2, 1137, 14, colors.muted, '500', 'center')

  const jpeg = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode the certificate PDF image.')), 'image/jpeg', 0.94)
  })
  return new Uint8Array(await jpeg.arrayBuffer())
}

function drawInfoCard(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, label: string, value: string, prominent = false) {
  context.fillStyle = colors.card
  context.strokeStyle = '#e2e4dc'
  context.lineWidth = 2
  context.fillRect(x, y, width, height)
  context.strokeRect(x, y, width, height)
  drawText(context, label.toUpperCase(), x + 17, y + 22, 12, colors.muted, '700', 'left')
  drawText(context, value || '—', x + 17, y + height - 14, prominent ? 20 : 16, colors.ink, prominent ? '700' : '500', 'left', width - 32)
}

function drawWrappedText(context: CanvasRenderingContext2D, value: string, x: number, y: number, maxWidth: number, lineHeight: number, color: string, weight: string) {
  context.font = `${weight} 17px Arial, sans-serif`
  context.fillStyle = color
  const words = value.split(/\s+/)
  let line = ''
  let lineIndex = 0
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (context.measureText(next).width > maxWidth && line) {
      context.fillText(line, x, y + lineIndex++ * lineHeight)
      line = word
    } else {
      line = next
    }
  }
  if (line) context.fillText(line, x, y + lineIndex * lineHeight)
}

function drawSignature(context: CanvasRenderingContext2D, image: HTMLImageElement) {
  context.save()
  context.globalCompositeOperation = 'multiply'
  context.drawImage(image, 128, 969, 270, 90)
  context.restore()
  drawText(context, 'QuizVerse President', 128, 1078, 14, colors.muted, '600', 'left')
}

function drawSeal(context: CanvasRenderingContext2D) {
  const x = 1462
  const y = 1013
  context.save()
  context.fillStyle = '#fff2c4'
  context.strokeStyle = colors.gold
  context.lineWidth = 5
  context.beginPath()
  context.arc(x, y, 78, 0, Math.PI * 2)
  context.fill()
  context.stroke()
  context.lineWidth = 2
  context.beginPath()
  context.arc(x, y, 66, 0, Math.PI * 2)
  context.stroke()
  drawStar(context, x, y - 11, 20, colors.gold)
  drawText(context, 'QUIZVERSE', x, y + 34, 15, colors.ink, '800', 'center')
  drawText(context, 'ACHIEVEMENT', x, y + 53, 9, colors.muted, '700', 'center')
  context.restore()
}

function drawStar(context: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  context.fillStyle = color
  context.beginPath()
  for (let point = 0; point < 10; point++) {
    const angle = -Math.PI / 2 + point * Math.PI / 5
    const distance = point % 2 === 0 ? radius : radius * 0.44
    const starX = x + Math.cos(angle) * distance
    const starY = y + Math.sin(angle) * distance
    if (point === 0) context.moveTo(starX, starY)
    else context.lineTo(starX, starY)
  }
  context.closePath()
  context.fill()
}

function drawPortrait(context: CanvasRenderingContext2D, image: HTMLImageElement) {
  context.save()
  context.beginPath()
  context.arc(250, 321, 34, 0, Math.PI * 2)
  context.clip()
  context.drawImage(image, 216, 287, 68, 68)
  context.restore()
  context.beginPath()
  context.arc(250, 321, 36, 0, Math.PI * 2)
  context.strokeStyle = colors.gold
  context.lineWidth = 3
  context.stroke()
}

function loadPortrait(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load the profile picture for this certificate.'))
    image.src = source
  })
}

function loadSignature(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load the signature for this certificate.'))
    image.src = signatureImage
  })
}

function drawText(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, weight: string, align: CanvasTextAlign, maxWidth?: number) {
  context.fillStyle = color
  context.font = `${weight} ${size}px Arial, sans-serif`
  context.textAlign = align
  context.fillText(text, x, y, maxWidth)
}

function formatDate(value: string): string {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

function safeFileName(value: string): string {
  return value.trim().replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'student'
}

function createPdf(image: Uint8Array, width: number, height: number): Blob {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  const offsets = [0]
  let length = 0
  const append = (chunk: Uint8Array) => {
    chunks.push(chunk)
    length += chunk.byteLength
  }
  const text = (value: string) => append(encoder.encode(value))
  const object = (id: number, body: string) => {
    offsets[id] = length
    text(`${id} 0 obj\n${body}\nendobj\n`)
  }

  text('%PDF-1.4\n%QuizVerse\n')
  object(1, '<< /Type /Catalog /Pages 2 0 R >>')
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  object(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>')
  offsets[4] = length
  text(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.byteLength} >>\nstream\n`)
  append(image)
  text('\nendstream\nendobj\n')
  const content = encoder.encode('q\n842 0 0 595 0 0 cm\n/Im0 Do\nQ\n')
  object(5, `<< /Length ${content.byteLength} >>\nstream\n${new TextDecoder().decode(content)}endstream`)
  const xrefOffset = length
  text(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`)
  for (let id = 1; id < offsets.length; id++) text(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`)
  text(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`)

  const output = new Uint8Array(length)
  let position = 0
  for (const chunk of chunks) {
    output.set(chunk, position)
    position += chunk.byteLength
  }
  return new Blob([output.buffer], { type: 'application/pdf' })
}
