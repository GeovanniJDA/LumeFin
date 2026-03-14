import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BillCategory } from '../types';

export function useCategories() {
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('bill_categories').select('*').order('name');
    if (error) setError(error.message);
    else setCategories(data as BillCategory[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, loading, error, refetch: fetchCategories };
}
