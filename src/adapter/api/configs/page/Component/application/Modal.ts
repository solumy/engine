import type { Component } from '..'
import type { Button } from '../base/Button'

export interface Modal {
  button: Button
  header?: Component[]
  body: Component[]
  footer?: Component[]
}

export interface ModalComponent extends Modal {
  component: 'Modal'
}

export interface ModalBlock extends ModalComponent {
  ref: string
}

export interface ModalBlockRef extends Partial<Modal> {
  component: 'Modal'
  blockRef: string
}
