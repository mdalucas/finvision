import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-installments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './installments.html',
  styleUrls: ['./installments.scss']
})
export class InstallmentsComponent {
  title = 'Gestão de Parcelas';
}
