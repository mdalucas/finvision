import { Routes } from '@angular/router';
import { MainDashboard } from './views/main-dashboard/main-dashboard';
import { Calendar } from './views/calendar/calendar';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: MainDashboard },
  { path: 'calendar', component: Calendar },
  { path: '**', redirectTo: '/dashboard' }
];
