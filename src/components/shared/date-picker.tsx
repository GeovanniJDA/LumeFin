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
          'border-white/10 bg-transparent',
          'hover:bg-white/5 hover:text-white',
          'transition-colors duration-150',
          'disabled:cursor-not-allowed disabled:opacity-50',
          value ? 'text-white/90' : 'text-white/40'
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-white/40" />
        <span className="flex-1 text-left font-normal">
          {value
            ? format(parseISO(value), 'dd/MM/yyyy', { locale: ptBR })
            : placeholder}
        </span>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          'w-auto p-0',
          'bg-zinc-900 border border-white/10',
          'shadow-2xl shadow-black/50 rounded-xl',
        )}
        align="start"
        sideOffset={6}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={ptBR}
          autoFocus
          classNames={{
            // react-day-picker v9 class keys
            month_caption: 'text-white font-medium',
            weekday: 'text-white/40',
            day: 'text-white/80 hover:bg-white/10 rounded-md',
            today: 'text-amber-400 font-bold bg-transparent',
            outside: 'text-white/20',
            disabled: 'text-white/20 opacity-50',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
