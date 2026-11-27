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
      const click = async (selector) => {
        if (
          selector === '.nav-button' &&
          (await evaluate(`document.querySelector('.sidebar').hidden`))
        ) {
          await evaluate(`document.querySelector('.sidebar-toggle').click()`)
          await waitFor(`!document.querySelector('.sidebar').hidden`)
        }
        return evaluate(
          `document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new MouseEvent('click', {bubbles:true}))`
        )
      }
      const key = async (name) => {
        win.webContents.sendInputEvent({ type: 'keyDown', keyCode: name })
        win.webContents.sendInputEvent({ type: 'keyUp', keyCode: name })
      }
      try {
        await win.loadURL(process.argv[2])
        await waitFor(`${paths}.length === 9`)
        assert.equal(await evaluate(`document.querySelector('.sidebar').hidden`), true)
        await click('.sidebar-toggle')
        await waitFor(`!document.querySelector('.sidebar').hidden`)
        await click('.nav-button:nth-child(2)')
        await waitFor(`document.querySelector('main h1')?.textContent === 'Transfer Planner'`)
        assert.equal(await evaluate(`document.querySelector('.sidebar').hidden`), false)
        assert.equal(
          await evaluate(`(() => {
            const toggle = document.querySelector('.sidebar-toggle');
            const home = document.querySelector('.sidebar-home');
            const rect = toggle.getBoundingClientRect();
            return home.getBoundingClientRect().left >= rect.right &&
              document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest('button') === toggle;
          })()`),
          true
        )
        await click('.sidebar-home')
        await waitFor(`${paths}.length === 9`)
        assert.equal(await evaluate(`document.querySelector('.sidebar').hidden`), false)
        await click('.sidebar-toggle')
        await waitFor(`document.querySelector('.sidebar').hidden`)
        assert.equal(await evaluate(`document.querySelector('.sidebar-home')`), null)
        const closedWidth = await evaluate(`document.querySelector('main').clientWidth`)
        await click('.sidebar-toggle')
        await waitFor(`document.querySelector('.sidebar-toggle').ariaExpanded === 'true'`)
        assert.ok(await evaluate(`document.querySelector('main').clientWidth < ${closedWidth}`))
        assert.equal(
          await evaluate(
            `document.querySelector('main').getBoundingClientRect().left >= document.querySelector('.sidebar').getBoundingClientRect().right`
          ),
          true
        )
        await evaluate(`document.querySelector('.sidebar-toggle').focus()`)
        await key('Escape')
        await waitFor(`document.querySelector('.sidebar').hidden`)
        await click('.sidebar-toggle')
        await click('.sidebar-toggle')
        await waitFor(`document.querySelector('.sidebar').hidden`)
        const dimensions = await evaluate(
          `({menu:document.querySelector('.radial-menu').getBoundingClientRect().toJSON(),main:document.querySelector('main').getBoundingClientRect().toJSON()})`
        )
        assert.equal(dimensions.menu.width, dimensions.main.width)
        assert.equal(dimensions.menu.height, dimensions.main.height)
        for (const [id, title] of [
          ['planner', 'Transfer Planner'],
          ['tutorials', 'Tutorial Library'],
          ['software', 'Useful Software'],
          ['playground', 'UI Playground'],
          ['tree-of-wisdom', 'Tree of Wisdom'],
          ['vault', 'The Vault'],
          ['tech-support', 'Tech Support'],
          ['media-repository', 'Media Repository'],
          ['secret-scrolls', 'Secret Scrolls']
        ]) {
          await click(`[data-item-id="${id}"]`)
          await waitFor(
            `document.querySelector('main h1')?.textContent === ${JSON.stringify(title)}`
          )
          await waitFor(`!!document.querySelector('.sidebar-home')`)
          if (
            [
              'tree-of-wisdom',
              'vault',
              'tech-support',
              'media-repository',
              'secret-scrolls'
            ].includes(id)
          ) {
            assert.equal(
              await evaluate(`document.querySelector('.placeholder-card h2')?.textContent`),
              'Coming Soon'
            )
            await click('.placeholder-card button')
            await waitFor(`${paths}.length === 9`)
            await click('.sidebar-toggle')
            await evaluate(
              `[...document.querySelectorAll('.nav-button')].find(button => button.textContent.endsWith(${JSON.stringify(title)})).click()`
            )
            await waitFor(
              `document.querySelector('main h1')?.textContent === ${JSON.stringify(title)}`
            )
            await click('.sidebar-toggle')
          }
          await click('.sidebar-home')
          await waitFor(`${paths}.length === 9`)
        }
        await evaluate(`${paths}[0].focus()`)
        await key('Right')
        await waitFor(`document.activeElement?.dataset.itemId === 'tutorials'`)
        await key('Return')
        await waitFor(`document.querySelector('main h1')?.textContent === 'Tutorial Library'`)
        await click('.nav-button')
        await waitFor(`${paths}.length === 9`)
        await click('.sidebar-toggle')
        await waitFor(`document.querySelector('.sidebar').hidden`)
        await new Promise((resolve) => setTimeout(resolve, 250))
        const originals = await evaluate(`Array.from(${paths}, p => p.getAttribute('d'))`)
        const point = await evaluate(
          `(() => { const r=document.querySelector('.radial-menu').getBoundingClientRect(); return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+30)} })()`
        )
        win.webContents.sendInputEvent({ type: 'mouseMove', ...point })
        await waitFor(`document.querySelector('.radial-menu').dataset.hoveredItemId === 'planner'`)
        await new Promise((resolve) => setTimeout(resolve, 160))
        assert.equal(await evaluate(`getComputedStyle(${paths}[0]).fill`), 'rgb(53, 53, 53)')
        assert.equal(await evaluate(`document.querySelectorAll('.radial-label-brush').length`), 1)
        assert.equal(
          await evaluate(`getComputedStyle(document.querySelector('.radial-label-brush')).opacity`),
          '0.1'
        )
        assert.equal(await evaluate(`getComputedStyle(${paths}[0]).stroke`), 'none')
        assert.equal(
          await evaluate(
            `Array.from(${paths}).every(path => getComputedStyle(path).stroke === 'none')`
          ),
          true
        )
        assert.deepEqual(
          await evaluate(`Array.from(${paths}, p => p.getAttribute('d'))`),
          originals
        )
        await waitFor(`document.querySelector('.radial-effects').dataset.ready === 'true'`)
        const brushState = await evaluate(`(() => {
          const canvas=document.querySelector('.radial-effects');
          const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
          let painted=0;
          for(let i=3;i<data.length;i+=4) if(data[i]>0) painted++;
          return {count:Number(canvas.dataset.brushCount),id:canvas.dataset.activeItemId,
            painted,pointerEvents:getComputedStyle(canvas).pointerEvents,url:canvas.toDataURL()};
        })()`)
        assert.ok([4, 5].includes(brushState.count))
        assert.equal(brushState.id, 'planner')
        assert.ok(
          Number(await evaluate(`document.querySelector('.radial-effects').dataset.strokeCount`)) >=
            25
        )
        assert.equal(brushState.pointerEvents, 'none')
        assert.ok(brushState.painted > 100)
        const layering = await evaluate(`(() => {
          const canvas=document.querySelector('.radial-effects');
          const svg=document.querySelector('.radial-background');
          const path=svg.querySelector('.radial-segment-path');
          const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
          const scale=canvas.width/svg.clientWidth;
          let bleed=false;
          for(let y=0;y<canvas.height&&!bleed;y+=4) for(let x=0;x<canvas.width;x+=4) {
            if(data[(y*canvas.width+x)*4+3]>0 && !path.isPointInFill(new DOMPoint(x/scale,y/scale))) { bleed=true;break; }
          }
          return {bleed,behind:Number(getComputedStyle(canvas).zIndex)<Number(getComputedStyle(svg).zIndex)};
        })()`)
        assert.equal(layering.bleed, true)
        assert.equal(layering.behind, true)
        const hiddenPixels = await evaluate(`(() => {
          const c=document.querySelector('.radial-effects'),ctx=c.getContext('2d');
          const p=new Path2D(${paths}[0].getAttribute('d'));
          const data=ctx.getImageData(0,0,c.width,c.height).data;
          const ratio=c.width/document.querySelector('.radial-background').clientWidth;
          let hidden=0;
          ctx.save();ctx.resetTransform();
          for(let y=0;y<c.height;y+=4) for(let x=0;x<c.width;x+=4) {
            if(!data[(y*c.width+x)*4+3]) continue;
            const px=x/ratio,py=y/ratio;
            if([[0,0],[-3,0],[3,0],[0,-3],[0,3]].every(([dx,dy])=>
              ctx.isPointInPath(p,px+dx,py+dy))) hidden++;
          }
          ctx.restore();return hidden;
        })()`)
        assert.equal(hiddenPixels, 0, 'brush textures must contain no hidden segment interior')

        await new Promise((resolve) => setTimeout(resolve, 100))
        assert.equal(
          await evaluate(`document.querySelector('.radial-effects').toDataURL()`),
          brushState.url
        )
        await require('node:fs/promises').writeFile(
          path.join(require('node:os').tmpdir(), 'white-wash-brush-hover.png'),
          (await win.webContents.capturePage()).toPNG()
        )
        // Switching segments must discard the previous texture before the next paint.
        const switched = await evaluate(`new Promise(resolve => {
          ${paths}[1].dispatchEvent(new PointerEvent('pointerover', {bubbles:true}));
          requestAnimationFrame(() => {
            const c=document.querySelector('.radial-effects');
            resolve({id:c.dataset.activeItemId,url:c.toDataURL()});
          });
        })`)
        assert.notEqual(switched.id, 'planner')
        assert.notEqual(switched.url, brushState.url)
        await evaluate(`document.activeElement?.blur()`)
        win.webContents.sendInputEvent({ type: 'mouseMove', x: 10, y: 20 })
        await waitFor(`!document.querySelector('.radial-effects').dataset.activeItemId`)
        const clear = await evaluate(
          `(() => {const c=document.querySelector('.radial-effects');return c.getContext('2d').getImageData(0,0,c.width,c.height).data.every(v=>v===0)})()`
        )
        assert.equal(clear, true)
        await waitFor(`document.querySelector('.radial-hub-effects')?.dataset.ready === 'true'`)
        assert.equal(
          await evaluate(`document.querySelector('.radial-hub-effects').dataset.strokeCount`),
          '14'
        )
        const hubSize = await evaluate(`(() => {
          const menu=document.querySelector('.radial-menu').getBoundingClientRect();
          return {actual:document.querySelector('.radial-hub').getBoundingClientRect().width,
            expected:Math.min(160, Math.min(menu.width,menu.height)*0.22)*2*0.7};
        })()`)
        assert.ok(Math.abs(hubSize.actual - hubSize.expected) < 1)
        await click('.dashboard-brush-toggle')
        await waitFor(`!document.querySelector('.radial-hub-effects')`)
        assert.equal(
          await evaluate(`document.querySelector('.dashboard-brush-toggle').ariaPressed`),
          'false'
        )
        win.webContents.sendInputEvent({ type: 'mouseMove', ...point })
        await waitFor(`document.querySelector('.radial-effects').dataset.ready === 'true'`)
        assert.equal(
          await evaluate(`document.querySelector('.radial-effects').dataset.activeItemId`),
          'planner'
        )
        await click('.dashboard-brush-toggle')
        await waitFor(`document.querySelector('.radial-hub-effects')?.dataset.ready === 'true'`)
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
          assert.equal(await evaluate(`${paths}.length`), 9)
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
