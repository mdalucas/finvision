import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Transaction, InstallmentPlan, TransactionType, MonthlyFilter } from '../models/transaction.model';
import { PersistenceService } from './persistence.service';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private readonly TRANSACTIONS_KEY = 'finvision_transactions';
  private readonly INSTALLMENTS_KEY = 'finvision_installments';

  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private installmentsSubject = new BehaviorSubject<InstallmentPlan[]>([]);

  public transactions$ = this.transactionsSubject.asObservable();
  public installments$ = this.installmentsSubject.asObservable();

  constructor(private persistenceService: PersistenceService) {
    this.loadData();
  }

  private loadData(): void {
    const transactions = this.persistenceService.get<Transaction[]>(this.TRANSACTIONS_KEY) || [];
    const installments = this.persistenceService.get<InstallmentPlan[]>(this.INSTALLMENTS_KEY) || [];
    
    this.transactionsSubject.next(transactions);
    this.installmentsSubject.next(installments);
  }

  private saveTransactions(): void {
    this.persistenceService.set(this.TRANSACTIONS_KEY, this.transactionsSubject.value);
  }

  private saveInstallments(): void {
    this.persistenceService.set(this.INSTALLMENTS_KEY, this.installmentsSubject.value);
  }

  private generateId(): string {
    return 'uuid-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  }

  // Transaction methods
  getTransactions(month?: number, year?: number): Observable<Transaction[]> {
    if (month !== undefined && year !== undefined) {
      const filtered = this.transactionsSubject.value.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() + 1 === month && 
               transactionDate.getFullYear() === year;
      });
      return new BehaviorSubject(filtered).asObservable();
    }
    return this.transactions$;
  }

  getTransactionsByMonth(month: number, year: number): Transaction[] {
    return this.transactionsSubject.value.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getMonth() + 1 === month && 
             transactionDate.getFullYear() === year;
    });
  }

  addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const currentTransactions = this.transactionsSubject.value;
    this.transactionsSubject.next([...currentTransactions, newTransaction]);
    this.saveTransactions();
    
    return newTransaction;
  }

  updateTransaction(updatedTransaction: Transaction): boolean {
    const currentTransactions = this.transactionsSubject.value;
    const index = currentTransactions.findIndex(t => t.id === updatedTransaction.id);
    
    if (index !== -1) {
      const updated = {
        ...updatedTransaction,
        updatedAt: new Date().toISOString()
      };
      currentTransactions[index] = updated;
      this.transactionsSubject.next([...currentTransactions]);
      this.saveTransactions();
      return true;
    }
    
    return false;
  }

  removeTransaction(id: string): boolean {
    const currentTransactions = this.transactionsSubject.value;
    const filtered = currentTransactions.filter(t => t.id !== id);
    
    if (filtered.length !== currentTransactions.length) {
      this.transactionsSubject.next(filtered);
      this.saveTransactions();
      return true;
    }
    
    return false;
  }

  // Installment methods
  getInstallments(): Observable<InstallmentPlan[]> {
    return this.installments$;
  }

  addInstallment(installment: Omit<InstallmentPlan, 'id' | 'createdAt'>): InstallmentPlan {
    const newInstallment: InstallmentPlan = {
      ...installment,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      installmentValue: installment.installmentValue || installment.totalValue / installment.count
    };

    const currentInstallments = this.installmentsSubject.value;
    this.installmentsSubject.next([...currentInstallments, newInstallment]);
    this.saveInstallments();
    
    return newInstallment;
  }

  removeInstallment(id: string): boolean {
    const currentInstallments = this.installmentsSubject.value;
    const filtered = currentInstallments.filter(i => i.id !== id);
    
    if (filtered.length !== currentInstallments.length) {
      this.installmentsSubject.next(filtered);
      this.saveInstallments();
      return true;
    }
    
    return false;
  }

  generateInstallmentRows(plan: InstallmentPlan): Array<{month: string, value: number, date: string}> {
    const rows: Array<{month: string, value: number, date: string}> = [];
    const startDate = new Date(plan.startDate);
    const installmentValue = plan.installmentValue || plan.totalValue / plan.count;

    for (let i = 0; i < plan.count; i++) {
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(startDate.getMonth() + i);
      
      rows.push({
        month: installmentDate.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }),
        value: installmentValue,
        date: installmentDate.toISOString().split('T')[0]
      });
    }

    return rows;
  }

  // Calculation methods
  calculateTotals(month: number, year: number): {totalIncomes: number, totalExpenses: number, cashFlow: number} {
    const transactions = this.getTransactionsByMonth(month, year)
      .filter(t => t.showOnDashboard);

    const totalIncomes = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.value, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.value, 0);

    const cashFlow = totalIncomes - totalExpenses;

    return { totalIncomes, totalExpenses, cashFlow };
  }

  // Utility methods
  getCurrentMonthFilter(): MonthlyFilter {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };
  }
}
