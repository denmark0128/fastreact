import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '@/lib/utils'

type NativeLikeChangeEvent = {
  target: { value: string }
  currentTarget: { value: string }
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  onChange?: (event: NativeLikeChangeEvent) => void
}

interface OptionEntry {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

function extractOptions(children: React.ReactNode): OptionEntry[] {
  const result: OptionEntry[] = []

  const walk = (node: React.ReactNode) => {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) {
        return
      }

      if (child.type === React.Fragment) {
        const fragment = child as React.ReactElement<{ children?: React.ReactNode }>
        walk(fragment.props.children)
        return
      }

      if (typeof child.type === 'string' && child.type.toLowerCase() === 'option') {
        const option = child as React.ReactElement<{
          value?: string | number
          children?: React.ReactNode
          disabled?: boolean
        }>
        const value = String(option.props.value ?? '')
        result.push({
          value,
          label: option.props.children,
          disabled: Boolean(option.props.disabled),
        })
      }
    })
  }

  walk(children)
  return result
}

export function Select({ className, value, defaultValue, onChange, disabled, children, ...props }: SelectProps) {
  const options = React.useMemo(() => extractOptions(children), [children])
  const placeholderOption = options.find((option) => option.value === '')
  const selectedValue = value != null ? String(value) : undefined
  const selectedOption = options.find((option) => option.value === selectedValue)

  return (
    <SelectPrimitive.Root
      value={selectedValue}
      defaultValue={defaultValue != null ? String(defaultValue) : undefined}
      onValueChange={(nextValue) => {
        onChange?.({
          target: { value: nextValue },
          currentTarget: { value: nextValue },
        })
      }}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={cn(
          'flex h-10 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
          className,
        )}
        aria-label={props['aria-label']}
        name={props.name}
      >
        <SelectPrimitive.Value placeholder={placeholderOption?.label ?? 'Select'}>
          {selectedOption?.label}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
            <ChevronUp className="h-4 w-4" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] p-1">
            {options
              .filter((option) => option.value !== '')
              .map((option) => (
                <SelectPrimitive.Item
                  key={`${option.value}-${String(option.label)}`}
                  value={option.value}
                  disabled={option.disabled}
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-3 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
            <ChevronDown className="h-4 w-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
