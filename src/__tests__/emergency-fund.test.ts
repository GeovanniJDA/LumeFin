import { describe, it, expect } from 'vitest';
import { calculateEmergencyFundSummary, getEmergencyFundMilestone } from '../lib/emergency-fund-calc';
import type { EmergencyFundContribution, EmergencyFundGoal } from '../types';

describe('emergency-fund-calc', () => {
  const mockGoal: EmergencyFundGoal = {
    id: 'goal-1',
    user_id: 'user-1',
    name: 'Reserva de Emergência',
    target_amount: 10000,
    target_date: '2026-12-31',
    notes: '6 meses de despesas',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('calculates summary with no goal and no contributions', () => {
    const summary = calculateEmergencyFundSummary(null, []);
    expect(summary.currentAmount).toBe(0);
    expect(summary.targetAmount).toBe(0);
    expect(summary.progressPercentage).toBe(0);
    expect(summary.remainingAmount).toBe(0);
    expect(summary.monthTotal).toBe(0);
    expect(summary.depositsCount).toBe(0);
    expect(summary.withdrawalsCount).toBe(0);
    expect(summary.averageDeposit).toBe(0);
  });

  it('calculates summary with goal and single deposit', () => {
    const contributions: EmergencyFundContribution[] = [
      {
        id: 'c-1',
        goal_id: 'goal-1',
        user_id: 'user-1',
        amount: 2500,
        type: 'deposit',
        contribution_date: '2026-10-04',
        notes: 'Aporte inicial',
        created_at: '2026-10-04T10:00:00Z',
      },
    ];

    const refDate = new Date('2026-10-04T12:00:00Z');
    const summary = calculateEmergencyFundSummary(mockGoal, contributions, refDate);

    expect(summary.currentAmount).toBe(2500);
    expect(summary.targetAmount).toBe(10000);
    expect(summary.progressPercentage).toBe(25);
    expect(summary.remainingAmount).toBe(7500);
    expect(summary.monthTotal).toBe(2500);
    expect(summary.depositsCount).toBe(1);
    expect(summary.withdrawalsCount).toBe(0);
    expect(summary.averageDeposit).toBe(2500);
  });

  it('calculates summary with multiple deposits and withdrawals', () => {
    const contributions: EmergencyFundContribution[] = [
      {
        id: 'c-1',
        goal_id: 'goal-1',
        user_id: 'user-1',
        amount: 1000,
        type: 'deposit',
        contribution_date: '2026-09-15',
        notes: 'Aporte setembro',
        created_at: '2026-09-15T10:00:00Z',
      },
      {
        id: 'c-2',
        goal_id: 'goal-1',
        user_id: 'user-1',
        amount: 500,
        type: 'deposit',
        contribution_date: '2026-10-01',
        notes: 'Aporte outubro 1',
        created_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 'c-3',
        goal_id: 'goal-1',
        user_id: 'user-1',
        amount: 200,
        type: 'deposit',
        contribution_date: '2026-10-03',
        notes: 'Aporte outubro 2',
        created_at: '2026-10-03T10:00:00Z',
      },
      {
        id: 'c-4',
        goal_id: 'goal-1',
        user_id: 'user-1',
        amount: 150,
        type: 'withdrawal',
        contribution_date: '2026-10-04',
        notes: 'Remédio urgente',
        created_at: '2026-10-04T10:00:00Z',
      },
    ];

    const refDate = new Date('2026-10-04T12:00:00Z');
    const summary = calculateEmergencyFundSummary(mockGoal, contributions, refDate);

    // Total deposits: 1000 + 500 + 200 = 1700
    // Total withdrawals: 150
    // Net: 1550
    expect(summary.currentAmount).toBe(1550);
    expect(summary.targetAmount).toBe(10000);
    expect(summary.progressPercentage).toBe(15.5);
    expect(summary.remainingAmount).toBe(8450);
    // Month total: (500 + 200) - 150 = 550
    expect(summary.monthTotal).toBe(550);
    expect(summary.depositsCount).toBe(3);
    expect(summary.withdrawalsCount).toBe(1);
    // Average deposit: 1700 / 3 = 566.67
    expect(summary.averageDeposit).toBe(566.67);
  });

  it('handles goal met or exceeded', () => {
    const contributions: EmergencyFundContribution[] = [
      {
        id: 'c-1',
        goal_id: 'goal-1',
        user_id: 'user-1',
        amount: 12000,
        type: 'deposit',
        contribution_date: '2026-10-01',
        notes: 'Super aporte',
        created_at: '2026-10-01T10:00:00Z',
      },
    ];

    const summary = calculateEmergencyFundSummary(mockGoal, contributions);
    expect(summary.currentAmount).toBe(12000);
    expect(summary.progressPercentage).toBe(120);
    expect(summary.remainingAmount).toBe(0);
  });

  it('handles withdrawals exceeding deposits safely without negative values', () => {
    const contributions: EmergencyFundContribution[] = [
      {
        id: 'c-1',
        goal_id: 'goal-1',
        user_id: 'user-1',
        amount: 300,
        type: 'withdrawal',
        contribution_date: '2026-10-01',
        notes: 'Saque sem saldo',
        created_at: '2026-10-01T10:00:00Z',
      },
    ];

    const summary = calculateEmergencyFundSummary(mockGoal, contributions);
    expect(summary.currentAmount).toBe(0);
    expect(summary.progressPercentage).toBe(0);
    expect(summary.remainingAmount).toBe(10000);
  });

  it('returns appropriate milestone information based on progress percentage', () => {
    expect(getEmergencyFundMilestone(10).title).toBe('Construindo seu colchão');
    expect(getEmergencyFundMilestone(30).title).toBe('Primeiro grande passo');
    expect(getEmergencyFundMilestone(55).title).toBe('Metade do caminho!');
    expect(getEmergencyFundMilestone(80).title).toBe('Reta final!');
    expect(getEmergencyFundMilestone(100).title).toBe('Meta alcançada! 🎉');
    expect(getEmergencyFundMilestone(120).title).toBe('Meta alcançada! 🎉');
  });
});
