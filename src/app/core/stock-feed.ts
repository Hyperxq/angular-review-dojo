import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { StockChange } from './models';

/** Stand-in for the websocket that pushes live stock changes. */
@Injectable({ providedIn: 'root' })
export class StockFeed {
  readonly changes$ = new Subject<StockChange>();
}
