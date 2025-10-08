import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { InstallmentPlan } from '../../models/transaction.model';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-installment-modal',
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
      <form [formGroup]="installmentForm" (ngSubmit)="onSubmit()">
        <div class="mb-3">
          <label for="title" class="form-label">Título *</label>
          <input 
            type="text" 
            class="form-control" 
            id="title"
            formControlName="title"
            [class.is-invalid]="installmentForm.get('title')?.invalid && installmentForm.get('title')?.touched"
            placeholder="Digite o título do parcelamento">
          <div class="invalid-feedback" *ngIf="installmentForm.get('title')?.invalid && installmentForm.get('title')?.touched">
            Título é obrigatório
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label class="form-label">Tipo de Valor</label>
              <div class="form-check">
                <input 
                  class="form-check-input" 
                  type="radio" 
                  name="valueType" 
                  id="totalValue" 
                  value="total"
                  (change)="onValueTypeChange('total')"
                  [checked]="valueType === 'total'">
                <label class="form-check-label" for="totalValue">
                  Valor Total
                </label>
              </div>
              <div class="form-check">
                <input 
                  class="form-check-input" 
                  type="radio" 
                  name="valueType" 
                  id="installmentValue" 
                  value="installment"
                  (change)="onValueTypeChange('installment')"
                  [checked]="valueType === 'installment'">
                <label class="form-check-label" for="installmentValue">
                  Valor da Parcela
                </label>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="count" class="form-label">Número de Parcelas *</label>
              <input 
                type="number" 
                class="form-control" 
                id="count"
                formControlName="count"
                [class.is-invalid]="installmentForm.get('count')?.invalid && installmentForm.get('count')?.touched"
                min="2"
                max="60"
                (input)="onCountChange()"
                placeholder="Ex: 12">
              <div class="invalid-feedback" *ngIf="installmentForm.get('count')?.invalid && installmentForm.get('count')?.touched">
                Número de parcelas deve ser entre 2 e 60
              </div>
            </div>
          </div>
        </div>

        <div class="mb-3">
          <label for="value" class="form-label">
            {{ valueType === 'total' ? 'Valor Total' : 'Valor da Parcela' }} *
          </label>
          <div class="input-group">
            <span class="input-group-text">R$</span>
            <input 
              type="number" 
              class="form-control" 
              id="value"
              formControlName="value"
              [class.is-invalid]="installmentForm.get('value')?.invalid && installmentForm.get('value')?.touched"
              min="0.01"
              step="0.01"
              (input)="onValueChange()"
              placeholder="0,00">
          </div>
          <div class="invalid-feedback" *ngIf="installmentForm.get('value')?.invalid && installmentForm.get('value')?.touched">
            Valor deve ser maior que 0
          </div>
        </div>

        <div class="mb-3" *ngIf="calculatedValue > 0">
          <div class="alert alert-info">
            <strong>Resumo:</strong><br>
            <span *ngIf="valueType === 'total'">
              Valor da parcela: <strong>R$ {{ calculatedValue | number:'1.2-2' }}</strong>
            </span>
            <span *ngIf="valueType === 'installment'">
              Valor total: <strong>R$ {{ calculatedValue | number:'1.2-2' }}</strong>
            </span>
          </div>
        </div>

        <div class="mb-3">
          <label for="startDate" class="form-label">Data do Primeiro Pagamento *</label>
          <input 
            type="date" 
            class="form-control" 
            id="startDate"
            formControlName="startDate"
            [class.is-invalid]="installmentForm.get('startDate')?.invalid && installmentForm.get('startDate')?.touched">
          <div class="invalid-feedback" *ngIf="installmentForm.get('startDate')?.invalid && installmentForm.get('startDate')?.touched">
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

        <div class="mb-3 form-check">
          <input 
            type="checkbox" 
            class="form-check-input" 
            id="showOnDashboard"
            formControlName="showOnDashboard">
          <label class="form-check-label" for="showOnDashboard">
            Mostrar no Dashboard
          </label>
          <small class="form-text text-muted d-block">
            Por padrão, parcelas não aparecem no dashboard para evitar dupla contagem
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
        [disabled]="installmentForm.invalid"
        (click)="onSubmit()">
        Criar Parcelamento
      </button>
    </div>
  `,
  styleUrls: ['./installment-modal.component.scss']
})
export class InstallmentModalComponent implements OnInit {
  @Input() installment?: InstallmentPlan;

  installmentForm!: FormGroup;
  valueType: 'total' | 'installment' = 'total';
  calculatedValue = 0;

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
    'Outros'
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private financeService: FinanceService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  get modalTitle(): string {
    return 'Novo Parcelamento';
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.installmentForm = this.fb.group({
      title: [this.installment?.title || '', [Validators.required]],
      value: [this.installment?.totalValue || '', [Validators.required, Validators.min(0.01)]],
      count: [this.installment?.count || 2, [Validators.required, Validators.min(2), Validators.max(60)]],
      startDate: [this.installment?.startDate?.split('T')[0] || today, [Validators.required]],
      category: [this.installment?.category || ''],
      showOnDashboard: [this.installment?.showOnDashboard ?? false]
    });

    if (this.installment) {
      this.valueType = this.installment.installmentValue ? 'installment' : 'total';
      if (this.installment.installmentValue) {
        this.installmentForm.patchValue({ value: this.installment.installmentValue });
      }
    }

    this.calculateValue();
  }

  onValueTypeChange(type: 'total' | 'installment'): void {
    this.valueType = type;
    this.calculateValue();
  }

  onValueChange(): void {
    this.calculateValue();
  }

  onCountChange(): void {
    this.calculateValue();
  }

  private calculateValue(): void {
    const value = this.installmentForm.get('value')?.value || 0;
    const count = this.installmentForm.get('count')?.value || 1;

    if (value > 0 && count > 0) {
      if (this.valueType === 'total') {
        this.calculatedValue = value / count; // Valor da parcela
      } else {
        this.calculatedValue = value * count; // Valor total
      }
    } else {
      this.calculatedValue = 0;
    }
  }

  onSubmit(): void {
    if (this.installmentForm.valid) {
      const formValue = this.installmentForm.value;
      
      let totalValue: number;
      let installmentValue: number;

      if (this.valueType === 'total') {
        totalValue = formValue.value;
        installmentValue = totalValue / formValue.count;
      } else {
        installmentValue = formValue.value;
        totalValue = installmentValue * formValue.count;
      }

      this.financeService.addInstallment({
        title: formValue.title,
        totalValue: totalValue,
        installmentValue: installmentValue,
        count: formValue.count,
        startDate: formValue.startDate,
        category: formValue.category,
        showOnDashboard: formValue.showOnDashboard
      });
      
      this.activeModal.close('saved');
    }
  }
}
