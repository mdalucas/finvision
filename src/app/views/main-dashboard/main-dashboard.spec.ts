import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { MainDashboard } from './main-dashboard';
import { FinanceService } from '../../shared/services/finance.service';
import { Transaction, MonthlyFilter } from '../../shared/models/transaction.model';

describe('MainDashboard', () => {
  let component: MainDashboard;
  let fixture: ComponentFixture<MainDashboard>;
  let financeService: jasmine.SpyObj<FinanceService>;
  let modalService: jasmine.SpyObj<NgbModal>;
  let router: jasmine.SpyObj<Router>;

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      title: 'Salary',
      value: 5000,
      date: '2025-01-15',
      category: 'Income',
      type: 'income',
      showOnDashboard: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    },
    {
      id: '2',
      title: 'Groceries',
      value: 300,
      date: '2025-01-10',
      category: 'Food',
      type: 'expense',
      showOnDashboard: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    },
    {
      id: '3',
      title: 'Hidden Transaction',
      value: 100,
      date: '2025-01-05',
      category: 'Hidden',
      type: 'expense',
      showOnDashboard: false, // Não deve aparecer nos cálculos
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    }
  ];

  const mockCurrentFilter: MonthlyFilter = {
    month: 1,
    year: 2025
  };

  beforeEach(async () => {
    const financeServiceSpy = jasmine.createSpyObj('FinanceService', [
      'getTransactionsByMonth',
      'calculateTotals',
      'getCurrentMonthFilter',
      'removeTransaction'
    ], {
      transactions$: of(mockTransactions)
    });

    const modalServiceSpy = jasmine.createSpyObj('NgbModal', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [MainDashboard],
      providers: [
        { provide: FinanceService, useValue: financeServiceSpy },
        { provide: NgbModal, useValue: modalServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainDashboard);
    component = fixture.componentInstance;
    financeService = TestBed.inject(FinanceService) as jasmine.SpyObj<FinanceService>;
    modalService = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default mock returns
    financeService.getCurrentMonthFilter.and.returnValue(mockCurrentFilter);
    financeService.getTransactionsByMonth.and.returnValue(
      mockTransactions.filter(t => t.showOnDashboard)
    );
    financeService.calculateTotals.and.returnValue({
      totalIncomes: 5000,
      totalExpenses: 300,
      cashFlow: 4700
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current month filter', () => {
    expect(component.currentFilter).toEqual(mockCurrentFilter);
    expect(financeService.getCurrentMonthFilter).toHaveBeenCalled();
  });

  it('should generate year options correctly', () => {
    const currentYear = new Date().getFullYear();
    expect(component.yearOptions.length).toBe(11); // 5 anos antes + ano atual + 5 anos depois
    expect(component.yearOptions).toContain(currentYear);
    expect(component.yearOptions).toContain(currentYear - 5);
    expect(component.yearOptions).toContain(currentYear + 5);
  });

  it('should load data on init', () => {
    component.ngOnInit();

    expect(financeService.getTransactionsByMonth).toHaveBeenCalledWith(1, 2025);
    expect(financeService.calculateTotals).toHaveBeenCalledWith(1, 2025);
    expect(component.incomes.length).toBe(1);
    expect(component.expenses.length).toBe(1);
    expect(component.totalIncomes).toBe(5000);
    expect(component.totalExpenses).toBe(300);
    expect(component.cashFlow).toBe(4700);
  });

  it('should separate incomes and expenses correctly', () => {
    component.ngOnInit();

    expect(component.incomes[0].type).toBe('income');
    expect(component.expenses[0].type).toBe('expense');
    expect(component.incomes[0].title).toBe('Salary');
    expect(component.expenses[0].title).toBe('Groceries');
  });

  it('should reload data when filter changes', () => {
    component.currentFilter = { month: 2, year: 2025 };
    component.onFilterChange();

    expect(financeService.getTransactionsByMonth).toHaveBeenCalledWith(2, 2025);
    expect(financeService.calculateTotals).toHaveBeenCalledWith(2, 2025);
  });

  it('should open add income modal with correct parameters', () => {
    const mockModalRef = { componentInstance: {}, result: Promise.resolve('saved') };
    modalService.open.and.returnValue(mockModalRef as any);

    component.openAddIncomeModal();

    expect(modalService.open).toHaveBeenCalled();
    expect(mockModalRef.componentInstance.defaultType).toBe('income');
    expect(mockModalRef.componentInstance.defaultDate).toBe('2025-01-01');
  });

  it('should open add expense modal with correct parameters', () => {
    const mockModalRef = { componentInstance: {}, result: Promise.resolve('saved') };
    modalService.open.and.returnValue(mockModalRef as any);

    component.openAddExpenseModal();

    expect(modalService.open).toHaveBeenCalled();
    expect(mockModalRef.componentInstance.defaultType).toBe('expense');
    expect(mockModalRef.componentInstance.defaultDate).toBe('2025-01-01');
  });

  it('should open installment modal', () => {
    const mockModalRef = { result: Promise.resolve('saved') };
    modalService.open.and.returnValue(mockModalRef as any);

    component.openInstallmentModal();

    expect(modalService.open).toHaveBeenCalled();
  });

  it('should navigate to calendar', () => {
    component.goToCalendar();
    expect(router.navigate).toHaveBeenCalledWith(['/calendar']);
  });

  it('should navigate to installments', () => {
    component.goToInstallments();
    expect(router.navigate).toHaveBeenCalledWith(['/installments']);
  });

  it('should edit transaction', () => {
    const mockTransaction = mockTransactions[0];
    const mockModalRef = { 
      componentInstance: {}, 
      result: Promise.resolve('saved') 
    };
    modalService.open.and.returnValue(mockModalRef as any);

    component.editTransaction(mockTransaction);

    expect(modalService.open).toHaveBeenCalled();
    expect(mockModalRef.componentInstance.transaction).toBe(mockTransaction);
    expect(mockModalRef.componentInstance.allowInstallments).toBe(false);
  });

  it('should delete transaction after confirmation', () => {
    const mockTransaction = mockTransactions[0];
    spyOn(window, 'confirm').and.returnValue(true);

    component.deleteTransaction(mockTransaction);

    expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir "Salary"?');
    expect(financeService.removeTransaction).toHaveBeenCalledWith('1');
  });

  it('should not delete transaction if confirmation is cancelled', () => {
    const mockTransaction = mockTransactions[0];
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteTransaction(mockTransaction);

    expect(window.confirm).toHaveBeenCalled();
    expect(financeService.removeTransaction).not.toHaveBeenCalled();
  });

  it('should format current filter date correctly', () => {
    component.currentFilter = { month: 3, year: 2025 };
    const result = component['getCurrentFilterDate']();
    expect(result).toBe('2025-03-01');
  });

  it('should handle single digit months in date formatting', () => {
    component.currentFilter = { month: 9, year: 2025 };
    const result = component['getCurrentFilterDate']();
    expect(result).toBe('2025-09-01');
  });

  it('should cleanup subscriptions on destroy', () => {
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});