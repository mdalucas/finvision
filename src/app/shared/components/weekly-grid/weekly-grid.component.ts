import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import { Patient, ScheduleSlot } from '../../models/patient.model';
import { PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-weekly-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './weekly-grid.component.html',
  styleUrls: ['./weekly-grid.component.scss']
})
export class WeeklyGridComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  scheduleSlots: ScheduleSlot[] = [];
  allPatients: Patient[] = [];
  
  weekDates: { week1: { startDate: Date, endDate: Date }, week2: { startDate: Date, endDate: Date } } = {
    week1: { startDate: new Date(), endDate: new Date() },
    week2: { startDate: new Date(), endDate: new Date() }
  };

  constructor(
    private modalService: NgbModal,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
    this.calculateWeekDates();
    this.checkLocalStorageData();
    
    // Observar mudanças nos pacientes
    this.patientService.patients$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadPatients();
      });
  }

  private checkLocalStorageData(): void {
    const stored = localStorage.getItem('finvision_patients');
    console.log('Dados no localStorage:', stored);
    if (stored) {
      try {
        const patients = JSON.parse(stored);
        console.log('Pacientes parseados:', patients);
      } catch (error) {
        console.error('Erro ao parsear pacientes:', error);
      }
    } else {
      console.log('Nenhum dado de pacientes encontrado no localStorage');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPatients(): void {
    this.patientService.getPatients().subscribe(patients => {
      console.log('Pacientes carregados na grade semanal:', patients);
      this.allPatients = patients;
      this.generateScheduleSlots();
      console.log('Slots gerados:', this.scheduleSlots);
    });
  }

  private generateScheduleSlots(): void {
    this.scheduleSlots = this.patientService.generateScheduleSlots();
  }

  private calculateWeekDates(): void {
    this.weekDates.week1 = this.patientService.getWeekDates(1);
    this.weekDates.week2 = this.patientService.getWeekDates(2);
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

  // Verificar se há pacientes quinzenais em um horário específico
  hasBiweeklyPatientsInSlot(dayOfWeek: number, time: string): boolean {
    return this.allPatients.some(patient => 
      patient.scheduleType === 'biweekly' &&
      patient.appointments.some(appointment => 
        appointment.dayOfWeek === dayOfWeek && 
        appointment.time === time
      )
    );
  }

  // Verificar se há pacientes semanais em um horário específico
  hasWeeklyPatientsInSlot(dayOfWeek: number, time: string): boolean {
    return this.allPatients.some(patient => 
      patient.scheduleType === 'weekly' &&
      patient.appointments.some(appointment => 
        appointment.dayOfWeek === dayOfWeek && 
        appointment.time === time
      )
    );
  }

  // Verificar se um horário tem pacientes ocupados
  hasAnyPatientsInSlot(dayOfWeek: number, time: string): boolean {
    return this.hasWeeklyPatientsInSlot(dayOfWeek, time) || 
           this.hasBiweeklyPatientsInSlot(dayOfWeek, time);
  }

  // Obter todos os pacientes em um horário específico
  getPatientsInSlot(dayOfWeek: number, time: string): Patient[] {
    return this.allPatients.filter(patient => 
      patient.appointments.some(appointment => 
        appointment.dayOfWeek === dayOfWeek && 
        appointment.time === time
      )
    );
  }

  // Verificar se há pacientes quinzenais em um dia específico
  hasBiweeklyPatientsInDay(dayOfWeek: number): boolean {
    return this.allPatients.some(patient => 
      patient.scheduleType === 'biweekly' &&
      patient.appointments.some(appointment => 
        appointment.dayOfWeek === dayOfWeek
      )
    );
  }

  // Métodos de debug/teste
  createTestData(): void {
    const testPatient1 = this.patientService.addPatient({
      name: 'João Silva',
      phone: '(11) 99999-9999',
      cpf: '123.456.789-00',
      scheduleType: 'weekly',
      appointments: [
        {
          id: '1',
          dayOfWeek: 1, // Segunda
          time: '09:00',
          isBiweekly: false
        },
        {
          id: '2',
          dayOfWeek: 3, // Quarta
          time: '14:00',
          isBiweekly: false
        }
      ]
    });

    const testPatient2 = this.patientService.addPatient({
      name: 'Maria Santos',
      phone: '(11) 88888-8888',
      cpf: '987.654.321-00',
      scheduleType: 'biweekly',
      appointments: [
        {
          id: '3',
          dayOfWeek: 2, // Terça
          time: '10:00',
          isBiweekly: true,
          biweeklyWeek: 1
        },
        {
          id: '4',
          dayOfWeek: 4, // Quinta
          time: '15:00',
          isBiweekly: true,
          biweeklyWeek: 2
        }
      ]
    });

    console.log('Dados de teste criados:', { testPatient1, testPatient2 });
    this.loadPatients();
  }

  clearTestData(): void {
    this.patientService.clearAllData();
    this.loadPatients();
  }
}
