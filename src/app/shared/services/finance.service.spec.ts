import { TestBed } from '@angular/core/testing';
import { FinanceService } from './finance.service';
import { PersistenceService } from './persistence.service';
import { Transaction, InstallmentPlan, TransactionType } from '../models/transaction.model';

describe('FinanceService', () => {
  let service: FinanceService;
  let persistenceService: jasmine.SpyObj<PersistenceService>;

  const mockTransaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
    title: 'Test Transaction',
    value: 100,
    date: '2025-01-15',
    category: 'Test',
    type: 'income' as TransactionType,
    showOnDashboard: true
  };

  const mockInstallment: Omit<InstallmentPlan, 'id' | 'createdAt'> = {
    title: 'Test Installment',
    totalValue: 1200,
    count: 12,
    startDate: '2025-01-01',
    category: 'Test',
    showOnDashboard: false
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('PersistenceService', ['get', 'set']);

    TestBed.configureTestingModule({
      providers: [
        FinanceService,
        { provide: PersistenceService, useValue: spy }
      ]
    });

    service = TestBed.inject(FinanceService);
    persistenceService = TestBed.inject(PersistenceService) as jasmine.SpyObj<PersistenceService>;
    
    // Mock inicial - localStorage vazio
    persistenceService.get.and.returnValue([]);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Transaction management', () => {
    it('should add a transaction', () => {
      const addedTransaction = service.addTransaction(mockTransaction);
      
      expect(addedTransaction).toBeTruthy();
      expect(addedTransaction.id).toBeTruthy();
      expect(addedTransaction.title).toBe(mockTransaction.title);
      expect(addedTransaction.value).toBe(mockTransaction.value);
      expect(addedTransaction.createdAt).toBeTruthy();
      expect(addedTransaction.updatedAt).toBeTruthy();
      expect(persistenceService.set).toHaveBeenCalled();
    });

    it('should update a transaction', () => {
      const addedTransaction = service.addTransaction(mockTransaction);
      const updatedTransaction: Transaction = {
        ...addedTransaction,
        title: 'Updated Transaction',
        value: 200
      };

      const result = service.updateTransaction(updatedTransaction);
      
      expect(result).toBe(true);
      expect(updatedTransaction.updatedAt).toBeTruthy();
      expect(persistenceService.set).toHaveBeenCalled();
    });

    it('should remove a transaction', () => {
      const addedTransaction = service.addTransaction(mockTransaction);
      
      const result = service.removeTransaction(addedTransaction.id);
      
      expect(result).toBe(true);
      expect(persistenceService.set).toHaveBeenCalled();
    });

    it('should return false when trying to remove non-existent transaction', () => {
      const result = service.removeTransaction('non-existent-id');
      
      expect(result).toBe(false);
    });

    it('should filter transactions by month and year', () => {
      const january2025 = service.addTransaction({
        ...mockTransaction,
        date: '2025-01-15'
      });
      
      const february2025 = service.addTransaction({
        ...mockTransaction,
        date: '2025-02-15'
      });

      const januaryTransactions = service.getTransactionsByMonth(1, 2025);
      const februaryTransactions = service.getTransactionsByMonth(2, 2025);
      
      expect(januaryTransactions.length).toBe(1);
      expect(januaryTransactions[0].id).toBe(january2025.id);
      expect(februaryTransactions.length).toBe(1);
      expect(februaryTransactions[0].id).toBe(february2025.id);
    });
  });

  describe('Installment management', () => {
    it('should add an installment plan', () => {
      const addedInstallment = service.addInstallment(mockInstallment);
      
      expect(addedInstallment).toBeTruthy();
      expect(addedInstallment.id).toBeTruthy();
      expect(addedInstallment.title).toBe(mockInstallment.title);
      expect(addedInstallment.totalValue).toBe(mockInstallment.totalValue);
      expect(addedInstallment.count).toBe(mockInstallment.count);
      expect(addedInstallment.installmentValue).toBe(100); // 1200 / 12
      expect(addedInstallment.createdAt).toBeTruthy();
      expect(persistenceService.set).toHaveBeenCalled();
    });

    it('should calculate installment value correctly', () => {
      const installmentWithValue = service.addInstallment({
        ...mockInstallment,
        installmentValue: 150
      });
      
      expect(installmentWithValue.installmentValue).toBe(150);
    });

    it('should remove an installment plan', () => {
      const addedInstallment = service.addInstallment(mockInstallment);
      
      const result = service.removeInstallment(addedInstallment.id);
      
      expect(result).toBe(true);
      expect(persistenceService.set).toHaveBeenCalled();
    });

    it('should generate installment rows correctly', () => {
      const plan: InstallmentPlan = {
        id: 'test-id',
        title: 'Test Plan',
        totalValue: 1200,
        installmentValue: 100,
        count: 12,
        startDate: '2025-01-01',
        category: 'Test',
        showOnDashboard: false,
        createdAt: new Date().toISOString()
      };

      const rows = service.generateInstallmentRows(plan);
      
      expect(rows.length).toBe(12);
      expect(rows[0].value).toBe(100);
      expect(rows[0].month).toContain('jan 2025');
      expect(rows[11].month).toContain('dez 2025');
    });
  });

  describe('Calculations', () => {
    beforeEach(() => {
      // Adicionar algumas transações para teste
      service.addTransaction({
        title: 'Income 1',
        value: 1000,
        date: '2025-01-15',
        category: 'Salary',
        type: 'income',
        showOnDashboard: true
      });

      service.addTransaction({
        title: 'Income 2',
        value: 500,
        date: '2025-01-20',
        category: 'Freelance',
        type: 'income',
        showOnDashboard: true
      });

      service.addTransaction({
        title: 'Expense 1',
        value: 300,
        date: '2025-01-10',
        category: 'Food',
        type: 'expense',
        showOnDashboard: true
      });

      service.addTransaction({
        title: 'Hidden Expense',
        value: 200,
        date: '2025-01-10',
        category: 'Hidden',
        type: 'expense',
        showOnDashboard: false // Não deve ser incluída nos cálculos
      });
    });

    it('should calculate totals correctly for a given month', () => {
      const totals = service.calculateTotals(1, 2025);
      
      expect(totals.totalIncomes).toBe(1500); // 1000 + 500
      expect(totals.totalExpenses).toBe(300); // 300 (hidden expense não conta)
      expect(totals.cashFlow).toBe(1200); // 1500 - 300
    });

    it('should return zero totals for month with no transactions', () => {
      const totals = service.calculateTotals(12, 2024);
      
      expect(totals.totalIncomes).toBe(0);
      expect(totals.totalExpenses).toBe(0);
      expect(totals.cashFlow).toBe(0);
    });
  });

  describe('Utility methods', () => {
    it('should return current month filter', () => {
      const filter = service.getCurrentMonthFilter();
      const now = new Date();
      
      expect(filter.month).toBe(now.getMonth() + 1);
      expect(filter.year).toBe(now.getFullYear());
    });

    it('should generate unique IDs', () => {
      const transaction1 = service.addTransaction(mockTransaction);
      const transaction2 = service.addTransaction(mockTransaction);
      
      expect(transaction1.id).not.toBe(transaction2.id);
      expect(transaction1.id).toMatch(/^uuid-/);
      expect(transaction2.id).toMatch(/^uuid-/);
    });
  });
});
