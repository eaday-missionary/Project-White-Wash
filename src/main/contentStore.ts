import { app, BrowserWindow, dialog, ipcMain, protocol, type IpcMainInvokeEvent } from 'electron'

import { access, copyFile, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'

import { basename, dirname, extname, join, resolve } from 'node:path'
const isVideoFilename = (value: string): boolean =>
  // eslint-disable-next-line no-control-regex -- Reject control characters in imported filenames.
  /^[^<>:"/\\|?*\x00-\x1f]+\.(mp4|webm|mov|m4v|ogv)$/i.test(value)
const isWebsite = (value: string): boolean => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app-video',
    privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true }
  }
])

function getVideoDirectory(): string {
  return app.isPackaged
    ? join(app.getPath('userData'), 'videos')
    : join(app.getAppPath(), 'src/renderer/public/videos')
}

function isList(value: unknown, validate: (item: string) => boolean): boolean {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.length <= 10 &&
      value.every((item) => typeof item === 'string' && validate(item)))
  )
}

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
        isObject(step) &&
        typeof step.title === 'string' &&
        typeof step.body === 'string' &&
        isList(step.videoFiles, isVideoFilename) &&
        isList(step.links, isWebsite)
    ) &&
    (value.videoFile === undefined ||
      (typeof value.videoFile === 'string' && isVideoFilename(value.videoFile)))
  )
}

function isSoftware(value: unknown): boolean {
  if (!isObject(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.category === 'string' &&
    typeof value.description === 'string' &&
    typeof value.url === 'string' &&
    isWebsite(value.url) &&
    isList(value.links, isWebsite)
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
  protocol.handle('app-video', async (request) => {
    const filename = decodeURIComponent(new URL(request.url).pathname.slice(1))
    if (basename(filename) !== filename || !isVideoFilename(filename))
      return new Response(null, { status: 400 })
    let filePath = join(getVideoDirectory(), filename)
    if (app.isPackaged) {
      try {
        await access(filePath)
      } catch {
        filePath = join(__dirname, '../renderer/videos', filename)
      }
    }
    try {
      const { size } = await stat(filePath)
      const headers = new Headers({
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
        'Content-Type':
          { '.webm': 'video/webm', '.mov': 'video/quicktime', '.ogv': 'video/ogg' }[
            extname(filename).toLowerCase()
          ] ?? 'video/mp4'
      })
      let start = 0
      let end = size - 1
      const range = request.headers.get('Range')
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range)
        if (match && (match[1] || match[2])) {
          start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]))
          end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1
        } else start = size
        if (start > end || start >= size) {
          headers.set('Content-Range', `bytes */${size}`)
          return new Response(null, { status: 416, headers })
        }
        headers.set('Content-Range', `bytes ${start}-${end}/${size}`)
      }
      headers.set('Content-Length', String(Math.max(0, end - start + 1)))
      const body =
        request.method === 'HEAD' || !size
          ? null
          : (Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream)
      return new Response(body, { status: range ? 206 : 200, headers })
    } catch {
      return new Response(null, { status: 404 })
    }
  })

  ipcMain.handle('content:import-video', async (event) => {
    checkSender(event)
    const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender)!, {
      properties: ['openFile'],
      filters: [{ name: 'Videos', extensions: ['mp4', 'webm', 'mov', 'm4v', 'ogv'] }]
    })
    if (result.canceled || !result.filePaths[0]) return null
    const source = result.filePaths[0]
    const filename = basename(source)
    if (!isVideoFilename(filename)) throw new Error('Choose a supported video file.')
    await mkdir(getVideoDirectory(), { recursive: true })
    const destination = join(getVideoDirectory(), filename)
    if (resolve(source).toLowerCase() !== resolve(destination).toLowerCase()) {
      await copyFile(source, destination)
    }
    return filename
  })

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
