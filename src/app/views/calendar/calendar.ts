import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbCalendar, NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import { Transaction } from '../../shared/models/transaction.model';
import { FinanceService } from '../../shared/services/finance.service';
import { TransactionModalComponent } from '../../shared/components/transaction-modal/transaction-modal.component';

interface CalendarDay {
  date: NgbDate;
  transactions: Transaction[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss'
})
export class Calendar implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentDate: NgbDate;
  selectedDate: NgbDate | null = null;
  calendarDays: CalendarDay[] = [];
  allTransactions: Transaction[] = [];
  
  // Filtros
  selectedCategory = '';
  categories = [
    'Alimentação',
    'Transporte',
    'Saúde',
    'Educação',
    'Lazer',
    'Casa',
    'Roupas',
    'Eletrônicos',
    'Investimentos',
    'Salário',
    'Freelance',
    'Outros'
  ];

  constructor(
    private calendar: NgbCalendar,
    private modalService: NgbModal,
    private financeService: FinanceService,
    private router: Router
  ) {
    this.currentDate = this.calendar.getToday();
  }

  ngOnInit(): void {
    this.loadTransactions();
    this.generateCalendarDays();
    
    // Observar mudanças nas transações
    this.financeService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadTransactions();
        this.generateCalendarDays();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTransactions(): void {
    this.financeService.getTransactions().subscribe(transactions => {
      this.allTransactions = transactions;
    });
  }

  private generateCalendarDays(): void {
    const year = this.currentDate.year;
    const month = this.currentDate.month;
    
    // Primeiro dia do mês
    const firstDay = new NgbDate(year, month, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Primeiro dia da semana (domingo = 0)
    const firstDayOfWeek = this.calendar.getWeekday(firstDay) % 7;
    
    this.calendarDays = [];
    
    // Dias do mês anterior para completar a primeira semana
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    const daysInPreviousMonth = new Date(previousYear, previousMonth, 0).getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPreviousMonth - i;
      const date = new NgbDate(previousYear, previousMonth, day);
      this.calendarDays.push(this.createCalendarDay(date, false));
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new NgbDate(year, month, day);
      this.calendarDays.push(this.createCalendarDay(date, true));
    }
    
    // Dias do próximo mês para completar a última semana
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const daysToAdd = 42 - this.calendarDays.length; // 6 semanas * 7 dias
    
    for (let day = 1; day <= daysToAdd; day++) {
      const date = new NgbDate(nextYear, nextMonth, day);
      this.calendarDays.push(this.createCalendarDay(date, false));
    }
  }

  private createCalendarDay(date: NgbDate, isCurrentMonth: boolean): CalendarDay {
    const today = this.calendar.getToday();
    const dateString = `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
    
    let transactions = this.allTransactions.filter(t => 
      t.date.startsWith(dateString)
    );
    
    // Aplicar filtro de categoria se selecionado
    if (this.selectedCategory) {
      transactions = transactions.filter(t => t.category === this.selectedCategory);
    }
    
    return {
      date,
      transactions,
      isCurrentMonth,
      isToday: this.isDateEqual(date, today),
      isSelected: this.selectedDate ? this.isDateEqual(date, this.selectedDate) : false
    };
  }

  private isDateEqual(date1: NgbDate, date2: NgbDate): boolean {
    return date1.year === date2.year && date1.month === date2.month && date1.day === date2.day;
  }

  onDateClick(day: CalendarDay): void {
    this.selectedDate = day.date;
    this.generateCalendarDays(); // Regenerar para atualizar seleção
    
    // Abrir modal para adicionar transação
    this.openTransactionModal(day.date);
  }

  openTransactionModal(date?: NgbDate): void {
    const modalRef = this.modalService.open(TransactionModalComponent, { size: 'lg' });
    
    if (date) {
      const dateString = `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
      modalRef.componentInstance.defaultDate = dateString;
    }
    
    modalRef.result.then((result) => {
      if (result === 'saved' || result === 'installment_created') {
        this.loadTransactions();
        this.generateCalendarDays();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  previousMonth(): void {
    this.currentDate = this.calendar.getPrev(this.currentDate, 'm', 1);
    this.generateCalendarDays();
  }

  nextMonth(): void {
    this.currentDate = this.calendar.getNext(this.currentDate, 'm', 1);
    this.generateCalendarDays();
  }

  goToToday(): void {
    this.currentDate = this.calendar.getToday();
    this.selectedDate = null;
    this.generateCalendarDays();
  }

  onCategoryFilterChange(): void {
    this.generateCalendarDays();
  }

  goToDashboard(): void {
    this.router.navigate(['/']);
  }

  editTransaction(transaction: Transaction, event: Event): void {
    event.stopPropagation(); // Prevenir que o clique do dia seja executado
    
    const modalRef = this.modalService.open(TransactionModalComponent, { size: 'lg' });
    modalRef.componentInstance.transaction = transaction;
    modalRef.componentInstance.allowInstallments = false;
    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadTransactions();
        this.generateCalendarDays();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  deleteTransaction(transaction: Transaction, event: Event): void {
    event.stopPropagation(); // Prevenir que o clique do dia seja executado
    
    if (confirm(`Tem certeza que deseja excluir "${transaction.title}"?`)) {
      this.financeService.removeTransaction(transaction.id);
    }
  }

  getMonthName(): string {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return monthNames[this.currentDate.month - 1];
  }

  trackByTransaction(index: number, transaction: Transaction): string {
    return transaction.id;
  }
}
