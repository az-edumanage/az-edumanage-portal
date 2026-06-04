import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TenantChangePasswordComponent } from './tenant-change-password.component';
import { AuthApiService } from '../../../../core/auth/auth-api.service';

describe('TenantChangePasswordComponent', () => {
  let authApi: {
    changeInitialPassword: ReturnType<typeof vi.fn>;
    me: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authApi = {
      changeInitialPassword: vi.fn().mockResolvedValue({ passwordChangeRequired: false }),
      me: vi.fn().mockResolvedValue({ passwordChangeRequired: false }),
    };
    router = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      imports: [TenantChangePasswordComponent],
      providers: [
        { provide: AuthApiService, useValue: authApi },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('blocks mismatched passwords before calling the API', async () => {
    const fixture = TestBed.createComponent(TenantChangePasswordComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      newPassword: 'NewPassword123',
      confirmPassword: 'OtherPassword123',
    });

    await component.save();

    expect(component.form.errors).toEqual({ passwordMismatch: true });
    expect(authApi.changeInitialPassword).not.toHaveBeenCalled();
  });

  it('shows saving and success modal states before tenant overview navigation', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(TenantChangePasswordComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    });

    const savePromise = component.save();
    expect(component.status()).toBe('saving');
    expect(component.showBlockingModal()).toBe(true);
    expect(component.modalMessage()).toBe('جاري تحديث كلمة المرور...');

    await Promise.resolve();
    await Promise.resolve();
    expect(component.status()).toBe('success');
    expect(component.modalMessage()).toBe('تم تحديث كلمة المرور بنجاح');

    await vi.advanceTimersByTimeAsync(1200);
    await savePromise;

    expect(authApi.changeInitialPassword).toHaveBeenCalledWith('NewPassword123', 'NewPassword123');
    expect(authApi.me).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/tenant/overview'], { replaceUrl: true });
    vi.useRealTimers();
  });

  it('keeps the user on the page when password change fails', async () => {
    authApi.changeInitialPassword.mockRejectedValue(new Error('failed'));
    const fixture = TestBed.createComponent(TenantChangePasswordComponent);
    const component = fixture.componentInstance;

    component.form.setValue({
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    });

    await component.save();

    expect(component.status()).toBe('error');
    expect(component.errorMessage()).toBe('Unable to change password. Please try again.');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
