import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Patient, ScheduleSlot } from '../../models/patient.model';
import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-schedule-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-modal.component.html',
  styleUrls: ['./schedule-modal.component.scss']
})
export class ScheduleModalComponent implements OnInit {
  @Input() patient: Patient | null = null;
  @Output() saved = new EventEmitter<void>();

  scheduleSlots: ScheduleSlot[] = [];
  selectedSlots: { dayOfWeek: number, time: string, weekNumber: 1 | 2 }[] = [];
  
  weekDates: { week1: { startDate: Date, endDate: Date }, week2: { startDate: Date, endDate: Date } } = {
    week1: { startDate: new Date(), endDate: new Date() },
    week2: { startDate: new Date(), endDate: new Date() }
  };

  constructor(
    private modalService: NgbModal,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.generateScheduleSlots();
    this.calculateWeekDates();
  }

  private generateScheduleSlots(): void {
    this.scheduleSlots = this.patientService.generateScheduleSlots();
  }

  private calculateWeekDates(): void {
    this.weekDates.week1 = this.patientService.getWeekDates(1);
    this.weekDates.week2 = this.patientService.getWeekDates(2);
  }

  getSlotsForDay(dayOfWeek: number): ScheduleSlot[] {
    return this.scheduleSlots.filter(slot => slot.dayOfWeek === dayOfWeek);
  }

  getSlotsForDayAndWeek(dayOfWeek: number, weekNumber: 1 | 2): ScheduleSlot[] {
    return this.scheduleSlots.filter(slot => 
      slot.dayOfWeek === dayOfWeek && slot.weekNumber === weekNumber
    );
  }

  getSlotForDayWeekHour(dayOfWeek: number, weekNumber: 1 | 2, hour: number): ScheduleSlot {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const foundSlot = this.scheduleSlots.find(slot => 
      slot.dayOfWeek === dayOfWeek && 
      slot.weekNumber === weekNumber && 
      slot.time === time
    );
    
    if (foundSlot) {
      return foundSlot;
    }
    
    // Se não encontrou o slot, criar um slot vazio
    return {
      dayOfWeek,
      time,
      weekNumber,
      isOccupied: false
    };
  }

  isSlotSelected(dayOfWeek: number, time: string, weekNumber: 1 | 2): boolean {
    if (!this.patient) return false;
    
    // Para pacientes semanais, sempre verificar semana 1
    const actualWeekNumber = this.patient.scheduleType === 'weekly' ? 1 : weekNumber;
    
    return this.selectedSlots.some(slot => 
      slot.dayOfWeek === dayOfWeek && 
      slot.time === time && 
      slot.weekNumber === actualWeekNumber
    );
  }

  toggleSlot(dayOfWeek: number, time: string, weekNumber: 1 | 2): void {
    if (!this.patient) return;

    // Para pacientes semanais, sempre usar semana 1
    const actualWeekNumber = this.patient.scheduleType === 'weekly' ? 1 : weekNumber;

    // Verificar se o slot está disponível
    const isAvailable = this.patientService.isSlotAvailable(
      dayOfWeek, 
      time, 
      actualWeekNumber, 
      this.patient.id
    );

    if (!isAvailable) return;

    const existingIndex = this.selectedSlots.findIndex(slot => 
      slot.dayOfWeek === dayOfWeek && 
      slot.time === time && 
      slot.weekNumber === actualWeekNumber
    );

    if (existingIndex >= 0) {
      // Remover slot selecionado
      this.selectedSlots.splice(existingIndex, 1);
    } else {
      // Adicionar slot selecionado
      this.selectedSlots.push({ dayOfWeek, time, weekNumber: actualWeekNumber });
    }
  }

  saveSchedule(): void {
    if (!this.patient || this.selectedSlots.length === 0) {
      return;
    }

    // Adicionar cada slot selecionado como appointment
    for (const slot of this.selectedSlots) {
      this.patientService.addAppointmentToPatient(this.patient.id, {
        dayOfWeek: slot.dayOfWeek,
        time: slot.time,
        isBiweekly: this.patient.scheduleType === 'biweekly',
        biweeklyWeek: slot.weekNumber
      });
    }

    this.saved.emit();
    this.close();
  }

  close(): void {
    this.modalService.dismissAll();
  }

  getDayName(dayOfWeek: number): string {
    return this.patientService.getDayName(dayOfWeek);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  }

  getSlotTooltip(slot: ScheduleSlot): string {
    if (slot.isOccupied && slot.patient) {
      const weekText = slot.patient.scheduleType === 'biweekly' 
        ? ` (Semana ${slot.appointment?.biweeklyWeek})` 
        : '';
      return `${slot.patient.name}${weekText}`;
    }
    return 'Horário disponível';
  }
}
