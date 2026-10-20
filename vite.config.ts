import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Injects the AdSense verification script only when a publisher ID is
 * configured, and generates production files that must match the final
 * deployment URL (robots.txt, sitemap.xml, ads.txt).
 */
function publishingPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, '')
  const client = (env.VITE_ADSENSE_CLIENT ?? '').trim()

  return {
    name: 'uno-publishing',

    transformIndexHtml(html) {
      let output = html

      if (siteUrl) {
        output = output.replaceAll('__SITE_URL__', siteUrl)
      } else {
        output = output
          .replace(/\s*<link rel="canonical"[^>]*\/?>/g, '')
          .replace(/\s*<meta property="og:url"[^>]*\/?>/g, '')
          .replaceAll('__SITE_URL__', '')
      }

      const tags = []

      if (client) {
        tags.push(
          {
            tag: 'meta',
            attrs: { name: 'google-adsense-account', content: client },
            injectTo: 'head' as const,
          },
          {
            tag: 'script',
            attrs: {
              async: true,
              crossorigin: 'anonymous',
              src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`,
            },
            injectTo: 'head' as const,
          },
        )
      }

      return { html: output, tags }
    },

    closeBundle() {
      const outDir = resolve(process.cwd(), 'dist')
      mkdirSync(outDir, { recursive: true })

      const robots = ['User-agent: *', 'Allow: /', 'Disallow: /sw.js']
      if (siteUrl) {
        robots.push('', `Sitemap: ${siteUrl}/sitemap.xml`)
      }
      writeFileSync(resolve(outDir, 'robots.txt'), `${robots.join('\n')}\n`)

      if (siteUrl) {
        const today = new Date().toISOString().slice(0, 10)
        const sitemap = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          '  <url>',
          `    <loc>${siteUrl}/</loc>`,
          `    <lastmod>${today}</lastmod>`,
          '    <changefreq>weekly</changefreq>',
          '    <priority>1.0</priority>',
          '  </url>',
          '</urlset>',
          '',
        ].join('\n')
        writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap)
      }

      if (client) {
        const publisherId = client.replace(/^ca-/, '')
        writeFileSync(
          resolve(outDir, 'ads.txt'),
          `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`,
        )
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), publishingPlugin(mode)],
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
}))
