import React from 'react'
import { BaseComponentProps } from '../base/BaseComponentProps'
import { UIStyle } from '@entities/services/ui/UIStyle'

export interface ImageProps extends BaseComponentProps {
  path: string
  text: string
  width?: string
  height?: string
  style?: {
    image?: UIStyle
  }
}

export function ImageComponentUI({
  path,
  text,
  ui,
  width = '50',
  height = '100%',
  style = {},
}: ImageProps) {
  const { Image } = ui.getImage()
  return <Image src={path} alt={text} width={width} height={height} style={style.image} />
}

export interface ImageUIProps {
  src: string
  alt: string
  width: string
  height: string
  style?: UIStyle
}

export interface ImageUI {
  Image: React.FC<ImageUIProps>
}
