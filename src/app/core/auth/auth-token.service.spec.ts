import { TestBed } from '@angular/core/testing';
import { AuthTokenService } from './auth-token.service';

describe('AuthTokenService', () => {
  let service: AuthTokenService;
  let getItemSpy: ReturnType<typeof vi.spyOn>;
  let setItemSpy: ReturnType<typeof vi.spyOn>;
  let removeItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthTokenService],
    });
    service = TestBed.inject(AuthTokenService);
  });

  afterEach(() => {
    getItemSpy?.mockRestore();
    setItemSpy?.mockRestore();
    removeItemSpy?.mockRestore();
    localStorage.clear();
  });

  it('stores and reads tokens from local storage', () => {
    service.setToken('tenant-token');

    expect(service.getToken()).toBe('tenant-token');
    expect(localStorage.getItem('beedu.auth.token')).toBe('tenant-token');
  });

  it('keeps the current login usable when local storage writes fail', () => {
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    service.setToken('tenant-token');

    expect(service.getToken()).toBe('tenant-token');
  });

  it('clears the fallback token with the stored token', () => {
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    service.setToken('tenant-token');
    service.clearToken();

    expect(service.getToken()).toBeNull();
  });
});
