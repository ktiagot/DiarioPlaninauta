import { Component } from '@angular/core';

import { PageHeaderComponent } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-regras',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './regras.html',
  styleUrl: './regras.scss',
})
export class RegrasComponent {}
