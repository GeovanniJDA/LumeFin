import type { EmergencyFundContribution, EmergencyFundGoal, EmergencyFundSummary } from '../types';
import { format } from 'date-fns';

export function calculateEmergencyFundSummary(
  goal: EmergencyFundGoal | null,
  contributions: EmergencyFundContribution[],
  referenceDate: Date = new Date()
): EmergencyFundSummary {
  const currentMonth = format(referenceDate, 'yyyy-MM');

  let depositCents = 0;
  let withdrawalCents = 0;
  let monthDepositCents = 0;
  let monthWithdrawalCents = 0;
  let depositsCount = 0;
  let withdrawalsCount = 0;

  for (const item of contributions) {
    const cents = Math.round(item.amount * 100);
    const itemMonth = item.contribution_date.substring(0, 7);

    if (item.type === 'withdrawal') {
      withdrawalCents += cents;
      withdrawalsCount += 1;
      if (itemMonth === currentMonth) {
        monthWithdrawalCents += cents;
      }
    } else {
      depositCents += cents;
      depositsCount += 1;
      if (itemMonth === currentMonth) {
        monthDepositCents += cents;
      }
    }
  }

  const netCents = Math.max(0, depositCents - withdrawalCents);
  const currentAmount = netCents / 100;
  const targetAmount = goal?.target_amount ?? 0;

  let progressPercentage = 0;
  if (targetAmount > 0) {
    progressPercentage = Number(((currentAmount / targetAmount) * 100).toFixed(1));
  }

  const remainingCents = targetAmount > 0 ? Math.max(0, Math.round(targetAmount * 100) - netCents) : 0;
  const remainingAmount = remainingCents / 100;

  const monthTotalCents = monthDepositCents - monthWithdrawalCents;
  const monthTotal = monthTotalCents / 100;

  const averageDeposit = depositsCount > 0 ? (depositCents / depositsCount) / 100 : 0;

  return {
    currentAmount,
    targetAmount,
    progressPercentage,
    remainingAmount,
    monthTotal,
    depositsCount,
    withdrawalsCount,
    averageDeposit: Number(averageDeposit.toFixed(2)),
  };
}

export function getEmergencyFundMilestone(progressPercentage: number) {
  if (progressPercentage >= 100) {
    return {
      title: 'Meta alcançada! 🎉',
      description: 'Parabéns! Sua reserva de emergência está completa e protegendo você.',
      badgeVariant: 'default' as const,
      color: 'text-emerald-500',
    };
  }
  if (progressPercentage >= 75) {
    return {
      title: 'Reta final!',
      description: 'Você já passou de 75% da sua meta. Falta pouco para a segurança total.',
      badgeVariant: 'secondary' as const,
      color: 'text-amber-500',
    };
  }
  if (progressPercentage >= 50) {
    return {
      title: 'Metade do caminho!',
      description: '50% ou mais da sua reserva já está garantida. Mantenha o ritmo!',
      badgeVariant: 'secondary' as const,
      color: 'text-amber-500',
    };
  }
  if (progressPercentage >= 25) {
    return {
      title: 'Primeiro grande passo',
      description: 'Mais de 25% construído. Pequenas contribuições constantes fazem toda a diferença.',
      badgeVariant: 'outline' as const,
      color: 'text-primary',
    };
  }
  return {
    title: 'Construindo seu colchão',
    description: 'Defina o hábito de guardar mesmo pequenos valores. Cada real conta!',
    badgeVariant: 'outline' as const,
    color: 'text-muted-foreground',
  };
}
