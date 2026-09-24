import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string | null       // ISO string 'YYYY-MM-DD' or null
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Selecione uma data',
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const selectedDate = value ? parseISO(value) : undefined

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'))
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Base UI Popover uses render prop instead of asChild */}
      <PopoverTrigger
        render={<button type="button" />}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-md border px-3 py-1 text-sm',
          'border-border bg-background',
          'hover:bg-accent hover:text-accent-foreground',
          'transition-colors duration-150',
          'disabled:cursor-not-allowed disabled:opacity-50',
          value ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left font-normal">
          {value
            ? format(parseISO(value), 'dd/MM/yyyy', { locale: ptBR })
            : placeholder}
        </span>
      </PopoverTrigger>

      <PopoverContent
        className="z-[200] w-auto rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-lg"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={ptBR}
          autoFocus
          classNames={{
            months: 'flex flex-col space-y-4',
            month: 'space-y-4',
            caption: 'flex justify-center pt-1 relative items-center',
            caption_label: 'text-sm font-semibold text-foreground',
            nav: 'flex items-center gap-1',
            nav_button: cn(
              'h-8 w-8 bg-transparent p-0 rounded-lg transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-accent',
              'flex items-center justify-center border border-border'
            ),
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse',
            head_row: 'flex w-full',
            head_cell: cn(
              'text-muted-foreground rounded-md font-normal text-[0.75rem]',
              'w-9 h-9 flex items-center justify-center'
            ),
            row: 'flex w-full mt-1',
            cell: cn(
              'w-9 h-9 text-center text-sm p-0 relative',
              'focus-within:relative focus-within:z-20'
            ),
            day: cn(
              'w-9 h-9 p-0 font-normal rounded-lg transition-colors',
              'text-foreground hover:bg-accent hover:text-accent-foreground',
              'flex items-center justify-center'
            ),
            day_selected: cn(
              'bg-primary text-primary-foreground font-bold',
              'hover:bg-primary/90 hover:text-primary-foreground',
              'rounded-lg'
            ),
            day_today: 'text-primary font-bold',
            day_outside: 'text-muted-foreground opacity-50',
            day_disabled: 'text-muted-foreground opacity-50 cursor-not-allowed',
            day_range_middle: 'rounded-none',
            day_hidden: 'invisible',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
