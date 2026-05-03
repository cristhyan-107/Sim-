import { addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';

const today = new Date();
const currentMonthStart = startOfMonth(today);
const currentMonthEnd = endOfMonth(today);

export const MOCK_ACCOUNTS = [
  {
    id: 'acc_1',
    name: 'Nubank PF',
    bank: 'Nubank',
    scope: 'PF',
    role: 'Conta Corrente Pessoal',
    initial_balance: 1500.0,
    current_balance: 2350.5,
    status: 'active',
  },
  {
    id: 'acc_2',
    name: 'Inter PJ',
    bank: 'Banco Inter',
    scope: 'PJ',
    role: 'Conta Recebimento MEI',
    initial_balance: 5000.0,
    current_balance: 8450.0,
    status: 'active',
  },
  {
    id: 'acc_3',
    name: 'Itaú PF Backup',
    bank: 'Itaú',
    scope: 'PF',
    role: 'Reserva de Emergência',
    initial_balance: 10000.0,
    current_balance: 10050.0,
    status: 'active',
  },
];

export const MOCK_CARDS = [
  {
    id: 'card_1',
    nickname: 'Nubank Ultravioleta',
    bank: 'Nubank',
    account_id: 'acc_1',
    scope: 'PF',
    credit_limit: 8000.0,
    last_four_digits: '1234',
    closing_day: 25,
    due_day: 5,
    status: 'active',
  },
  {
    id: 'card_2',
    nickname: 'Inter Black PJ',
    bank: 'Banco Inter',
    account_id: 'acc_2',
    scope: 'PJ',
    credit_limit: 15000.0,
    last_four_digits: '9876',
    closing_day: 10,
    due_day: 20,
    status: 'active',
  },
];

export const MOCK_CATEGORIES = [
  // PF
  { id: 'cat_pf_1', name: 'Alimentação', scope: 'PF', type: 'expense' },
  { id: 'cat_pf_2', name: 'Moradia', scope: 'PF', type: 'expense' },
  { id: 'cat_pf_3', name: 'Lazer', scope: 'PF', type: 'expense' },
  { id: 'cat_pf_4', name: 'Salário/Receita', scope: 'PF', type: 'income' },
  // PJ
  { id: 'cat_pj_1', name: 'Receita de Serviços', scope: 'PJ', type: 'income' },
  { id: 'cat_pj_2', name: 'Tráfego Pago', scope: 'PJ', type: 'expense' },
  { id: 'cat_pj_3', name: 'Impostos/DAS', scope: 'PJ', type: 'expense' },
  { id: 'cat_pj_4', name: 'Retirada do Dono', scope: 'PJ', type: 'expense' },
];

export const MOCK_TRANSACTIONS = [
  {
    id: 'tx_1',
    date: subDays(today, 2).toISOString(),
    description: 'Cliente A - Desenvolvimento de Site',
    amount: 3500.0,
    type: 'income',
    category_id: 'cat_pj_1',
    account_id: 'acc_2',
    scope: 'PJ',
    payment_method: 'pix',
  },
  {
    id: 'tx_2',
    date: subDays(today, 5).toISOString(),
    description: 'Meta Ads',
    amount: 500.0,
    type: 'expense',
    category_id: 'cat_pj_2',
    account_id: 'acc_2',
    card_id: 'card_2',
    scope: 'PJ',
    payment_method: 'credit_card',
  },
  {
    id: 'tx_3',
    date: subDays(today, 10).toISOString(),
    description: 'Pró-labore',
    amount: 2000.0,
    type: 'owner_withdrawal',
    category_id: 'cat_pj_4',
    account_id: 'acc_2',
    destination_account_id: 'acc_1',
    scope: 'PJ',
    payment_method: 'transfer',
  },
  {
    id: 'tx_4',
    date: subDays(today, 1).toISOString(),
    description: 'Mercado Atacadão',
    amount: 650.0,
    type: 'expense',
    category_id: 'cat_pf_1',
    account_id: 'acc_1',
    card_id: 'card_1',
    scope: 'PF',
    payment_method: 'credit_card',
  },
  {
    id: 'tx_5',
    date: subDays(today, 15).toISOString(),
    description: 'DAS MEI',
    amount: 75.6,
    type: 'das_payment',
    category_id: 'cat_pj_3',
    account_id: 'acc_2',
    scope: 'PJ',
    payment_method: 'pix',
  },
];

export const MOCK_INSTALLMENTS = [
  {
    id: 'inst_1',
    description: 'MacBook Pro M3',
    total_amount: 12000.0,
    installments_count: 12,
    installment_amount: 1000.0,
    card_id: 'card_2',
    category_id: 'cat_pj_2',
    scope: 'PJ',
    purchase_date: subDays(today, 45).toISOString(),
    status: 'active',
    paid_installments: 2,
  },
];

export const MOCK_ALERTS = [
  { id: 1, type: 'warning', message: 'Fatura Nubank PF vence em 3 dias.', scope: 'PF' },
  { id: 2, type: 'destructive', message: 'DAS deste mês ainda não foi marcado como pago.', scope: 'PJ' },
  { id: 3, type: 'warning', message: 'Alimentação atingiu 86% do orçamento.', scope: 'PF' },
];

export const MOCK_SUMMARY = {
  pf: {
    total_balance: 12400.5,
    income_month: 2000.0,
    expense_month: 850.0,
    open_invoices: 1200.0,
  },
  pj: {
    total_balance: 8450.0,
    income_month: 3500.0,
    expense_month: 575.6,
    open_invoices: 3500.0,
    owner_withdrawals: 2000.0,
  },
};
