export interface Patient {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  scheduleType: 'weekly' | 'biweekly';
  appointments: Appointment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  dayOfWeek: number; // 0-6 (domingo a sábado)
  time: string; // "08:00", "09:00", etc. (intervalos de 1h)
  isBiweekly?: boolean; // se é quinzenal
  biweeklyWeek?: 1 | 2; // primeira ou segunda semana do mês
}

export interface ScheduleSlot {
  dayOfWeek: number;
  time: string;
  weekNumber: 1 | 2; // para quinzenais
  isOccupied: boolean;
  patient?: Patient;
  appointment?: Appointment;
}
