/* eslint-disable @typescript-eslint/explicit-function-return-type -- This test entry point is JavaScript. */
/* eslint-disable @typescript-eslint/no-require-imports -- Node/Electron CommonJS test entry point. */
// Run after npm run build. A hidden Electron window exercises the real renderer.
const assert = require('node:assert/strict')
const path = require('node:path')

if (!process.versions.electron) {
  ;(async () => {
    const { createServer } = await import('vite')
    const { default: react } = await import('@vitejs/plugin-react')
    const server = await createServer({
      configFile: false,
      root: path.resolve('src/renderer'),
      plugins: [react()],
      server: { host: '127.0.0.1', port: 0 }
    })
    await server.listen()
    const { spawn } = require('node:child_process')
    const env = { ...process.env }
    delete env.ELECTRON_RUN_AS_NODE
    const child = spawn(require('electron'), [__filename, server.resolvedUrls.local[0]], {
      env,
      stdio: 'inherit'
    })
    child.on('exit', async (code) => {
      await server.close()
      process.exitCode = code ?? 1
    })
  })().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
} else {
  const { app, BrowserWindow, ipcMain } = require('electron')
  app
    .whenReady()
    .then(async () => {
      ipcMain.handle('content:load', () => null)
      ipcMain.handle('window:is-maximized', () => false)
      const win = new BrowserWindow({
        show: false,
        frame: false,
        width: 1200,
        height: 800,
        webPreferences: {
          preload: path.resolve('out/preload/index.js'),
          sandbox: false,
          offscreen: true
        }
      })
      const evaluate = (script) => win.webContents.executeJavaScript(script)
      const waitFor = async (script) => {
        for (let i = 0; i < 100; i++) {
          if (await evaluate(script)) return
          await new Promise((resolve) => setTimeout(resolve, 30))
        }
        throw new Error(`Timed out: ${script}`)
      }
      const paths = 'document.querySelectorAll(".radial-segment-path")'
      const click = async (selector) =>
        evaluate(
          `document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new MouseEvent('click', {bubbles:true}))`
        )
      const key = async (name) => {
        win.webContents.sendInputEvent({ type: 'keyDown', keyCode: name })
        win.webContents.sendInputEvent({ type: 'keyUp', keyCode: name })
      }
      try {
        await win.loadURL(process.argv[2])
        await waitFor(`${paths}.length === 3`)
        const dimensions = await evaluate(
          `({menu:document.querySelector('.radial-menu').getBoundingClientRect().toJSON(),main:document.querySelector('main').getBoundingClientRect().toJSON()})`
        )
        assert.equal(dimensions.menu.width, dimensions.main.width)
        assert.equal(dimensions.menu.height, dimensions.main.height)
        for (const [id, title] of [
          ['planner', 'Transfer Planner'],
          ['tutorials', 'Tutorial Library'],
          ['software', 'Useful Software']
        ]) {
          await click(`[data-item-id="${id}"]`)
          await waitFor(
            `document.querySelector('main h1')?.textContent === ${JSON.stringify(title)}`
          )
          await click('.nav-button')
          await waitFor(`${paths}.length === 3`)
        }
        await evaluate(`${paths}[0].focus()`)
        await key('Right')
        await waitFor(`document.activeElement?.dataset.itemId === 'tutorials'`)
        await key('Return')
        await waitFor(`document.querySelector('main h1')?.textContent === 'Tutorial Library'`)
        await click('.nav-button')
        await waitFor(`${paths}.length === 3`)
        await new Promise((resolve) => setTimeout(resolve, 250))
        const originals = await evaluate(`Array.from(${paths}, p => p.getAttribute('d'))`)
        const point = await evaluate(
          `(() => { const r=document.querySelector('.radial-menu').getBoundingClientRect(); return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+30)} })()`
        )
        win.webContents.sendInputEvent({ type: 'mouseMove', ...point })
        await waitFor(`document.querySelector('.radial-menu').dataset.hoveredItemId === 'planner'`)
        await new Promise((resolve) => setTimeout(resolve, 160))
        assert.equal(await evaluate(`getComputedStyle(${paths}[0]).fill`), 'rgb(53, 53, 53)')
        assert.deepEqual(
          await evaluate(`Array.from(${paths}, p => p.getAttribute('d'))`),
          originals
        )
        for (const [width, height] of [
          [900, 600],
          [1600, 600],
          [700, 1100],
          [1000, 1000]
        ]) {
          win.setContentSize(width, height)
          await new Promise((resolve) => setTimeout(resolve, 150))
          await waitFor(
            `document.querySelector('.radial-background').getAttribute('width') === String(document.querySelector('main').clientWidth)`
          )
          assert.equal(await evaluate(`${paths}.length`), 3)
        }
        win.setContentSize(1200, 800)
        await waitFor(
          `document.querySelector('.radial-background').getAttribute('width') === String(document.querySelector('main').clientWidth)`
        )
        await new Promise((resolve) => setTimeout(resolve, 250))
        await require('node:fs/promises').writeFile(
          path.join(require('node:os').tmpdir(), 'white-wash-radial.png'),
          (await win.webContents.capturePage()).toPNG()
        )
        await win.loadURL(process.argv[2] + '?radial-playground')
        await waitFor(`document.querySelector('.radial-playground') && ${paths}.length === 3`)
        const control = (text) =>
          evaluate(
            `Array.from(document.querySelectorAll('.radial-playground-controls button')).find(b=>b.textContent===${JSON.stringify(text)}).click()`
          )
        for (let count = 4; count <= 12; count++) {
          await control('Add')
          await waitFor(`${paths}.length === ${count}`)
        }
        await control('Reorder')
        await waitFor(`${paths}[0].dataset.itemId === '2'`)
        await click('.radial-playground-controls input')
        await waitFor(`${paths}[0].getAttribute('aria-disabled') === 'true'`)
        await evaluate(`${paths}[1].focus()`)
        await key('Home')
        assert.equal(await evaluate('document.activeElement.dataset.itemId'), '3')
        await evaluate(`document.querySelectorAll('.radial-playground-controls input')[1].click()`)
        await waitFor(`${paths}.length === 11`)
        await control('Reset')
        await waitFor(`${paths}.length === 3 && ${paths}[0].dataset.itemId === '1'`)
        await control('Add')
        await waitFor(`${paths}.length === 4`)
        await control('Remove')
        await waitFor(`${paths}.length === 3`)
        console.log(
          'Electron checks passed: navigation, keyboard, hover, resize, registration, reorder, disabled/hidden items, reset.'
        )
        win.destroy()
        app.exit(0)
      } catch (error) {
        console.error(error)
        win.destroy()
        app.exit(1)
      }
    })
    .catch((error) => {
      console.error(error)
      app.exit(1)
    })
}
