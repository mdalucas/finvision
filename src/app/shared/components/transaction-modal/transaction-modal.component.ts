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

        <div class="mb-3">
          <label for="category" class="form-label">Categoria</label>
          <select class="form-select" id="category" formControlName="category">
            <option value="">Selecione uma categoria</option>
            <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="mb-3">
          <label for="type" class="form-label">Tipo *</label>
          <select 
            class="form-select" 
            id="type" 
            formControlName="type"
            [class.is-invalid]="transactionForm.get('type')?.invalid && transactionForm.get('type')?.touched">
            <option value="">Selecione o tipo</option>
            <option value="income">Entrada</option>
            <option value="expense">Saída</option>
          </select>
          <div class="invalid-feedback" *ngIf="transactionForm.get('type')?.invalid && transactionForm.get('type')?.touched">
            Tipo é obrigatório
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

        <div class="mb-3" *ngIf="allowInstallments">
          <label for="installments" class="form-label">Número de Parcelas</label>
          <input 
            type="number" 
            class="form-control" 
            id="installments"
            formControlName="installments"
            min="1"
            max="60"
            placeholder="1">
          <small class="form-text text-muted">
            Se maior que 1, será criado um plano de parcelas separado
          </small>
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
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private financeService: FinanceService
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.transaction;
    this.initForm();
  }

  get modalTitle(): string {
    if (this.isEdit) return 'Editar Transação';
    return this.defaultType === 'income' ? 'Nova Entrada' : 
           this.defaultType === 'expense' ? 'Nova Saída' : 'Nova Transação';
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.transactionForm = this.fb.group({
      title: [this.transaction?.title || '', [Validators.required]],
      value: [this.transaction?.value || '', [Validators.required, Validators.min(0.01)]],
      date: [this.transaction?.date?.split('T')[0] || this.defaultDate || today, [Validators.required]],
      category: [this.transaction?.category || ''],
      type: [this.transaction?.type || this.defaultType || '', [Validators.required]],
      showOnDashboard: [this.transaction?.showOnDashboard ?? true],
      installments: [1, [Validators.min(1), Validators.max(60)]]
    });
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      const installments = formValue.installments || 1;

      if (installments > 1 && this.allowInstallments) {
        // Criar plano de parcelas
        this.createInstallmentPlan(formValue);
      } else {
        // Criar transação simples
        this.createSimpleTransaction(formValue);
      }
    }
  }

  private createSimpleTransaction(formValue: any): void {
    if (this.isEdit && this.transaction) {
      const updatedTransaction: Transaction = {
        ...this.transaction,
        title: formValue.title,
        value: formValue.value,
        date: formValue.date,
        category: formValue.category,
        type: formValue.type,
        showOnDashboard: formValue.showOnDashboard
      };
      this.financeService.updateTransaction(updatedTransaction);
    } else {
      this.financeService.addTransaction({
        title: formValue.title,
        value: formValue.value,
        date: formValue.date,
        category: formValue.category,
        type: formValue.type,
        showOnDashboard: formValue.showOnDashboard
      });
    }
    
    this.activeModal.close('saved');
  }

  private createInstallmentPlan(formValue: any): void {
    this.financeService.addInstallment({
      title: formValue.title,
      totalValue: formValue.value,
      count: formValue.installments,
      startDate: formValue.date,
      category: formValue.category,
      showOnDashboard: false // Conforme especificação, parcelas não aparecem no dashboard
    });
    
    this.activeModal.close('installment_created');
  }
}
