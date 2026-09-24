import { computed } from 'vue'
import { useData } from 'vitepress'
import type { SidebarItem, SprocketThemeConfig } from '../types'

function normalize(path: string) {
  return path.replace(/^\//, '').replace(/(index)?\.(md|html)$/, '').replace(/\/$/, '')
}

function flatten(items: SidebarItem[]): SidebarItem[] {
  return items.flatMap((item) => [
    ...(item.link ? [item] : []),
    ...(item.items ? flatten(item.items) : []),
  ])
}

export function containsActive(item: SidebarItem, current: string): boolean {
  if (item.link && normalize(item.link) === current) return true
  return item.items?.some((child) => containsActive(child, current)) ?? false
}

export function useSidebar() {
  const { theme, page } = useData<SprocketThemeConfig>()

  const groups = computed(() => theme.value.sidebar ?? [])
  const flat = computed(() => flatten(groups.value))
  const current = computed(() => normalize(page.value.relativePath))

  const isActive = (link?: string) => !!link && normalize(link) === current.value
  const index = computed(() => flat.value.findIndex((item) => isActive(item.link)))
  const prev = computed(() => (index.value > 0 ? flat.value[index.value - 1] : undefined))
  const next = computed(() =>
    index.value >= 0 && index.value < flat.value.length - 1 ? flat.value[index.value + 1] : undefined,
  )
  // The top-level group that contains the current page, used as the page's section label.
  const section = computed(() => groups.value.find((group) => containsActive(group, current.value)))

  return { groups, flat, current, isActive, prev, next, section }
}
