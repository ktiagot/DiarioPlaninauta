import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, PageHeaderComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingComponent {}
