import { render, screen } from '@testing-library/react'
import PageService from '../../src/services/page.service'

describe('render', () => {
  it('should return a page', () => {
    const Html = PageService.render({ div: { text: 'test' } })
    render(<Html />)
    const div = screen.getByText('test')
    expect(div).toBeInTheDocument()
  })

  it('should return a page with children', () => {
    const Html = PageService.render({ div: { components: { span: { text: 'test' } } } })
    render(<Html />)
    const span = screen.getByText('test')
    expect(span).toBeInTheDocument()
  })

  it('should return a page with props', () => {
    const Html = PageService.render({ button: { className: 'test' } })
    render(<Html />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('test')
  })

  it('should return a page with children and props', () => {
    const Html = PageService.render({
      button: { components: { span: { text: 'test' } }, className: 'test' },
    })
    render(<Html />)
    const span = screen.getByText('test')
    const button = screen.getByRole('button')
    expect(span).toBeInTheDocument()
    expect(button).toHaveClass('test')
  })

  it('should return a page with hero', () => {
    const Html = PageService.render({
      hero: {
        navigation: [
          { name: 'Home', href: '/' },
          { name: 'About', href: '/about' },
        ],
      },
    })
    render(<Html />)
    const images = screen.getAllByRole('img')
    expect(images[0]).toHaveAttribute('src')
    const links = screen.getAllByRole('link')
    expect(links[1]).toHaveAttribute('href', '/')
    expect(links[2]).toHaveAttribute('href', '/about')
  })
})