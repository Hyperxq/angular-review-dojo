import { Component } from '@angular/core';
import { CategoryList, FeaturedList } from './lists';
import { PriceEditor } from './price-editor';
import { StockSummary } from './stock-summary';
import { TextFit } from './text-fit';

@Component({
  selector: 'app-list-widgets',
  imports: [CategoryList, FeaturedList, StockSummary, PriceEditor, TextFit],
  template: `
    <app-category-list category="mice" />
    <app-featured-list />
    <app-stock-summary />
    <app-price-editor [price]="89" />
    <app-text-fit label="Quick order" />
  `,
})
export class ListWidgets {}
