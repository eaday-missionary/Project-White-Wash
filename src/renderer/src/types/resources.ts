export type TutorialStep = {
  title: string
  body: string
}

export type Tutorial = {
  id: string
  title: string
  category: string
  summary: string
  estimatedMinutes: number
  steps: TutorialStep[]
  videoFile?: string
}

export type SoftwareResource = {
  id: string
  name: string
  category: string
  description: string
  url: string
}

export type AppContent = {
  tutorials: Tutorial[]
  software: SoftwareResource[]
}
