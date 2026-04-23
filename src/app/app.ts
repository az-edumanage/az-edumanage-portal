import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import { DashboardService } from './core/services/dashboard.service';
import { I18nService } from './core/services/i18n.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly dashboardService = inject(DashboardService);
  private readonly i18nService = inject(I18nService);

  constructor() {
    this.dashboardService.initTheme();
    this.i18nService.initLanguage();
  }
}
