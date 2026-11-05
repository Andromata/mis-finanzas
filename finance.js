export const cents = value => Math.round(Number(value) * 100);
export function validateMovement(m, accounts) {
  if (!m.description?.trim() || !Number.isSafeInteger(m.amount) || m.amount <= 0) throw Error('Ingresá una descripción y un importe positivo.');
  if (!accounts.some(a => a.id === m.accountId)) throw Error('Seleccioná una cuenta válida.');
  if (!['income', 'expense'].includes(m.type)) throw Error('Tipo de movimiento inválido.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date) || Number.isNaN(Date.parse(m.date))) throw Error('Fecha inválida.');
  if (!Number.isInteger(m.installments) || m.installments < 1 || m.installments > 120) throw Error('Las cuotas deben estar entre 1 y 120.');
  if (!Number.isInteger(m.sharedPercent) || m.sharedPercent < 0 || m.sharedPercent > 100) throw Error('Porcentaje compartido inválido.');
  if (m.type === 'income' && (m.installments !== 1 || m.sharedPercent !== 0)) throw Error('Los ingresos no llevan cuotas ni deuda compartida.');
  if (m.sharedPercent && !m.person?.trim()) throw Error('Indicá quién te debe su parte.');
}
export function installment(m, month) {
  const [y, mo] = m.date.split('-').map(Number);
  const [ty, tm] = month.split('-').map(Number);
  const offset = (ty - y) * 12 + tm - mo;
  if (offset < 0 || offset >= m.installments) return 0;
  return Math.floor(m.amount / m.installments) + (offset < m.amount % m.installments ? 1 : 0);
}
export function summary(data, month) {
  let income = 0, expense = 0;
  for (const m of data.movements) {
    const amount = installment(m, month);
    if (m.type === 'income') income += amount;
    else expense += amount;
  }
  const debts = data.movements.filter(m => m.type === 'expense' && m.sharedPercent > 0).map(m => ({...m, owed: Math.round(m.amount * m.sharedPercent / 100)}));
  return {income, expense, net: income - expense, receivable: debts.filter(m => !m.settled).reduce((s,m) => s + m.owed, 0), debts};
}
export function candidates(m, movements) {
  return movements.filter(old => old.type === m.type && old.accountId === m.accountId && old.amount === m.amount && Math.abs(Date.parse(old.date) - Date.parse(m.date)) <= 3 * 86400000);
}
