import { useEffect, useMemo } from 'react';
import { useEmergencyFundStore } from '../store/emergency-fund-store';
import {
  calculateEmergencyFundSummary,
  getEmergencyFundMilestone,
} from '../lib/emergency-fund-calc';

export function useEmergencyFund(autoFetch = true) {
  const goal = useEmergencyFundStore((s) => s.goal);
  const contributions = useEmergencyFundStore((s) => s.contributions);
  const loading = useEmergencyFundStore((s) => s.loading);
  const error = useEmergencyFundStore((s) => s.error);
  const fetch = useEmergencyFundStore((s) => s.fetch);
  const saveGoal = useEmergencyFundStore((s) => s.saveGoal);
  const addContribution = useEmergencyFundStore((s) => s.addContribution);
  const updateContribution = useEmergencyFundStore((s) => s.updateContribution);
  const removeContribution = useEmergencyFundStore((s) => s.removeContribution);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [autoFetch, fetch]);

  const summary = useMemo(() => {
    return calculateEmergencyFundSummary(goal, contributions);
  }, [goal, contributions]);

  const milestone = useMemo(() => {
    return getEmergencyFundMilestone(summary.progressPercentage);
  }, [summary.progressPercentage]);

  return {
    goal,
    contributions,
    summary,
    milestone,
    loading,
    error,
    saveGoal,
    addContribution,
    updateContribution,
    removeContribution,
    refresh: fetch,
  };
}
