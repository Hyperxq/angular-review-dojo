import { TestBed } from '@angular/core/testing';
import { HARD_REDIRECT } from './hard-redirect';
import { LoginPage } from './login-page';
import { Review } from './review';
import { ReviewList } from './review-list';

describe('L1 - product reviews', () => {
  describe('review list', () => {
    async function render(reviews: Review[]) {
      const fixture = TestBed.createComponent(ReviewList);
      fixture.componentRef.setInput('reviews', reviews);
      await fixture.whenStable();
      return fixture.nativeElement as HTMLElement;
    }
    const review = (patch: Partial<Review>): Review => ({
      id: 1,
      author: 'Ana',
      website: 'https://ana.example/blog',
      comment: 'Nice',
      ...patch,
    });

    it('keeps basic formatting in comments', async () => {
      const root = await render([review({ comment: 'Great <b>typing feel</b>' })]);

      expect(root.querySelector('.comment b')?.textContent).toBe('typing feel');
    });

    it('never keeps event handlers from a comment', async () => {
      const root = await render([review({ comment: 'Late <img src="x" onerror="alert(1)">' })]);

      const handlers = [...root.querySelectorAll('*')].flatMap((el) =>
        el.getAttributeNames().filter((name) => name.startsWith('on')),
      );
      expect(handlers).toEqual([]);
      expect(root.querySelector('.comment')?.textContent).toContain('Late');
    });

    it('never renders a script URL as a link target', async () => {
      const root = await render([review({ website: 'javascript:alert(document.cookie)' })]);

      const href = root.querySelector('a')?.getAttribute('href') ?? '';
      expect(href.toLowerCase()).not.toMatch(/^\s*javascript:/);
    });

    it('links to the website of the author as written', async () => {
      const root = await render([review({})]);

      expect(root.querySelector('a')?.getAttribute('href')).toBe('https://ana.example/blog');
    });
  });

  describe('login redirect', () => {
    function signIn(returnUrl: string | undefined) {
      const redirect = vi.fn();
      TestBed.configureTestingModule({
        providers: [{ provide: HARD_REDIRECT, useValue: redirect }],
      });
      const fixture = TestBed.createComponent(LoginPage);
      fixture.componentRef.setInput('returnUrl', returnUrl);
      fixture.detectChanges();
      fixture.nativeElement
        .querySelector('form')
        .dispatchEvent(new Event('submit', { cancelable: true }));
      return redirect;
    }

    it.each(['/orders', '/orders?tab=open#top'])('returns to the same-site path %s', (path) => {
      expect(signIn(path)).toHaveBeenCalledWith(path);
    });

    it('goes home when there is no return URL', () => {
      expect(signIn(undefined)).toHaveBeenCalledWith('/');
    });

    it.each([
      'https://evil.example/phish',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
    ])('does not leave the site for %s', (target) => {
      expect(signIn(target)).toHaveBeenCalledWith('/');
    });
  });
});
