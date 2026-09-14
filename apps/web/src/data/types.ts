export type Grade = 'g7' | 'g8' | 'g9' | 'g10' | 'g11' | 'g12'

export type Credibility = 'official' | 'student_summary' | 'submission' | 'unverified'

export type ExamSlot = {
  grade: Grade
  date: string
  period: string
  subject: string
  scope: string | null
}

export type WeeklyPeriod = '早自習' | '課堂'

export type WeeklyKind = 'quiz' | 'practice' | 'assembly' | 'activity'

export type WeeklySlot = {
  grade: Grade
  date: string
  period: WeeklyPeriod
  subject: string
  scope: string | null
  time: string | null
  classes: string | null
  collectPapers: boolean
  kind: WeeklyKind
}

export type WeeklyWeek = {
  semester: string
  week: number
  title: string
  audience: string
  startsOn: string
  endsOn: string
  slots: WeeklySlot[]
  notes: string[]
  sourceNote: string
}

export type ExamState = {
  semester: string
  name: string
  startsOn: string | null
  endsOn: string | null
  dateNote: string
  scheduleStatus: 'unpublished' | 'published'
  schedule: ExamSlot[]
  source: { name: string; url: string } | null
  updatedAt: string | null
}

export type WikiPage = {
  slug: string
  title: string
  category: string
  summary: string
  body: string[]
  sources: { title: string; url: string }[]
  lastVerified: string
}

export type LinkItem = {
  id: string
  title: string
  url: string
  category: string
  description: string
  requiresLogin: boolean
  onCampusOnly: boolean
}

export type Notice = {
  nid: number
  title: string
  summary: string | null
  publishedAt: string
  departments: string[]
  url: string
  studentRelevant: boolean
}
