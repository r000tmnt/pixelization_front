import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import { createMemoryHistory } from 'vue-router'
import { renderToString } from 'vue/server-renderer'
import { createHead } from '@unhead/vue/server'

const root = process.cwd()
const outputDirectory = resolve(root, 'dist')
const templatePath = resolve(outputDirectory, 'index.html')
const template = await readFile(templatePath, 'utf8')
const vite = await createServer({
  configFile: resolve(root, 'vite.config.ts'),
  mode: 'prerender',
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
})

try {
  const { createApplication } = await vite.ssrLoadModule('/src/appFactory.ts')
  const pages = [
    { route: '/', output: 'index.html' },
    { route: '/help.html', output: 'help.html' },
    { route: '/privacy.html', output: 'privacy.html' },
  ]

  for (const page of pages) {
    const head = createHead()
    const { app, router } = createApplication(createMemoryHistory(import.meta.env?.BASE_URL ?? '/'), head)
    await router.push(page.route)
    await router.isReady()

    const appHtml = await renderToString(app)
    const { htmlAttrs, headTags, bodyTags, bodyTagsOpen } = head.render()
    let html = template
      .replace(/<html\b[^>]*>/i, `<html ${htmlAttrs}>`)
      .replace(/<title>[\s\S]*?<\/title>/i, '')
      .replace(/<meta\s+name="description"[^>]*>/i, '')
      .replace(/<meta\s+property="og:(?:title|description|type)"[^>]*>/gi, '')
      .replace('</head>', `${headTags}\n  </head>`)
      .replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`)

    if (page.route !== '/') {
      html = html.replace(
        /\s*<script\b(?=[^>]*\bid="(?:google-adsense|google-analytics-loader|google-analytics-config)")[^>]*>[\s\S]*?<\/script>/gi,
        '',
      )
    }

    if (!html.includes(`<div id="app">${appHtml}</div>`)) {
      throw new Error(`Could not insert rendered app markup for ${page.route}`)
    }
    if (bodyTagsOpen) html = html.replace('<body>', `<body>${bodyTagsOpen}`)
    if (bodyTags) html = html.replace('</body>', `${bodyTags}</body>`)

    await writeFile(resolve(outputDirectory, page.output), html)
    console.info(`Prerendered ${page.route} -> dist/${page.output}`)
  }
} finally {
  await vite.close()
}
