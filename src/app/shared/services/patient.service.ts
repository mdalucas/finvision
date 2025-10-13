import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Patient, Appointment, ScheduleSlot } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly STORAGE_KEY = 'finvision_patients';
  private patientsSubject = new BehaviorSubject<Patient[]>([]);
  public patients$ = this.patientsSubject.asObservable();

  constructor() {
    this.clearOldData();
    this.loadPatients();
  }

  private loadPatients(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const rawPatients = JSON.parse(stored);
        const patients = this.normalizePatientData(rawPatients);
        this.patientsSubject.next(patients);
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      this.patientsSubject.next([]);
    }
  }

  private savePatients(patients: Patient[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(patients));
      this.patientsSubject.next(patients);
    } catch (error) {
      console.error('Erro ao salvar pacientes:', error);
    }
  }

  getPatients(): Observable<Patient[]> {
    return this.patients$;
  }

  getPatientsList(): Patient[] {
    return this.patientsSubject.value;
  }

  addPatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Patient {
    const newPatient: Patient = {
      ...patient,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const patients = [...this.patientsSubject.value, newPatient];
    this.savePatients(patients);
    return newPatient;
  }

  updatePatient(id: string, updates: Partial<Patient>): Patient | null {
    const patients = this.patientsSubject.value;
    const index = patients.findIndex(p => p.id === id);
    
    if (index === -1) return null;

    const updatedPatient = {
      ...patients[index],
      ...updates,
      id, // garantir que o ID não seja alterado
      updatedAt: new Date()
    };

    patients[index] = updatedPatient;
    this.savePatients(patients);
    return updatedPatient;
  }

  deletePatient(id: string): boolean {
    const patients = this.patientsSubject.value.filter(p => p.id !== id);
    this.savePatients(patients);
    return patients.length < this.patientsSubject.value.length;
  }

  getPatientById(id: string): Patient | null {
    return this.patientsSubject.value.find(p => p.id === id) || null;
  }

  // Gerar slots de horários para o modal de agenda
  generateScheduleSlots(): ScheduleSlot[] {
    const slots: ScheduleSlot[] = [];
    const startHour = 8;
    const endHour = 20;
    
    // Gerar para as próximas 2 semanas (apenas dias úteis: 1-5)
    for (let week = 1; week <= 2; week++) {
      const weekNumber = week as 1 | 2;
      for (let day = 1; day <= 5; day++) { // 1 = segunda, 5 = sexta
        for (let hour = startHour; hour < endHour; hour++) {
          const time = `${hour.toString().padStart(2, '0')}:00`;
          
          // Verificar se este slot está ocupado
          const occupiedPatient = this.findPatientInSlot(day, time, weekNumber);
          
          slots.push({
            dayOfWeek: day,
            time,
            weekNumber,
            isOccupied: !!occupiedPatient,
            patient: occupiedPatient?.patient,
            appointment: occupiedPatient?.appointment
          });
        }
      }
    }
    
    return slots;
  }

  private findPatientInSlot(dayOfWeek: number, time: string, weekNumber: 1 | 2): { patient: Patient, appointment: Appointment } | null {
    const patients = this.patientsSubject.value;
    
    for (const patient of patients) {
      for (const appointment of patient.appointments) {
        // Normalizar formatos de horário para comparação
        const normalizedTime = time.padStart(5, '0'); // "8:00" -> "08:00"
        const normalizedAppointmentTime = appointment.time.padStart(5, '0');
        
        if (appointment.dayOfWeek === dayOfWeek && normalizedAppointmentTime === normalizedTime) {
          if (patient.scheduleType === 'weekly') {
            return { patient, appointment };
          } else if (patient.scheduleType === 'biweekly' && appointment.biweeklyWeek === weekNumber) {
            return { patient, appointment };
          }
        }
      }
    }
    
    return null;
  }

  // Verificar se um slot está disponível
  isSlotAvailable(dayOfWeek: number, time: string, weekNumber: 1 | 2, excludePatientId?: string): boolean {
    const patients = this.patientsSubject.value;
    
    for (const patient of patients) {
      if (excludePatientId && patient.id === excludePatientId) continue;
      
      for (const appointment of patient.appointments) {
        if (appointment.dayOfWeek === dayOfWeek && appointment.time === time) {
          if (patient.scheduleType === 'weekly') {
            return false;
          } else if (patient.scheduleType === 'biweekly' && appointment.biweeklyWeek === weekNumber) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  // Adicionar horário a um paciente
  addAppointmentToPatient(patientId: string, appointment: Omit<Appointment, 'id'>): boolean {
    const patient = this.getPatientById(patientId);
    if (!patient) return false;

    const newAppointment: Appointment = {
      ...appointment,
      id: this.generateId()
    };

    const updatedPatient = {
      ...patient,
      appointments: [...patient.appointments, newAppointment],
      updatedAt: new Date()
    };

    return this.updatePatient(patientId, updatedPatient) !== null;
  }

  // Normalizar dados de pacientes existentes (para compatibilidade)
  private normalizePatientData(patients: any[]): Patient[] {
    return patients.map(patient => ({
      ...patient,
      createdAt: new Date(patient.createdAt),
      updatedAt: new Date(patient.updatedAt),
      appointments: patient.appointments.map((appointment: any) => ({
        ...appointment,
        id: appointment.id || this.generateId() // Garantir que tenha ID
      }))
    }));
  }

  // Remover horário de um paciente
  removeAppointmentFromPatient(patientId: string, appointmentId: string): boolean {
    const patient = this.getPatientById(patientId);
    if (!patient) return false;

    const updatedPatient = {
      ...patient,
      appointments: patient.appointments.filter(a => a.id !== appointmentId),
      updatedAt: new Date()
    };

    return this.updatePatient(patientId, updatedPatient) !== null;
  }

  // Limpar todos os appointments de um paciente específico
  clearPatientAppointments(patientId: string): boolean {
    const patient = this.getPatientById(patientId);
    if (!patient) {
      return false;
    }

    const updatedPatient = {
      ...patient,
      appointments: [],
      updatedAt: new Date()
    };

    return this.updatePatient(patientId, updatedPatient) !== null;
  }

  // Limpar todos os dados
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.patientsSubject.next([]);
  }

  // Limpar localStorage existente (transações antigas)
  clearOldData(): void {
    // Limpar dados antigos de transações se existirem
    const oldKeys = ['finvision_transactions', 'finvision_data'];
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`Dados antigos removidos: ${key}`);
      }
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Utilitários para exibição
  getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayOfWeek];
  }

  getWeekDates(weekNumber: 1 | 2): { startDate: Date, endDate: Date } {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc.
    
    // Calcular o domingo da semana atual
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - dayOfWeek);
    
    // Calcular o domingo da semana desejada
    const targetSunday = new Date(currentSunday);
    targetSunday.setDate(currentSunday.getDate() + (weekNumber - 1) * 7);
    
    // Calcular o sábado da semana desejada
    const targetSaturday = new Date(targetSunday);
    targetSaturday.setDate(targetSunday.getDate() + 6);
    
    return { 
      startDate: targetSunday, 
      endDate: targetSaturday 
    };
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Calcular ganho mensal estimado
  getEstimatedMonthlyIncome(): number {
    const patients = this.patientsSubject.value;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let totalIncome = 0;

    patients.forEach(patient => {
      if (patient.appointments.length === 0 || !patient.consultationValue) {
        return;
      }

      // Calcular quantas consultas o paciente terá no mês atual
      const consultationsThisMonth = this.calculateConsultationsThisMonth(patient, currentMonth, currentYear);
      totalIncome += consultationsThisMonth * patient.consultationValue;
    });

    return totalIncome;
  }

  private calculateConsultationsThisMonth(patient: Patient, month: number, year: number): number {
    const appointments = patient.appointments;
    if (appointments.length === 0) return 0;

    // Obter o primeiro e último dia do mês
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let consultations = 0;

    appointments.forEach(appointment => {
      // Calcular quantas vezes este appointment ocorre no mês
      const dayOfWeek = appointment.dayOfWeek;
      
      // Encontrar todas as datas deste dia da semana no mês
      for (let day = firstDay.getDate(); day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        
        if (date.getDay() === dayOfWeek) {
          if (patient.scheduleType === 'weekly') {
            consultations++;
          } else if (patient.scheduleType === 'biweekly') {
            // Para quinzenais, verificar se é a semana correta
            const weekOfMonth = Math.ceil(day / 7);
            const isCorrectWeek = (weekOfMonth % 2 === 1 && appointment.biweeklyWeek === 1) ||
                                 (weekOfMonth % 2 === 0 && appointment.biweeklyWeek === 2);
            if (isCorrectWeek) {
              consultations++;
            }
          }
        }
      }
    });

    return consultations;
  }
}
