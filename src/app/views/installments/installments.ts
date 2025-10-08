import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import { InstallmentPlan } from '../../shared/models/transaction.model';
import { FinanceService } from '../../shared/services/finance.service';
import { InstallmentModalComponent } from '../../shared/components/installment-modal/installment-modal.component';

interface InstallmentRow {
  planId: string;
  planTitle: string;
  category: string;
  monthlyInstallments: Array<{
    month: string;
    value: number;
    date: string;
    isPaid?: boolean;
  }>;
  totalValue: number;
}

interface MonthTotal {
  month: string;
  total: number;
}

@Component({
  selector: 'app-installments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './installments.html',
  styleUrl: './installments.scss'
})
export class Installments implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  installmentPlans: InstallmentPlan[] = [];
  installmentRows: InstallmentRow[] = [];
  monthTotals: MonthTotal[] = [];
  visibleMonths: string[] = [];
  
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
    'Outros'
  ];

  constructor(
    private financeService: FinanceService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInstallments();
    
    // Observar mudanças nas parcelas
    this.financeService.installments$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadInstallments();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInstallments(): void {
    this.financeService.getInstallments().subscribe(installments => {
      this.installmentPlans = installments;
      this.generateInstallmentTable();
    });
  }

  private generateInstallmentTable(): void {
    let filteredPlans = this.installmentPlans;
    
    // Aplicar filtro de categoria
    if (this.selectedCategory) {
      filteredPlans = this.installmentPlans.filter(plan => 
        plan.category === this.selectedCategory
      );
    }

    if (filteredPlans.length === 0) {
      this.installmentRows = [];
      this.monthTotals = [];
      this.visibleMonths = [];
      return;
    }

    // Gerar linhas da tabela
    this.installmentRows = filteredPlans.map(plan => {
      const installmentData = this.financeService.generateInstallmentRows(plan);
      
      return {
        planId: plan.id,
        planTitle: plan.title,
        category: plan.category || 'Sem categoria',
        monthlyInstallments: installmentData,
        totalValue: plan.totalValue
      };
    });

    // Gerar meses visíveis (união de todos os meses de todas as parcelas)
    const allMonths = new Set<string>();
    this.installmentRows.forEach(row => {
      row.monthlyInstallments.forEach(installment => {
        allMonths.add(installment.month);
      });
    });

    this.visibleMonths = Array.from(allMonths).sort((a, b) => {
      // Ordenar por data
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      
      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB);
      }
      
      const monthOrder = [
        'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
        'jul', 'ago', 'set', 'out', 'nov', 'dez'
      ];
      
      return monthOrder.indexOf(monthA.toLowerCase()) - monthOrder.indexOf(monthB.toLowerCase());
    });

    // Calcular totais por mês
    this.monthTotals = this.visibleMonths.map(month => {
      const total = this.installmentRows.reduce((sum, row) => {
        const installment = row.monthlyInstallments.find(inst => inst.month === month);
        return sum + (installment ? installment.value : 0);
      }, 0);
      
      return { month, total };
    });
  }

  openAddInstallmentModal(): void {
    const modalRef = this.modalService.open(InstallmentModalComponent, { size: 'lg' });
    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadInstallments();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  deleteInstallment(planId: string): void {
    const plan = this.installmentPlans.find(p => p.id === planId);
    if (plan && confirm(`Tem certeza que deseja excluir o parcelamento "${plan.title}"?`)) {
      this.financeService.removeInstallment(planId);
    }
  }

  onCategoryFilterChange(): void {
    this.generateInstallmentTable();
  }

  goToDashboard(): void {
    this.router.navigate(['/']);
  }

  goToCalendar(): void {
    this.router.navigate(['/calendar']);
  }

  getInstallmentValue(row: InstallmentRow, month: string): number {
    const installment = row.monthlyInstallments.find(inst => inst.month === month);
    return installment ? installment.value : 0;
  }

  hasInstallmentInMonth(row: InstallmentRow, month: string): boolean {
    return row.monthlyInstallments.some(inst => inst.month === month);
  }

  exportToCSV(): void {
    if (this.installmentRows.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }

    let csvContent = 'Parcelamento,Categoria,';
    csvContent += this.visibleMonths.join(',') + ',Total\n';

    this.installmentRows.forEach(row => {
      csvContent += `"${row.planTitle}","${row.category}",`;
      
      this.visibleMonths.forEach(month => {
        const value = this.getInstallmentValue(row, month);
        csvContent += `"R$ ${value.toFixed(2).replace('.', ',')}",`;
      });
      
      csvContent += `"R$ ${row.totalValue.toFixed(2).replace('.', ',')}"\n`;
    });

    // Linha de totais
    csvContent += 'TOTAL,,';
    this.monthTotals.forEach(monthTotal => {
      csvContent += `"R$ ${monthTotal.total.toFixed(2).replace('.', ',')}",`;
    });
    
    const grandTotal = this.installmentRows.reduce((sum, row) => sum + row.totalValue, 0);
    csvContent += `"R$ ${grandTotal.toFixed(2).replace('.', ',')}"\n`;

    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `parcelas_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  getTotalOfAllInstallments(): number {
    return this.installmentRows.reduce((sum, row) => sum + row.totalValue, 0);
  }

  trackByRow(index: number, row: InstallmentRow): string {
    return row.planId;
  }
}
