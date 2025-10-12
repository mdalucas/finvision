import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Patient } from '../../models/patient.model';
import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-standalone-appointment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './standalone-appointment-modal.component.html',
  styleUrls: ['./standalone-appointment-modal.component.scss']
})
export class StandaloneAppointmentModalComponent implements OnInit {
  @Input() selectedDate: string = '';
  @Output() saved = new EventEmitter<void>();

  allPatients: Patient[] = [];
  selectedPatient: Patient | null = null;
  appointmentTime: string = '09:00';
  notes: string = '';

  constructor(
    private modalService: NgbModal,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  private loadPatients(): void {
    this.patientService.getPatients().subscribe(patients => {
      this.allPatients = patients;
    });
  }

  onPatientChange(): void {
    // Lógica adicional quando paciente é selecionado
  }

  saveAppointment(): void {
    if (!this.selectedPatient) {
      alert('Por favor, selecione um paciente');
      return;
    }

    if (!this.appointmentTime) {
      alert('Por favor, selecione um horário');
      return;
    }

    // Aqui você pode adicionar a lógica para salvar o atendimento avulso
    // Por exemplo, criar uma nova transação ou appointment
    console.log('Atendimento avulso salvo:', {
      patient: this.selectedPatient,
      date: this.selectedDate,
      time: this.appointmentTime,
      notes: this.notes
    });

    this.saved.emit();
    this.close();
  }

  close(): void {
    this.modalService.dismissAll();
  }

  getPatientDisplayName(patient: Patient): string {
    return `${patient.name} - ${patient.phone}`;
  }
}
