/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-require-imports -- Electron integration test. */
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')

if (!process.versions.electron) {
  const temp = require('node:fs').mkdtempSync(path.join(os.tmpdir(), 'white-wash-content-test-'))
  const env = { ...process.env, WHITE_WASH_TEST_DATA: temp }
  delete env.ELECTRON_RUN_AS_NODE
  const child = require('node:child_process').spawn(require('electron'), [__filename], {
    env,
    stdio: 'inherit'
  })
  child.on('exit', async (code) => {
    if (path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep))
      await fs.rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
    process.exitCode = code ?? 1
  })
} else {
  const { app, BrowserWindow, dialog, ipcMain, net } = require('electron')
  app.on('window-all-closed', () => {})
  const temp = process.env.WHITE_WASH_TEST_DATA
  app.setPath('userData', temp)
  const Module = require('node:module')
  const ts = require('typescript')
  const root = path.resolve(__dirname, '..')
  const filename = path.join(root, 'src/main/contentStore.ts')
  const mod = new Module(filename, module)
  mod.filename = filename
  mod.paths = module.paths
  mod._compile(
    ts.transpileModule(require('node:fs').readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText,
    filename
  )
  app.getAppPath = () => temp
  let win
  app
    .whenReady()
    .then(async () => {
      const videoDirectory = path.join(temp, 'src/renderer/public/videos')
      const source = path.join(temp, 'test-video.mp4')
      const destination = path.join(videoDirectory, 'test-video.mp4')
      await fs.mkdir(videoDirectory, { recursive: true })
      await fs.copyFile(
        path.join(root, 'src/renderer/public/videos/How to Send Mass Text.mp4'),
        source
      )
      await fs.writeFile(destination, 'old video')
      mod.exports.registerContentHandlers()
      ipcMain.handle('window:is-maximized', () => false)
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [source]
      })
      win = new BrowserWindow({
        show: false,
        width: 1200,
        height: 800,
        webPreferences: {
          preload: path.join(root, 'out/preload/index.js'),
          sandbox: false,
          autoplayPolicy: 'no-user-gesture-required'
        }
      })
      const evaluate = async (script) => {
        try {
          return await win.webContents.executeJavaScript(script)
        } catch (error) {
          console.error('Failed renderer check:', script)
          throw error
        }
      }
      const waitFor = async (script) => {
        for (let i = 0; i < 200; i++) {
          if (await evaluate(script)) return
          await new Promise((resolve) => setTimeout(resolve, 30))
        }
        throw new Error(`Timed out: ${script}`)
      }
      const click = async (text, scope = 'main') => {
        await evaluate(
          `(() => { const button = [...document.querySelectorAll(${JSON.stringify(scope + ' button')})].find(b => b.textContent.trim().endsWith(${JSON.stringify(text)})); if (!button || button.disabled) throw new Error('Missing/enabled button: ' + ${JSON.stringify(text)}); button.click() })()`
        )
      }
      const field = async (label, value) => {
        await evaluate(
          `(() => { const label = [...document.querySelectorAll('.editor-form label')].find(l => l.textContent.trim() === ${JSON.stringify(label)}); const input = label.control || label.querySelector('textarea'); const proto = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })) })()`
        )
      }
      try {
        await win.loadFile(path.join(root, 'out/renderer/index.html'))
        await waitFor(`document.querySelectorAll('.radial-segment-path').length === 9`)
        await evaluate(
          `document.querySelector('[data-item-id="tutorials"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))`
        )
        await waitFor(`!!document.querySelector('.resource-add')`)
        await click('Add tutorial')
        assert.equal(
          await evaluate(`document.activeElement === document.querySelector('.editor-form input')`),
          true
        )
        assert.equal(
          await evaluate(
            `getComputedStyle(document.querySelector('.editor-new-video')).borderWidth`
          ),
          '0px'
        )
        await field('Title', 'Test tutorial')
        await field('Category', 'Test category')
        await field('Step title', 'Test step')
        await field('Instructions', 'Do the thing.')
        await click('New video', '.editor-form > fieldset > fieldset')
        await waitFor(`document.querySelector('.editor-form video')?.readyState >= 1`)
        await click('New video', '.editor-step')
        await waitFor(`document.querySelector('.editor-step video')?.readyState >= 1`)
        // Check range responses and playback after seeking, not just metadata availability.
        const response = await net.fetch('app-video://local/test-video.mp4', {
          headers: { Range: 'bytes=100-199' }
        })
        const range = {
          status: response.status,
          range: response.headers.get('Content-Range'),
          bytes: Array.from(new Uint8Array(await response.arrayBuffer()))
        }
        assert.equal(range.status, 206)
        assert.equal(range.range, 'bytes 100-199/2524543')
        assert.deepEqual(range.bytes, Array.from((await fs.readFile(source)).subarray(100, 200)))
        assert.equal(
          (
            await net.fetch('app-video://local/test-video.mp4', {
              headers: { Range: 'bytes=9999999-' }
            })
          ).status,
          416
        )
        await evaluate(
          `(() => { const video = document.querySelector('.editor-step video'); video.currentTime = Math.min(1, video.duration / 2); return video.play() })()`
        )
        await waitFor(
          `document.querySelector('.editor-step video').currentTime > 1.2 && !document.querySelector('.editor-step video').error`
        )
        await click('Add link', '.editor-step')
        await field('Website URL 1', 'https://example.com/step')
        await click('Save Tutorial')
        await waitFor(`!document.querySelector('.editor-form')`)
        let saved = await evaluate(`window.api.content.load()`)
        let tutorial = saved.tutorials.find((t) => t.title === 'Test tutorial')
        assert.equal(tutorial.steps[0].links.length, 1)
        assert.equal(tutorial.steps[0].videoFiles.length, 1)
        assert.equal(tutorial.videoFile, 'test-video.mp4')
        assert.equal(tutorial.steps[0].videoFiles[0], 'test-video.mp4')
        assert.deepEqual(await fs.readFile(destination), await fs.readFile(source))
        // Importing a file already in the destination directory is safe.
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [destination] })
        // Seed maximum attachments through the real persistence boundary, then check UI limits.
        tutorial.steps[0].links = Array(10).fill('https://example.com/step')
        tutorial.steps[0].videoFiles = Array(10).fill(tutorial.steps[0].videoFiles[0])
        await evaluate(`window.api.content.save(${JSON.stringify(saved)})`)
        const invalid = structuredClone(saved)
        invalid.tutorials
          .find((t) => t.id === tutorial.id)
          .steps[0].videoFiles.push(tutorial.videoFile)
        assert.equal(
          await evaluate(
            `window.api.content.save(${JSON.stringify(invalid)}).then(() => false, () => true)`
          ),
          true
        )
        win.webContents.reload()
        await waitFor(`document.querySelectorAll('.radial-segment-path').length === 9`)
        await evaluate(
          `document.querySelector('[data-item-id="tutorials"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))`
        )
        await waitFor(`!!document.querySelector('[role="tablist"]')`)
        await click('Test category')
        await click('Edit')
        assert.equal(
          await evaluate(`document.activeElement === document.querySelector('.editor-form input')`),
          true
        )
        assert.equal(await evaluate(`document.querySelectorAll('.editor-step video').length`), 10)
        assert.equal(
          await evaluate(
            `[...document.querySelectorAll('.editor-step button')].find(b => b.textContent === 'Add link').disabled`
          ),
          true
        )
        assert.equal(
          await evaluate(
            `[...document.querySelectorAll('.editor-step button')].some(b => b.textContent === 'New video')`
          ),
          false
        )
        await click('Swap video', '.editor-step')
        await waitFor(`!document.querySelector('.editor-form > fieldset').disabled`)
        await click('Delete video', '.editor-step')
        assert.equal(await evaluate(`document.querySelectorAll('.editor-step video').length`), 9)
        await click('New video', '.editor-step')
        await waitFor(`document.querySelectorAll('.editor-step video').length === 10`)
        await click('Save Tutorial')
        await waitFor(`!document.querySelector('.editor-form')`)
        await evaluate(`document.querySelector('.sidebar-toggle').click()`)
        await click('Software', '.nav-list')
        await waitFor(`document.querySelector('h1')?.textContent === 'Useful Software'`)
        await click('Add software')
        await field('Name', 'Test software')
        await field('Category', 'Test software category')
        await field('Website URL 1', 'https://example.com/one')
        for (let i = 2; i <= 10; i++) {
          await click('Add link', '.editor-form')
          await field(`Website URL ${i}`, `https://example.com/${i}`)
        }
        assert.equal(
          await evaluate(
            `[...document.querySelectorAll('.editor-form button')].find(b => b.textContent === 'Add link').disabled`
          ),
          true
        )
        await click('Save Software')
        await waitFor(`!document.querySelector('.editor-form')`)
        await click('Test software category')
        assert.equal(await evaluate(`document.querySelectorAll('.software-grid a').length`), 10)
        await click('Edit')
        await field('Name', 'Updated software')
        await click('Save Software')
        await waitFor(`!document.querySelector('.editor-form')`)
        saved = await evaluate(`window.api.content.load()`)
        assert.equal(saved.software.find((s) => s.name === 'Updated software').links.length, 10)
        await click('Edit')
        await click('Delete item')
        await click('Confirm delete')
        await waitFor(`!document.querySelector('.editor-form')`)
        saved = await evaluate(`window.api.content.load()`)
        assert.equal(
          saved.software.some((s) => s.name === 'Updated software'),
          false
        )
        console.log(
          'Content editor checks passed: inline add/edit/delete, category tabs, video copy/playback/swap/removal, attachment limits, validation, save and reload.'
        )
      } finally {
        win.destroy()
      }
    })
    .then(() => app.exit(0))
    .catch((error) => {
      console.error(error)
      app.exit(1)
    })
}
