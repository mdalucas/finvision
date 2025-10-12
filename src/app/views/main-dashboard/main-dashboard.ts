import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import { Transaction } from '../../shared/models/transaction.model';
import { Patient } from '../../shared/models/patient.model';
import { FinanceService } from '../../shared/services/finance.service';
import { PatientService } from '../../shared/services/patient.service';
import { TransactionModalComponent } from '../../shared/components/transaction-modal/transaction-modal.component';
import { PatientModalComponent } from '../../shared/components/patient-modal/patient-modal.component';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main-dashboard.html',
  styleUrl: './main-dashboard.scss'
})
export class MainDashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  pendingPatients: Transaction[] = [];
  paidPatients: Transaction[] = [];
  patients: Patient[] = [];
  
  totalPending = 0;
  totalPaid = 0;


  constructor(
    private modalService: NgbModal,
    private financeService: FinanceService,
    private patientService: PatientService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.loadData();
    this.loadPatients();

    // Observar mudanças nos pacientes
    this.patientService.patients$
      .pipe(takeUntil(this.destroy$))
      .subscribe((patients) => {
        this.patients = patients;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  private loadData(): void {
    this.financeService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe((transactions) => {
        const incomeTransactions = transactions.filter((t: Transaction) => t.type === 'income');

        // Separar em pendentes e pagos, ordenar por data e horário
        this.pendingPatients = incomeTransactions
          .filter((t: Transaction) => !t.received)
          .sort((a: Transaction, b: Transaction) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() === dateB.getTime()) {
              // Se a data for igual, ordenar por horário
              return a.time.localeCompare(b.time);
            }
            return dateB.getTime() - dateA.getTime();
          });
        
        this.paidPatients = incomeTransactions
          .filter((t: Transaction) => t.received)
          .sort((a: Transaction, b: Transaction) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() === dateB.getTime()) {
              // Se a data for igual, ordenar por horário
              return a.time.localeCompare(b.time);
            }
            return dateB.getTime() - dateA.getTime();
          });

        this.calculateTotals();
      });
  }

  private calculateTotals(): void {
    // Calcular totais separados
    this.totalPending = this.pendingPatients.reduce((sum, patient) => sum + patient.value, 0);
    this.totalPaid = this.paidPatients.reduce((sum, patient) => sum + patient.value, 0);
  }





  markAsPaid(patient: Transaction): void {
    const updatedPatient = { ...patient, received: true };
    this.financeService.updateTransaction(updatedPatient);
    this.loadData();
  }

  editTransaction(transaction: Transaction): void {
    const modalRef = this.modalService.open(TransactionModalComponent, { size: 'lg' });
    modalRef.componentInstance.transaction = transaction;
    modalRef.componentInstance.allowInstallments = false;
    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadData();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  deleteTransaction(transaction: Transaction): void {
    if (confirm(`Tem certeza que deseja excluir o paciente "${transaction.title}"?`)) {
      this.financeService.removeTransaction(transaction.id);
      this.loadData();
    }
  }


  private loadPatients(): void {
    this.patients = this.patientService.getPatientsList();
  }

  openAddPatientModal(): void {
    const modalRef = this.modalService.open(PatientModalComponent, { size: 'lg' });
    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadPatients();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  editPatient(patient: Patient): void {
    const modalRef = this.modalService.open(PatientModalComponent, { size: 'lg' });
    modalRef.componentInstance.patient = patient;
    
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadPatients();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  deletePatient(patient: Patient): void {
    if (confirm(`Tem certeza que deseja excluir o paciente "${patient.name}"?`)) {
      this.patientService.deletePatient(patient.id);
    }
  }

  getDayName(dayOfWeek: number): string {
    return this.patientService.getDayName(dayOfWeek);
  }
}