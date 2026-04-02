import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import App from '../App.vue'

// process.cwd() is the frontend root when invoked via `npm --prefix todo-frontend run test:unit`
const frontendRoot = process.cwd()
const srcRoot = join(frontendRoot, 'src')

function listFilesRecursively(rootPath: string, extension: string): string[] {
  const entries = readdirSync(rootPath)
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(rootPath, entry)
    const stat = lstatSync(fullPath)
    if (stat.isSymbolicLink()) {
      continue
    }
    if (stat.isDirectory()) {
      files.push(...listFilesRecursively(fullPath, extension))
    } else if (fullPath.endsWith(extension)) {
      files.push(fullPath)
    }
  }

  return files
}

function isTestFile(filePath: string): boolean {
  return filePath.includes('/__tests__/') || filePath.endsWith('.spec.ts') || filePath.endsWith('.test.ts')
}

describe('Story 3.1 design foundation', () => {
  it('defines the required Tailwind design tokens', async () => {
    const configPath = join(frontendRoot, 'tailwind.config.js')
    expect(existsSync(configPath)).toBe(true)

    const module = await import(configPath)
    const colors = module.default?.theme?.extend?.colors
    const fonts = module.default?.theme?.extend?.fontFamily

    expect(colors?.brand?.emerald).toBe('#006C4A')
    expect(colors?.['primary-container']).toBe('#1E293B')
    expect(colors?.secondary).toBe('#006C4A')
    expect(colors?.surface).toBe('#F7F9FB')
    expect(colors?.['surface-low']).toBe('#F2F4F6')
    expect(colors?.['surface-lowest']).toBe('#FFFFFF')
    expect(colors?.['surface-highest']).toBeTypeOf('string')
    expect(colors?.['outline-variant']).toBeTypeOf('string')
    expect(fonts?.display).toEqual(['Plus Jakarta Sans', 'sans-serif'])
    expect(fonts?.body).toEqual(['Inter', 'sans-serif'])
  })

  it('loads Google Fonts before the Vite entry point', () => {
    const indexHtml = readFileSync(join(frontendRoot, 'index.html'), 'utf8')

    const preconnectGoogleApis = '<link rel="preconnect" href="https://fonts.googleapis.com">'
    const preconnectGoogleStatic = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    const stylesheetLink =
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap">'
    const scriptTag = '<script type="module" src="/src/main.ts"></script>'

    expect(indexHtml).toContain(preconnectGoogleApis)
    expect(indexHtml).toContain(preconnectGoogleStatic)
    expect(indexHtml).toContain(stylesheetLink)
    expect(indexHtml.indexOf(preconnectGoogleApis)).toBeLessThan(indexHtml.indexOf(scriptTag))
    expect(indexHtml.indexOf(preconnectGoogleStatic)).toBeLessThan(indexHtml.indexOf(scriptTag))
    expect(indexHtml.indexOf(stylesheetLink)).toBeLessThan(indexHtml.indexOf(scriptTag))
  })

  it('renders a centered shell with max width 640 and surface background', () => {
    const wrapper = mount(App)

    const rootClasses = wrapper.find('main').attributes('class') ?? ''
    const shellClasses = wrapper.find('section').attributes('class') ?? ''

    expect(rootClasses).toContain('bg-surface')
    expect(shellClasses).toContain('mx-auto')
    expect(shellClasses).toContain('max-w-[640px]')
  })

  it('does not use default Tailwind emerald scale classes', () => {
    const files = listFilesRecursively(srcRoot, '.vue').concat(
      listFilesRecursively(srcRoot, '.ts'),
    )
    const emeraldScalePattern = /\b(?:bg|text|border|ring|from|to|via)-emerald-(?:50|100|200|300|400|500|600|700|800|900|950)\b/

    for (const file of files) {
      if (isTestFile(file)) {
        continue
      }
      const content = readFileSync(file, 'utf8')
      expect(content).not.toMatch(emeraldScalePattern)
    }
  })

  it('does not use dynamic class interpolation in Vue or TypeScript files', () => {
    const files = listFilesRecursively(srcRoot, '.vue').concat(
      listFilesRecursively(srcRoot, '.ts'),
    )

    for (const file of files) {
      if (isTestFile(file)) {
        continue
      }
      const content = readFileSync(file, 'utf8')
      // Only flag template literals (backtick strings) that use interpolation
      expect(content).not.toMatch(/`[^`]*\$\{/)
    }
  })

  it('does not use 1px solid borders in frontend Vue files', () => {
    const vueFiles = listFilesRecursively(srcRoot, '.vue')
    for (const file of vueFiles) {
      const content = readFileSync(file, 'utf8')
      expect(content).not.toMatch(/border\s*:\s*1px\s+solid/i)
      expect(content).not.toMatch(/\bborder(?:-[trbxy])?\b(?!-)/)
    }
  })

  it('uses the canonical style entrypoint', () => {
    const mainTs = readFileSync(join(srcRoot, 'main.ts'), 'utf8')
    expect(mainTs).toContain("import './style.css'")
    expect(mainTs).not.toContain("import './assets/main.css'")

    const styleEntryPath = join(srcRoot, 'style.css')
    expect(existsSync(styleEntryPath)).toBe(true)
  })
})
