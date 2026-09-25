import { createClient } from "@/lib/supabase/server";

export interface FinancialRow {
  user_id: string;
  username: string;
  net_balance_eur: number;
}

export async function getUserFinancials(): Promise<FinancialRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_financials")
    .select("*")
    .order("net_balance_eur", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FinancialRow[];
}
