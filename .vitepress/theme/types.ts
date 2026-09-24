export interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
  docFooterText?: string
}

export interface NavItem {
  text: string
  link?: string
  items?: { text: string; link: string }[]
}

export interface SprocketThemeConfig {
  sprocketVersion: string
  nav: NavItem[]
  sidebar: SidebarItem[]
  socialLinks: { icon: 'github'; link: string }[]
  // `:path` is replaced with the page's source path.
  editLink: { pattern: string; text: string }
  search: { provider: 'local' }
}
