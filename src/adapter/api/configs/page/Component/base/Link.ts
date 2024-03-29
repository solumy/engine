import type { Icon } from './Icon'

export interface Link {
  label: string
  href: string
  active?: boolean
  prefixIcon?: Icon
  suffixIcon?: Icon
}

export interface LinkComponent extends Link {
  component: 'Link'
}

export interface LinkBlock extends LinkComponent {
  ref: string
}

export interface LinkBlockRef extends Partial<Link> {
  component: 'Link'
  blockRef: string
}
