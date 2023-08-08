import React from 'react'
import { UI } from '@adapter/spi/ui/UI'

const NavigationUI: UI['NavigationUI'] = {
  container: ({ children }) => {
    return <div>{children}</div>
  },
  sidebar: ({ children }) => {
    return <nav>{children}</nav>
  },
  links: ({ children }) => {
    return <ul>{children}</ul>
  },
  link: ({ children }) => {
    return <li>{children}</li>
  },
  content: ({ children }) => {
    return <div>{children}</div>
  },
}

export default NavigationUI
