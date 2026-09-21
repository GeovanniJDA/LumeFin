import { supabase } from './src/lib/supabase';

async function main() {
  const { data: cards, error } = await supabase.from('credit_cards').select('*');
  if (!cards) return;
  
  for (const card of cards) {
    const { data: purchases } = await supabase
      .from('card_purchases')
      .select('amount, type, installments')
      .eq('credit_card_id', card.id)
      .eq('reference_month', card.reference_month);
      
    if (purchases) {
      const total = purchases.reduce((sum, p) => {
        if (p.type === 'cash' || p.type === 'recurring') return sum + p.amount;
        return sum + (p.amount / p.installments);
      }, 0);
      
      await supabase
        .from('credit_cards')
        .update({ invoice_amount: Math.round(total * 100) / 100 })
        .eq('id', card.id);
      console.log(`Updated card ${card.name} to ${total}`);
    }
  }
}
main();
