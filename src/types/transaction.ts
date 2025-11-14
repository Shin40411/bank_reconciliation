export interface TransactionRow {
  date: string | Date | null;
  content: string;
  amount: string | number;
  type: string;
}
