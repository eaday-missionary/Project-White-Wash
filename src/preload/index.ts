import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer

const api = {
  windowControls: {
    minimize: (): void => {
      ipcRenderer.send('window:minimize')
    },

    toggleMaximize: (): void => {
      ipcRenderer.send('window:toggle-maximize')
    },

    close: (): void => {
      ipcRenderer.send('window:close')
    },

    isMaximized: (): Promise<boolean> => {
      return ipcRenderer.invoke('window:is-maximized')
    },

    onMaximizeChange: (callback: (isMaximized: boolean) => void): (() => void) => {
      const listener = (_event: IpcRendererEvent, isMaximized: boolean): void => {
        callback(isMaximized)
      }

      ipcRenderer.on('window:maximized-change', listener)

      return (): void => {
        ipcRenderer.removeListener('window:maximized-change', listener)
      }
    }
  },
  content: {
    importVideo: (): Promise<string | null> => ipcRenderer.invoke('content:import-video'),
    load: (): Promise<unknown> => {
      return ipcRenderer.invoke('content:load')
    },

    save: (content: unknown): Promise<void> => {
      return ipcRenderer.invoke('content:save', content)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
