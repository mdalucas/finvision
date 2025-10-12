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
  @Output() saved = new EventEmitter<void>();

  patientData = {
    name: '',
    phone: '',
    cpf: '',
    scheduleType: 'weekly' as 'weekly' | 'biweekly'
  };

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
        scheduleType: this.patient.scheduleType
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
    
    scheduleModalRef.result.then((result) => {
      if (result === 'saved') {
        this.saved.emit();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  close(): void {
    this.modalService.dismissAll();
  }

  private isValid(): boolean {
    return !!(this.patientData.name.trim() && 
              this.patientData.phone.trim() && 
              this.patientData.cpf.trim());
  }
}
