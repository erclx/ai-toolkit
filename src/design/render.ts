import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DesignDoc, Row } from '@/design/parse'
import { parseDesignDoc } from '@/design/parse'

export interface RenderResult {
  htmlPath: string
  cssPath: string
}

export function renderDesignDoc(
  sourcePath: string,
  outDir: string,
): RenderResult {
  const doc = parseDesignDoc(sourcePath)
  mkdirSync(outDir, { recursive: true })
  const cssPath = join(outDir, 'design.css')
  const htmlPath = join(outDir, 'index.html')
  writeFileSync(cssPath, buildCss(doc))
  writeFileSync(htmlPath, buildHtml(doc))
  return { htmlPath, cssPath }
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildCss(doc: DesignDoc): string {
  const lines: string[] = [':root {']
  for (const row of doc.color) {
    if (row['Value']) {
      lines.push(`  --color-${slug(row['Role'])}: ${row['Value']};`)
    }
  }
  for (const row of doc.spacing) {
    if (row['Value']) {
      lines.push(`  --space-${slug(row['Step'])}: ${row['Value']};`)
    }
  }
  for (const row of doc.typography) {
    if (row['Size']) {
      lines.push(`  --type-${slug(row['Role'])}-size: ${row['Size']};`)
    }
    if (row['Line height']) {
      lines.push(`  --type-${slug(row['Role'])}-lh: ${row['Line height']};`)
    }
  }
  for (const row of doc.borders) {
    if (row['Radius']) {
      lines.push(`  --radius-${slug(row['Role'])}: ${row['Radius']};`)
    }
  }
  lines.push('}')
  return lines.join('\n') + '\n'
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHtml(doc: DesignDoc): string {
  const sections = [
    sectionPersonality(doc.personality),
    sectionColor(doc.color),
    sectionTypography(doc.typography),
    sectionSpacing(doc.spacing),
    sectionBorders(doc.borders),
    sectionLine('Motion', doc.motion),
    sectionLine('Iconography', doc.iconography),
  ]
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Design tokens</title>
<link rel="stylesheet" href="design.css">
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; max-width: 960px; color: #222; }
  h1 { margin-top: 0; }
  h2 { margin-top: 2rem; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; }
  table { border-collapse: collapse; width: 100%; margin-top: 0.5rem; }
  th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; font-size: 14px; }
  th { background: #f7f7f7; font-weight: 600; }
  .swatch { display: inline-block; width: 1.5rem; height: 1.5rem; border-radius: 4px; border: 1px solid #ddd; vertical-align: middle; margin-right: 0.5rem; }
  .bar { display: inline-block; height: 1rem; background: #888; border-radius: 2px; vertical-align: middle; }
  .note { color: #666; font-size: 13px; margin-top: 0.5rem; }
  .empty { color: #999; font-style: italic; }
</style>
</head>
<body>
<h1>Design tokens</h1>
<p class="note">Generated from <code>.claude/DESIGN.md</code> by <code>aitk design render</code>. Token preview only, not a screen mock.</p>
${sections.join('\n')}
</body>
</html>
`
}

function sectionPersonality(text: string): string {
  if (!text) return ''
  return `<h2>Personality</h2>\n<p>${escape(text)}</p>`
}

function sectionColor(rows: Row[]): string {
  if (!rows.length) return ''
  const body = rows
    .map((r) => {
      const swatch = r['Value']
        ? `<span class="swatch" style="background:${escape(r['Value'])}"></span>`
        : '<span class="swatch"></span>'
      const value = r['Value'] || '<span class="empty">unset</span>'
      return `<tr><td>${swatch}${escape(r['Role'] ?? '')}</td><td>${escape(r['Intent'] ?? '')}</td><td><code>${value}</code></td></tr>`
    })
    .join('\n')
  return `<h2>Color</h2>\n<table><thead><tr><th>Role</th><th>Intent</th><th>Value</th></tr></thead><tbody>${body}</tbody></table>`
}

function sectionTypography(rows: Row[]): string {
  if (!rows.length) return ''
  const body = rows
    .map((r) => {
      const family = r['Family'] || 'system-ui'
      const weight = r['Weight'] || '400'
      const size = r['Size'] || '16px'
      const lh = r['Line height'] || '1.4'
      const sample = `<span style="font-family:${escape(family)};font-weight:${escape(weight)};font-size:${escape(size)};line-height:${escape(lh)}">The quick brown fox</span>`
      return `<tr><td>${escape(r['Role'] ?? '')}</td><td>${escape(family)}</td><td>${escape(weight)}</td><td>${escape(size)}</td><td>${escape(lh)}</td><td>${sample}</td></tr>`
    })
    .join('\n')
  return `<h2>Typography</h2>\n<table><thead><tr><th>Role</th><th>Family</th><th>Weight</th><th>Size</th><th>Line height</th><th>Sample</th></tr></thead><tbody>${body}</tbody></table>`
}

function sectionSpacing(rows: Row[]): string {
  if (!rows.length) return ''
  const body = rows
    .map((r) => {
      const value = r['Value'] || ''
      const bar = value
        ? `<span class="bar" style="width:${escape(value)}"></span>`
        : '<span class="empty">unset</span>'
      return `<tr><td>${escape(r['Step'] ?? '')}</td><td>${escape(r['Multiplier'] ?? '')}</td><td><code>${escape(value || 'unset')}</code></td><td>${bar}</td></tr>`
    })
    .join('\n')
  return `<h2>Spacing</h2>\n<table><thead><tr><th>Step</th><th>Multiplier</th><th>Value</th><th>Sample</th></tr></thead><tbody>${body}</tbody></table>`
}

function sectionBorders(rows: Row[]): string {
  if (!rows.length) return ''
  const body = rows
    .map((r) => {
      const radius = r['Radius'] || '0'
      const width = r['Width'] || '1px'
      const sample = `<span style="display:inline-block;width:2rem;height:1.5rem;background:#eee;border:${escape(width)} solid #888;border-radius:${escape(radius)};vertical-align:middle"></span>`
      return `<tr><td>${escape(r['Role'] ?? '')}</td><td><code>${escape(radius)}</code></td><td><code>${escape(width)}</code></td><td>${escape(r['When used'] ?? '')}</td><td>${sample}</td></tr>`
    })
    .join('\n')
  return `<h2>Borders</h2>\n<table><thead><tr><th>Role</th><th>Radius</th><th>Width</th><th>When used</th><th>Sample</th></tr></thead><tbody>${body}</tbody></table>`
}

function sectionLine(title: string, text: string): string {
  if (!text) return ''
  return `<h2>${title}</h2>\n<p>${escape(text)}</p>`
}
