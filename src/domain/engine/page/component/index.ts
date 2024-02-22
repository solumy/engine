import type { Button, Props as ButtonProps } from './base/Button'
import type { HtmlProps } from './Html'
import type { Link, Props as LinkProps } from './base/Link'
import type { Paragraph, Props as ParagraphProps } from './base/Paragraph'
import type { Form, Props as FormProps } from './application/Form'
import type { ReactComponent } from './base/base'
import type { Cta, Props as CtaProps } from './marketing/Cta'
import type { Features, Props as FeaturesProps } from './marketing/Features'
import type { Footer, Props as FooterProps } from './marketing/Footer'
import type { Hero, Props as HeroProps } from './marketing/Hero'
import type { Logos, Props as LogosProps } from './marketing/Logos'
import type { NotFound, Props as NotFoundProps } from './marketing/NotFound'
import type { Header, Props as HeaderProps } from './marketing/Header'

export type Component =
  | Paragraph
  | Button
  | Cta
  | Features
  | Footer
  | Hero
  | Logos
  | NotFound
  | Form
  | Link
  | Header

export interface ReactComponents {
  Html: ReactComponent<HtmlProps>
  Paragraph: ReactComponent<ParagraphProps>
  Hero: ReactComponent<HeroProps>
  Logos: ReactComponent<LogosProps>
  Features: ReactComponent<FeaturesProps>
  Cta: ReactComponent<CtaProps>
  Button: ReactComponent<ButtonProps>
  Footer: ReactComponent<FooterProps>
  NotFound: ReactComponent<NotFoundProps>
  Form: ReactComponent<FormProps>
  Link: ReactComponent<LinkProps>
  Header: ReactComponent<HeaderProps>
}

export interface Props {
  Html: HtmlProps
  Paragraph: ParagraphProps
  Hero: HeroProps
  Logos: LogosProps
  Features: FeaturesProps
  Cta: CtaProps
  Button: ButtonProps
  Footer: FooterProps
  NotFound: NotFoundProps
  Form: FormProps
  Link: LinkProps
  Header: HeaderProps
}
