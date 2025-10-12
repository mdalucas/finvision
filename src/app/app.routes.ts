import { Routes } from '@angular/router';
import { MainDashboard } from './views/main-dashboard/main-dashboard';
import { Calendar } from './views/calendar/calendar';
import { WeeklyGrid } from './views/weekly-grid/weekly-grid';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: MainDashboard },
  { path: 'calendar', component: Calendar },
  { path: 'weekly-grid', component: WeeklyGrid },
  { path: '**', redirectTo: '/dashboard' }
];
