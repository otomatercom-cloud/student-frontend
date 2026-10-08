export const inr = (n: number | undefined | null) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const PAY_MODES = [['cash', 'Cash'], ['upi', 'UPI / GPay / PhonePe'], ['neft', 'NEFT / IMPS'], ['cheque', 'Cheque'], ['dd', 'Demand Draft'], ['card', 'Card']];
export const PACKAGE_TYPES = ['lumpsum', 'installment', 'monthly', 'quarterly', 'semi_annual', 'annual'];
export const payTone = (s: string): 'green' | 'amber' | 'red' => (s === 'paid' ? 'green' : s === 'partial' ? 'amber' : 'red');
