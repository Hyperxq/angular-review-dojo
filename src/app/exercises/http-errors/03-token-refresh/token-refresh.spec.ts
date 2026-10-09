import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthError, AuthService, provideAuthHttp } from './auth';

describe('L3 - token refresh', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideAuthHttp(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  const expired = { status: 401, statusText: 'Unauthorized' };
  const tick = () => new Promise((resolve) => setTimeout(resolve));

  function call(url: string) {
    const result = { value: undefined as unknown, error: undefined as unknown };
    http.get(url).subscribe({ next: (v) => (result.value = v), error: (e) => (result.error = e) });
    return result;
  }

  it('sends the current token', () => {
    call('/api/a');

    const req = backend.expectOne('/api/a');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    req.flush({});
  });

  it('passes other errors through without refreshing', () => {
    const result = call('/api/a');

    backend.expectOne('/api/a').flush('boom', { status: 500, statusText: 'Server Error' });

    backend.expectNone('/auth/refresh');
    expect((result.error as { status: number }).status).toBe(500);
  });

  it('refreshes once and replays the request with the new token', () => {
    const result = call('/api/a');
    backend.expectOne('/api/a').flush('', expired);

    backend.expectOne('/auth/refresh').flush({ token: 'access-2' });

    const replay = backend.expectOne('/api/a');
    expect(replay.request.headers.get('Authorization')).toBe('Bearer access-2');
    replay.flush({ ok: true });
    expect(result.value).toEqual({ ok: true });
    expect(auth.token()).toBe('access-2');
  });

  it('shares one refresh between concurrent requests and replays them all', () => {
    const results = ['/api/a', '/api/b', '/api/c'].map(call);
    for (const url of ['/api/a', '/api/b', '/api/c']) {
      backend.expectOne(url).flush('', expired);
    }

    const refreshes = backend.match('/auth/refresh');
    expect(refreshes).toHaveLength(1);
    refreshes[0].flush({ token: 'access-2' });

    for (const url of ['/api/a', '/api/b', '/api/c']) {
      const replay = backend.expectOne(url);
      expect(replay.request.headers.get('Authorization')).toBe('Bearer access-2');
      replay.flush({ url });
    }
    expect(results.map((r) => r.value)).toEqual([
      { url: '/api/a' },
      { url: '/api/b' },
      { url: '/api/c' },
    ]);
  });

  it('refreshes again for a later expiry', () => {
    call('/api/a');
    backend.expectOne('/api/a').flush('', expired);
    backend.expectOne('/auth/refresh').flush({ token: 'access-2' });
    backend.expectOne('/api/a').flush({});

    call('/api/b');
    backend.expectOne('/api/b').flush('', expired);

    backend.expectOne('/auth/refresh').flush({ token: 'access-3' });
    expect(backend.expectOne('/api/b').request.headers.get('Authorization')).toBe(
      'Bearer access-3',
    );
  });

  it('gives up once when the refresh fails: everyone gets the error and the session ends', async () => {
    const results = ['/api/a', '/api/b'].map(call);
    backend.expectOne('/api/a').flush('', expired);
    backend.expectOne('/api/b').flush('', expired);

    backend.expectOne('/auth/refresh').flush('', expired);
    await tick();

    backend.expectNone('/auth/refresh');
    for (const result of results) {
      expect(result.error).toBeInstanceOf(AuthError);
      expect((result.error as AuthError).reason).toBe('expired');
    }
    expect(auth.token()).toBeNull();
  });

  it('does not repeat a replayed request that is refused again', () => {
    const result = call('/api/a');
    backend.expectOne('/api/a').flush('', expired);
    backend.expectOne('/auth/refresh').flush({ token: 'access-2' });

    backend.expectOne('/api/a').flush('', expired);

    backend.expectNone('/auth/refresh');
    expect(result.error).toBeDefined();
  });

  describe('signing out', () => {
    it('cancels a refresh in flight and cannot be undone by it', () => {
      const result = call('/api/a');
      backend.expectOne('/api/a').flush('', expired);
      const refresh = backend.expectOne('/auth/refresh');

      auth.logout();

      expect(refresh.cancelled).toBe(true);
      expect(auth.token()).toBeNull();
      expect((result.error as AuthError).reason).toBe('ended');
    });

    it('cancels requests that are still in flight', () => {
      const result = call('/api/a');
      const req = backend.expectOne('/api/a');

      auth.logout();

      expect(req.cancelled).toBe(true);
      expect(result.error).toBeInstanceOf(AuthError);
      expect((result.error as AuthError).reason).toBe('ended');
    });
  });
});
