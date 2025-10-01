import { Routes } from '@angular/router';
import { MainDashboard } from './views/main-dashboard/main-dashboard';
import { Installments } from './views/installments/installments';
import { Calendar } from './views/calendar/calendar';

export const routes: Routes = [
    {
        path: '',
        component: MainDashboard
    },
    {
        path: 'installments',
        component: Installments
    },
    {
        path: 'calendar',
        component: Calendar
    },

];
