export type TutorialStep = {
  title: string
  body: string
  videoFiles?: string[]
  links?: string[]
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
  links?: string[]
}

export type AppContent = {
  tutorials: Tutorial[]
  software: SoftwareResource[]
}
