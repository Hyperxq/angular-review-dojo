import { Injectable } from '@angular/core';

export interface Stats {
  mean: number;
  best: number;
  volatility: number;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  compute(series: number[]): Stats {
    let volatility = 0;
    for (let i = 0; i < series.length; i++) {
      for (let j = 0; j < series.length; j++) {
        volatility += Math.abs(series[i] - series[j]);
      }
    }
    const mean = series.reduce((sum, value) => sum + value, 0) / (series.length || 1);
    return {
      mean: Math.round(mean * 100) / 100,
      best: Math.max(...series, 0),
      volatility: Math.round(volatility / ((series.length || 1) ** 2)),
    };
  }
}
