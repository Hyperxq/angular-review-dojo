import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageTitle } from './page-title';

@Component({
  selector: 'app-page-layout',
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <header><h1>{{ pageTitle.title }}</h1></header>
    <main><ng-content /></main>
  `,
})
export class PageLayout {
  protected readonly pageTitle = inject(PageTitle);
}
