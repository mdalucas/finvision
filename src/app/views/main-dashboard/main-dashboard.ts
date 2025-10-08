import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import { Transaction, MonthlyFilter } from '../../shared/models/transaction.model';
import { FinanceService } from '../../shared/services/finance.service';
import { TransactionModalComponent } from '../../shared/components/transaction-modal/transaction-modal.component';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule],
  templateUrl: './main-dashboard.html',
  styleUrl: './main-dashboard.scss'
})
export class MainDashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentFilter: MonthlyFilter;
  incomes: Transaction[] = [];
  expenses: Transaction[] = [];
  
  totalIncomes = 0;
  totalExpenses = 0;
  cashFlow = 0;

  // Opções de mês/ano para o filtro
  monthOptions = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  yearOptions: number[] = [];

  constructor(
    private modalService: NgbModal,
    private financeService: FinanceService,
    private router: Router
  ) {
    this.currentFilter = this.financeService.getCurrentMonthFilter();
    this.generateYearOptions();
  }

  ngOnInit(): void {
    this.loadData();
    
    // Observar mudanças nas transações
    this.financeService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private generateYearOptions(): void {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      this.yearOptions.push(year);
    }
  }

  private loadData(): void {
    const transactions = this.financeService.getTransactionsByMonth(
      this.currentFilter.month, 
      this.currentFilter.year
    ).filter(t => t.showOnDashboard && t.type === 'income');

    this.incomes = transactions;
    this.expenses = []; // Sempre vazio - apenas entradas

    this.calculateTotals();
  }

  private calculateTotals(): void {
    // Calcular apenas entradas
    this.totalIncomes = this.incomes.reduce((sum, income) => sum + income.value, 0);
    this.totalExpenses = 0; // Sempre zero - apenas entradas
    this.cashFlow = this.totalIncomes; // Saldo = entradas (sem saídas)
  }

  onFilterChange(): void {
    this.loadData();
  }

  openAddIncomeModal(): void {
    const modalRef = this.modalService.open(TransactionModalComponent, { size: 'lg' });
    modalRef.componentInstance.defaultType = 'income';
    modalRef.componentInstance.defaultDate = this.getCurrentFilterDate();
    
    modalRef.result.then((result) => {
      if (result === 'saved' || result === 'installment_created') {
        this.loadData();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }


  goToCalendar(): void {
    this.router.navigate(['/calendar']);
  }

  editTransaction(transaction: Transaction): void {
    const modalRef = this.modalService.open(TransactionModalComponent, { size: 'lg' });
    modalRef.componentInstance.transaction = transaction;
    modalRef.componentInstance.allowInstallments = false; // Não permitir parcelas ao editar
    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadData();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  deleteTransaction(transaction: Transaction): void {
    if (confirm(`Tem certeza que deseja excluir "${transaction.title}"?`)) {
      this.financeService.removeTransaction(transaction.id);
      this.loadData();
    }
  }

  private getCurrentFilterDate(): string {
    return `${this.currentFilter.year}-${this.currentFilter.month.toString().padStart(2, '0')}-01`;
  }
}