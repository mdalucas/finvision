import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Patient } from '../../models/patient.model';
import { PatientService } from '../../services/patient.service';
import { ScheduleModalComponent } from '../schedule-modal/schedule-modal.component';

@Component({
  selector: 'app-patient-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-modal.component.html',
  styleUrls: ['./patient-modal.component.scss']
})
export class PatientModalComponent implements OnInit {
  @Input() patient: Patient | null = null;
  @Input() preselectSchedule: { dayOfWeek: number, time: string, weekNumber: 1 | 2, dayName: string } | null = null;
  @Output() saved = new EventEmitter<void>();

  patientData = {
    name: '',
    phone: '',
    cpf: '',
    scheduleType: 'weekly' as 'weekly' | 'biweekly',
    consultationValue: 0
  };
  
  preselectScheduleType: 'weekly' | 'biweekly' = 'weekly';

  isEditMode = false;

  constructor(
    private modalService: NgbModal,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    if (this.patient) {
      this.isEditMode = true;
      this.patientData = {
        name: this.patient.name,
        phone: this.patient.phone,
        cpf: this.patient.cpf,
        scheduleType: this.patient.scheduleType,
        consultationValue: this.patient.consultationValue || 0
      };
    }
  }

  save(): void {
    if (!this.isValid()) {
      return;
    }

    if (this.isEditMode && this.patient) {
      this.patientService.updatePatient(this.patient.id, this.patientData);
    } else {
      this.patientService.addPatient({
        ...this.patientData,
        appointments: []
      });
    }

    this.saved.emit();
    this.close();
  }

  openScheduleModal(): void {
    // Primeiro salva o paciente
    if (!this.isValid()) {
      return;
    }

    let patient: Patient;
    if (this.isEditMode && this.patient) {
      patient = this.patientService.updatePatient(this.patient.id, this.patientData)!;
    } else {
      patient = this.patientService.addPatient({
        ...this.patientData,
        appointments: []
      });
    }

    // Fecha o modal atual
    this.close();

    // Abre o modal de agenda
    const scheduleModalRef = this.modalService.open(ScheduleModalComponent, { 
      size: 'xl',
      backdrop: 'static'
    });
    scheduleModalRef.componentInstance.patient = patient;
    
    // Se há horário pré-selecionado, seleciona automaticamente
    if (this.preselectSchedule) {
      scheduleModalRef.componentInstance.preselectSlot = {
        dayOfWeek: this.preselectSchedule.dayOfWeek,
        time: this.preselectSchedule.time,
        weekNumber: this.preselectSchedule.weekNumber
      };
    }
    
    scheduleModalRef.result.then((result) => {
      if (result === 'saved') {
        this.saved.emit();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  savePatientWithSchedule(): void {
    if (!this.isValid() || !this.preselectSchedule) {
      return;
    }

    // Cria o paciente com o horário já agendado
    const patient = this.patientService.addPatient({
      ...this.patientData,
      scheduleType: this.preselectScheduleType,
      consultationValue: this.patientData.consultationValue,
      appointments: [{
        id: this.generateId(),
        dayOfWeek: this.preselectSchedule.dayOfWeek,
        time: this.preselectSchedule.time,
        isBiweekly: this.preselectScheduleType === 'biweekly',
        biweeklyWeek: this.preselectScheduleType === 'biweekly' ? this.preselectSchedule.weekNumber : undefined
      }]
    });

    this.saved.emit();
    this.close();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  close(): void {
    this.modalService.dismissAll();
  }

  openChangeScheduleModal(): void {
    if (!this.patient) return;

    // Primeiro salva as alterações do paciente
    if (!this.isValid()) {
      return;
    }

    // Atualiza o paciente com os dados alterados
    const updatedPatient = this.patientService.updatePatient(this.patient.id, this.patientData);
    if (!updatedPatient) {
      return;
    }

    // Fecha o modal atual
    this.close();

    // Abre o modal de agenda com o paciente atualizado
    const scheduleModalRef = this.modalService.open(ScheduleModalComponent, {
      size: 'xl',
      backdrop: 'static'
    });
    
    scheduleModalRef.componentInstance.patient = updatedPatient;

    scheduleModalRef.result.then((result) => {
      if (result === 'saved') {
        this.saved.emit();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayOfWeek] || '';
  }

  isValid(): boolean {
    const basicValid = !!(this.patientData.name.trim() && 
                          this.patientData.phone.trim() && 
                          this.patientData.cpf.trim() &&
                          this.patientData.consultationValue > 0);
    
    // Se há horário pré-selecionado, também precisa ter tipo de agendamento
    if (this.preselectSchedule) {
      return basicValid && (this.preselectScheduleType === 'weekly' || this.preselectScheduleType === 'biweekly');
    }
    
    return basicValid;
  }
}
