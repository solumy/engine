import type { ReactComponent, Base } from '../base/base'

export interface Props {
  title: string
  logos: {
    src: string
    alt: string
  }[]
}

interface Params {
  props: Props
  component: ReactComponent<Props>
}

export class Logos implements Base<Props> {
  constructor(private params: Params) {}

  render = () => <this.params.component {...this.params.props} />
}
