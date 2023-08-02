import { LinkDto } from '@application/dtos/page/components/LinkDto'
import { Link } from '@domain/entities/page/components/Link'
import { IUIGateway } from '@domain/gateways/IUIGateway'

export function mapDtoToLink(linkDto: LinkDto, ui: IUIGateway): Link {
  return new Link(linkDto.path, linkDto.label, ui.LinkUI)
}

export function mapLinkToDto(link: Link): LinkDto {
  return {
    type: 'link',
    path: link.path,
    label: link.label,
  }
}