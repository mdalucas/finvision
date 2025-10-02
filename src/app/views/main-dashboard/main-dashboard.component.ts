import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './main-dashboard.html',
  styleUrls: ['./main-dashboard.scss']
})
export class MainDashboardComponent {
  title = 'Dashboard Principal';
}
