import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthPickerProps {
  value: string; // format: 'YYYY-MM'
  onChange: (value: string) => void;
  placeholder?: string;
}

const MONTHS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const currentYear = new Date().getFullYear();
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');

  const years = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));
  }, [currentYear]);

  const [yearStr, monthStr] = value?.split('-') ?? [];

  const handleMonthChange = (newMonth: string | null) => {
    if (!newMonth) return;
    const y = yearStr || String(currentYear);
    onChange(`${y}-${newMonth}`);
  };

  const handleYearChange = (newYear: string | null) => {
    if (!newYear) return;
    const m = monthStr || currentMonthStr;
    onChange(`${newYear}-${m}`);
  };

  const selectedMonthLabel = MONTHS.find((m) => m.value === monthStr)?.label;
  const selectedYearLabel = years.find((y) => y === yearStr);

  return (
    <div className="flex flex-row gap-2 w-full">
      <div className="flex-1">
        <Select value={monthStr || undefined} onValueChange={handleMonthChange}>
          <SelectTrigger>
            <SelectValue placeholder="Mês">
              {selectedMonthLabel || 'Mês'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Select value={yearStr || undefined} onValueChange={handleYearChange}>
          <SelectTrigger>
            <SelectValue placeholder="Ano">
              {selectedYearLabel || 'Ano'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
