import { type ReactNode } from 'react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

function Modal({ open, title, onClose, children }: ModalProps) {
  return (
    <Dialog open={open} modal={false} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export default Modal
