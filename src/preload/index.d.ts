import type { ElectronAPI } from '@electron-toolkit/preload'
import type { AppContent } from '../renderer/src/types/resources'

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

      content: {
        importVideo: () => Promise<string | null>
        load: () => Promise<AppContent | null>
        save: (content: AppContent) => Promise<void>
      }
    }
  }
}

export {}
