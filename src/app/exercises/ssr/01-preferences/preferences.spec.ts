import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { SERVER_PLATFORM, stubBrowserGlobals } from '../../../core/server-env';
import { Preferences } from './preferences';

describe('L1 - preferences panel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('on the server', () => {
    async function renderOnServer() {
      TestBed.configureTestingModule({ providers: [SERVER_PLATFORM] });
      TestBed.inject(DOCUMENT);
      stubBrowserGlobals();
      const fixture = TestBed.createComponent(Preferences);
      await fixture.whenStable();
      return fixture;
    }

    it('renders with the defaults instead of failing', async () => {
      const fixture = await renderOnServer();
      const root = fixture.nativeElement as HTMLElement;

      expect(root.querySelector<HTMLInputElement>('input')?.checked).toBe(false);
      expect(root.querySelector('.viewport')?.textContent).not.toContain('NaN');
    });

    it('sets the page title through the Title service', async () => {
      await renderOnServer();

      expect(TestBed.inject(Title).getTitle()).toBe('Preferences');
    });
  });

  describe('in the browser', () => {
    beforeEach(() => {
      window.matchMedia = ((query: string) => ({
        matches: false,
        media: query,
      })) as typeof window.matchMedia;
    });

    it('restores the saved theme after the first render', async () => {
      localStorage.setItem('theme', 'dark');
      const fixture = TestBed.createComponent(Preferences);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('input').checked).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('shows the real viewport width and follows resizes', async () => {
      const fixture = TestBed.createComponent(Preferences);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.viewport').textContent).toContain(
        `${window.innerWidth}px`,
      );

      vi.stubGlobal('innerWidth', 640);
      window.dispatchEvent(new Event('resize'));
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.viewport').textContent).toContain('640px');
    });

    it('saves the choice when toggled', async () => {
      const fixture = TestBed.createComponent(Preferences);
      await fixture.whenStable();

      fixture.nativeElement.querySelector('input').click();
      await fixture.whenStable();

      expect(localStorage.getItem('theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
