import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

export function provideFeedApp() {
  return [provideHttpClient(withFetch()), provideClientHydration()];
}
