import { type ReactNode } from 'react'

import { Button } from './button'
import { Card, CardContent } from './card'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" role="dialog" aria-modal="true">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
          {children}
        </CardContent>
      </Card>
    </div>
  )
}

export default Modal
