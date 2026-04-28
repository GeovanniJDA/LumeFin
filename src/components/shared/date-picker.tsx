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
        className="w-auto p-3 rounded-2xl z-[200]
          border border-white/10
          shadow-2xl shadow-black/60"
        style={{
          background: 'rgba(10, 10, 10, 0.98)',
          backdropFilter: 'blur(40px)',
        }}
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
            caption_label: 'text-sm font-semibold text-white',
            nav: 'flex items-center gap-1',
            nav_button: cn(
              'h-8 w-8 bg-transparent p-0 rounded-lg transition-colors',
              'text-white/60 hover:text-white hover:bg-white/10',
              'flex items-center justify-center border border-white/10'
            ),
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse',
            head_row: 'flex w-full',
            head_cell: cn(
              'text-white/40 rounded-md font-normal text-[0.75rem]',
              'w-9 h-9 flex items-center justify-center'
            ),
            row: 'flex w-full mt-1',
            cell: cn(
              'w-9 h-9 text-center text-sm p-0 relative',
              'focus-within:relative focus-within:z-20'
            ),
            day: cn(
              'w-9 h-9 p-0 font-normal rounded-lg transition-colors',
              'text-white/80 hover:bg-white/10 hover:text-white',
              'flex items-center justify-center'
            ),
            day_selected: cn(
              'bg-amber-500 text-black font-bold',
              'hover:bg-amber-600 hover:text-black',
              'rounded-lg'
            ),
            day_today: 'text-amber-400 font-bold',
            day_outside: 'text-white/20 opacity-50',
            day_disabled: 'text-white/20 opacity-30 cursor-not-allowed',
            day_range_middle: 'rounded-none',
            day_hidden: 'invisible',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
