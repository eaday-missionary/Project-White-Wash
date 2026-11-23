import type { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI

    api: {
      windowControls: {
        minimize: () => void
        toggleMaximize: () => void
        close: () => void

        isMaximized: () => Promise<boolean>

        onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void
      }
    }
  }
}

export {}
