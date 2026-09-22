/**
 * Разбор `CHANGELOG.md` для «Что нового» (§6.5). Файл ведёт release-please, и пишет
 * он его для разработчика: у версии ссылка на сравнение, у пункта — на коммит и тикет.
 * Мастеру из этого нужен только текст, поэтому разбор выкидывает всё ссылочное.
 *
 * Формат release-please стабилен и узок — заголовок версии `##`, раздел `###`,
 * пункт `*`, — и на нём разбор и держится: markdown целиком здесь не нужен.
 *
 * Чистый TypeScript: Vue здесь нет.
 */

export interface ChangelogSection {
  title: string
  items: string[]
}

export interface ChangelogRelease {
  version: string
  /** Дата выпуска `YYYY-MM-DD`, как её пишет release-please. */
  date: string
  sections: ChangelogSection[]
}

/** `## [1.1.0](https://…/compare/v1.0.0...v1.1.0) (2026-09-24)` или `## 1.0.0 (2026-09-23)`. */
const RELEASE_HEADING = /^##\s+\[?(\d+\.\d+\.\d+[^\]\s]*)\]?(?:\([^)]*\))?\s+\((\d{4}-\d{2}-\d{2})\)/

/**
 * Текст пункта без того, что читает только разработчик: ссылки на коммит, номера тикета
 * и раздела спеки в скобках (раздел «Коммиты» в CLAUDE.md держит их в заголовке ради
 * трассировки), префикса scope. Оставшиеся ссылки теряют адрес, но не текст.
 */
export function cleanItem(raw: string): string {
  return raw
    .replace(/\s*\(\[[0-9a-f]{7,40}\]\([^)]*\)\)/g, '')
    .replace(/\s*\((?:\[#\d+\]\([^)]*\)|#\d+|тикет #\d+)(?:,\s*(?:\[#\d+\]\([^)]*\)|#\d+))*\)/g, '')
    .replace(/\s*\(§[^)]*\)/g, '')
    .replace(/^\*\*[^*]+:\*\*\s*/, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .trim()
}

/** Релизы в порядке файла — свежий первым. Строки вне релизов (шапка файла) пропускаются. */
export function parseChangelog(text: string): ChangelogRelease[] {
  const releases: ChangelogRelease[] = []
  let section: ChangelogSection | undefined

  for (const line of text.split('\n')) {
    const heading = RELEASE_HEADING.exec(line)
    if (heading) {
      releases.push({ version: heading[1], date: heading[2], sections: [] })
      section = undefined
      continue
    }
    const release = releases.at(-1)
    if (!release) continue

    if (line.startsWith('### ')) {
      section = { title: line.slice(4).trim(), items: [] }
      release.sections.push(section)
    } else if (section && /^[*-]\s/.test(line)) {
      const item = cleanItem(line.slice(2))
      if (item) section.items.push(item)
    }
  }

  return releases
}

const DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** `2026-09-23` → «23 сентября 2026». Без хвоста «г.»: в строке версии он лишний. */
export function formatReleaseDate(date: string): string {
  return DATE_FORMAT.format(new Date(`${date}T00:00:00Z`)).replace(/\s*г\.$/, '')
}
