# Project White Wash

Project White Wash is a local desktop app for Tech Office training and resources, aimed at Windows 11. Built with Electron, React, and TypeScript, it brings office guides and software links into one workspace, with transfer planning planned for a future milestone.

## Current features

- **Dashboard and navigation:** A home page offers quick access to the planner, tutorials, and software. A persistent sidebar also opens the Content Editor and UI Playground.
- **Tutorial library:** Search tutorial titles, summaries, and categories; filter by category; and read expandable, numbered instructions with estimated completion times. Tutorials can play bundled MP4 training videos. Four starter guides cover office orientation, file organization, finding software, and missionary phone setup.
- **Software directory:** Search software names and descriptions, filter by category, and open resource websites in the default browser. Starter entries include Visual Studio Code, Git, and Node.js.
- **Content Editor:** Create, edit, and delete tutorials and software entries. Tutorial editing includes categories, summaries, durations, instruction steps, and an optional bundled-video filename. Forms provide validation, save feedback, cancellation, and deletion confirmation. Video files must already be bundled; the editor does not upload them.
- **Local storage:** Starts with bundled sample content and saves edited tutorials and software together in `white-wash-data/content.json` under Electron's per-user application-data directory. Saved content loads on later launches; load failures display an error without overwriting the saved file.
- **Custom desktop interface:** A draggable title bar provides minimize, maximize/restore, and close controls. The dark interface includes scrollable content and layouts that adapt to window width.
- **UI Playground:** An interactive demonstration of reusable buttons, text fields, dropdowns, cards, keyboard-accessible tabs, and modal dialogs.
- **Transfer Planner placeholder:** Displays a Coming Soon page with a return-to-dashboard button. Transfer entry, calculations, validation, and planner storage are not implemented yet.
