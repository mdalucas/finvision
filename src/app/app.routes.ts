import { Routes } from '@angular/router';
import { MainDashboardComponent } from './views/main-dashboard/main-dashboard.component';
import { CalendarComponent } from './views/calendar/calendar.component';
import { InstallmentsComponent } from './views/installments/installments.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: MainDashboardComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'installments', component: InstallmentsComponent },
  { path: '**', redirectTo: '/dashboard' }
];
