import React from 'react'
import { ButtonUI } from '@entities/app/page/component/button/ButtonComponentUI'

const ButtonUnstyledUI: ButtonUI = {
  Button: ({ children }) => {
    return <button>{children}</button>
  },
}

export default ButtonUnstyledUI
