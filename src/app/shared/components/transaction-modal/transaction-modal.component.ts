import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Transaction, TransactionType } from '../../models/transaction.model';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">{{ modalTitle }}</h4>
      <button 
        type="button" 
        class="btn-close" 
        aria-label="Fechar"
        (click)="activeModal.dismiss()">
      </button>
    </div>

    <div class="modal-body">
      <form [formGroup]="transactionForm" (ngSubmit)="onSubmit()">
        <div class="mb-3">
          <label for="title" class="form-label">Título *</label>
          <input 
            type="text" 
            class="form-control" 
            id="title"
            formControlName="title"
            [class.is-invalid]="transactionForm.get('title')?.invalid && transactionForm.get('title')?.touched"
            placeholder="Digite o título da transação">
          <div class="invalid-feedback" *ngIf="transactionForm.get('title')?.invalid && transactionForm.get('title')?.touched">
            Título é obrigatório
          </div>
        </div>

        <div class="mb-3">
          <label for="value" class="form-label">Valor *</label>
          <div class="input-group">
            <span class="input-group-text">R$</span>
            <input 
              type="number" 
              class="form-control" 
              id="value"
              formControlName="value"
              [class.is-invalid]="transactionForm.get('value')?.invalid && transactionForm.get('value')?.touched"
              min="0.01"
              step="0.01"
              placeholder="0,00">
          </div>
          <div class="invalid-feedback" *ngIf="transactionForm.get('value')?.invalid && transactionForm.get('value')?.touched">
            Valor deve ser maior que 0
          </div>
        </div>

        <div class="mb-3">
          <label for="date" class="form-label">Data *</label>
          <input 
            type="date" 
            class="form-control" 
            id="date"
            formControlName="date"
            [class.is-invalid]="transactionForm.get('date')?.invalid && transactionForm.get('date')?.touched">
          <div class="invalid-feedback" *ngIf="transactionForm.get('date')?.invalid && transactionForm.get('date')?.touched">
            Data é obrigatória
          </div>
        </div>


        <div class="mb-3 form-check">
          <input 
            type="checkbox" 
            class="form-check-input" 
            id="showOnDashboard"
            formControlName="showOnDashboard">
          <label class="form-check-label" for="showOnDashboard">
            Mostrar no Dashboard
          </label>
        </div>

      </form>
    </div>

    <div class="modal-footer">
      <button 
        type="button" 
        class="btn btn-secondary" 
        (click)="activeModal.dismiss()">
        Cancelar
      </button>
      <button 
        type="button" 
        class="btn btn-primary" 
        [disabled]="transactionForm.invalid"
        (click)="onSubmit()">
        {{ isEdit ? 'Atualizar' : 'Salvar' }}
      </button>
    </div>
  `,
  styleUrls: ['./transaction-modal.component.scss']
})
export class TransactionModalComponent implements OnInit {
  @Input() transaction?: Transaction;
  @Input() defaultType?: TransactionType;
  @Input() defaultDate?: string;
  @Input() allowInstallments = true;

  transactionForm!: FormGroup;
  isEdit = false;


  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private financeService: FinanceService
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.transaction;
    this.initForm();
  }

  get modalTitle(): string {
    if (this.isEdit) return 'Editar Entrada';
    return 'Nova Entrada';
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.transactionForm = this.fb.group({
      title: [this.transaction?.title || '', [Validators.required]],
      value: [this.transaction?.value || '', [Validators.required, Validators.min(0.01)]],
      date: [this.transaction?.date?.split('T')[0] || this.defaultDate || today, [Validators.required]],
      type: ['income'], // Sempre entrada
      showOnDashboard: [this.transaction?.showOnDashboard ?? true]
    });
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      this.createSimpleTransaction(formValue);
    }
  }

  private createSimpleTransaction(formValue: any): void {
    if (this.isEdit && this.transaction) {
      const updatedTransaction: Transaction = {
        ...this.transaction,
        title: formValue.title,
        value: formValue.value,
        date: formValue.date,
        type: formValue.type,
        showOnDashboard: formValue.showOnDashboard
      };
      this.financeService.updateTransaction(updatedTransaction);
    } else {
      this.financeService.addTransaction({
        title: formValue.title,
        value: formValue.value,
        date: formValue.date,
        type: formValue.type,
        showOnDashboard: formValue.showOnDashboard
      });
    }
    
    this.activeModal.close('saved');
  }

}
