import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'

import { dirname, join } from 'node:path'

function getContentPath(): string {
  return join(app.getPath('userData'), 'white-wash-data', 'content.json')
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTutorial(value: unknown): boolean {
  if (!isObject(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.category === 'string' &&
    typeof value.summary === 'string' &&
    typeof value.estimatedMinutes === 'number' &&
    Number.isFinite(value.estimatedMinutes) &&
    Array.isArray(value.steps) &&
    value.steps.every(
      (step: unknown) =>
        isObject(step) && typeof step.title === 'string' && typeof step.body === 'string'
    ) &&
    (value.videoFile === undefined || typeof value.videoFile === 'string')
  )
}

function isSoftware(value: unknown): boolean {
  if (!isObject(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.category === 'string' &&
    typeof value.description === 'string' &&
    typeof value.url === 'string'
  )
}

function isValidContent(value: unknown): boolean {
  if (!isObject(value)) return false

  return (
    Array.isArray(value.tutorials) &&
    value.tutorials.every(isTutorial) &&
    Array.isArray(value.software) &&
    value.software.every(isSoftware)
  )
}

function checkSender(event: IpcMainInvokeEvent): void {
  const requestWindow = BrowserWindow.fromWebContents(event.sender)

  if (!requestWindow || event.senderFrame !== requestWindow.webContents.mainFrame) {
    throw new Error('Content access is not available here.')
  }
}

export function registerContentHandlers(): void {
  ipcMain.handle('content:load', async (event) => {
    checkSender(event)

    try {
      const fileText = await readFile(getContentPath(), 'utf8')

      const content: unknown = JSON.parse(fileText)

      if (!isValidContent(content)) {
        throw new Error('Saved content has an invalid format.')
      }

      return content
    } catch (error) {
      if (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return null
      }

      throw error
    }
  })

  ipcMain.handle('content:save', async (event, content: unknown): Promise<void> => {
    checkSender(event)

    if (!isValidContent(content)) {
      throw new Error('Cannot save invalid content.')
    }

    const filePath = getContentPath()
    const temporaryPath = `${filePath}.tmp`

    await mkdir(dirname(filePath), {
      recursive: true
    })

    await writeFile(temporaryPath, JSON.stringify(content, null, 2), 'utf8')

    await rename(temporaryPath, filePath)
  })
}