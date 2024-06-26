import type { Paragraph } from '../base/Paragraph'
import type { Title } from '../base/Title'
import type { Image } from '../base/Image'
import type { ReactComponent, Base, BaseProps } from '../base/base'
import type { Props as TitleProps } from '../base/Title'
import type { Props as ParagraphProps } from '../base/Paragraph'
import type { Props as ImageProps } from '../base/Image'
import type { ConfigError } from '@domain/entities/error/Config'

export interface Props extends BaseProps {
  Image?: React.FC<Partial<ImageProps>>
  Title: React.FC<Partial<TitleProps>>
  Paragraph: React.FC<Partial<ParagraphProps>>
  href?: string
}

interface Params extends BaseProps {
  href?: string
  image?: Image
  title: Title
  paragraph: Paragraph
  Component: ReactComponent<Props>
}

export class Card implements Base<Props> {
  constructor(private params: Params) {}

  init = async () => {
    const { title, paragraph, image } = this.params
    await Promise.all([title.init(), paragraph.init(), image?.init()])
  }

  render = async () => {
    const { Component, title, paragraph, image, id, className, href } = this.params
    const Title = await title.render()
    const Paragraph = await paragraph.render()
    const Image = await image?.render()
    return (props?: Partial<Props>) => (
      <Component {...{ id, className, Title, Paragraph, Image, href, ...props }} />
    )
  }

  validateConfig = () => {
    const { title, paragraph, image } = this.params
    const errors: ConfigError[] = []
    errors.push(...title.validateConfig())
    errors.push(...paragraph.validateConfig())
    if (image) errors.push(...image.validateConfig())
    return errors
  }
}
