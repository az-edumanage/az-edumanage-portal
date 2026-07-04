import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TenantStudentsDataService } from '../../data-access/tenant-students-data.service';
import { TenantParent } from '../../models/tenant-students.models';
import { TenantParentsComponent } from './tenant-parents.component';

describe('TenantParentsComponent', () => {
  let fixture: ComponentFixture<TenantParentsComponent>;
  let data: {
    loadParents: ReturnType<typeof vi.fn>;
    createParent: ReturnType<typeof vi.fn>;
    updateParent: ReturnType<typeof vi.fn>;
    deleteParent: ReturnType<typeof vi.fn>;
    changeParentPassword: ReturnType<typeof vi.fn>;
  };

  const parents: TenantParent[] = [
    {
      id: 'parent-user-1',
      appUserId: 'parent-user-1',
      name: 'Mohamed Hussein',
      phone: '01007381138',
      email: 'parent@example.com',
      notifyParent: true,
      students: [{ id: 'student-1', name: 'Hussein Mohamed', grade: 'Grade 5' }],
    },
  ];

  beforeEach(async () => {
    data = {
      loadParents: vi.fn().mockReturnValue(of(parents)),
      createParent: vi.fn().mockReturnValue(of({
        id: 'parent-user-2',
        appUserId: 'parent-user-2',
        name: 'New Parent',
        phone: '01000000000',
        email: '',
        notifyParent: false,
        students: [],
      })),
      updateParent: vi.fn().mockReturnValue(of({
        id: 'parent-user-1',
        appUserId: 'parent-user-1',
        name: 'Mohamed Updated',
        phone: '01000000001',
        email: 'updated@example.com',
        notifyParent: true,
        students: [{ id: 'student-1', name: 'Hussein Mohamed', grade: 'Grade 5' }],
      })),
      deleteParent: vi.fn().mockReturnValue(of(void 0)),
      changeParentPassword: vi.fn().mockReturnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [TenantParentsComponent],
      providers: [
        provideRouter([]),
        { provide: TenantStudentsDataService, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantParentsComponent);
    fixture.detectChanges();
  });

  it('renders an action column with a change password icon', () => {
    const text = fixture.nativeElement.textContent as string;
    const button = fixture.nativeElement.querySelector('button[title="Change Password"]') as HTMLButtonElement;

    expect(text).toContain('Actions');
    expect(button).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button[title="Edit Parent"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button[title="Delete Parent"]')).not.toBeNull();
    expect(text).toContain('Page 1 of 1');
  });

  it('opens the parent password modal from the row action', () => {
    const button = fixture.nativeElement.querySelector('button[title="Change Password"]') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Change Password');
    expect(text).toContain('Mohamed Hussein');
    expect(fixture.nativeElement.querySelector('#parent-new-password')).not.toBeNull();
  });

  it('submits a password change for the selected parent account', () => {
    const button = fixture.nativeElement.querySelector('button[title="Change Password"]') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#parent-new-password') as HTMLInputElement;
    input.value = 'Parent123!';
    input.dispatchEvent(new Event('input'));

    const form = fixture.nativeElement.querySelector('.tenant-parents-password-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    expect(data.changeParentPassword).toHaveBeenCalledWith('parent-user-1', 'Parent123!');
  });

  it('opens the add parent modal from the header action', () => {
    const button = fixture.nativeElement.querySelector('.tenant-parents-add') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Add Parent');
    expect(fixture.nativeElement.querySelector('#parent-full-name')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#parent-username')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#parent-password')).not.toBeNull();
  });

  it('submits a new parent login account', () => {
    const button = fixture.nativeElement.querySelector('.tenant-parents-add') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    const setInput = (selector: string, value: string) => {
      const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    setInput('#parent-full-name', 'New Parent');
    setInput('#parent-phone', '01000000000');
    setInput('#parent-email', '');
    setInput('#parent-username', 'new.parent');
    setInput('#parent-password', 'Parent123!');

    const form = fixture.nativeElement.querySelector('.tenant-parents-add-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    expect(data.createParent).toHaveBeenCalledWith({
      fullName: 'New Parent',
      phone: '01000000000',
      email: '',
      username: 'new.parent',
      password: 'Parent123!',
    });
  });

  it('opens edit modal with current parent data and submits changes', () => {
    const button = fixture.nativeElement.querySelector('button[title="Edit Parent"]') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector('#parent-edit-full-name') as HTMLInputElement;
    const phoneInput = fixture.nativeElement.querySelector('#parent-edit-phone') as HTMLInputElement;
    const emailInput = fixture.nativeElement.querySelector('#parent-edit-email') as HTMLInputElement;
    expect(nameInput.value).toBe('Mohamed Hussein');
    expect(phoneInput.value).toBe('01007381138');
    expect(emailInput.value).toBe('parent@example.com');

    nameInput.value = 'Mohamed Updated';
    nameInput.dispatchEvent(new Event('input'));
    phoneInput.value = '01000000001';
    phoneInput.dispatchEvent(new Event('input'));
    emailInput.value = 'updated@example.com';
    emailInput.dispatchEvent(new Event('input'));

    const form = fixture.nativeElement.querySelector('#parent-edit-full-name')?.closest('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    expect(data.updateParent).toHaveBeenCalledWith('parent-user-1', {
      fullName: 'Mohamed Updated',
      phone: '01000000001',
      email: 'updated@example.com',
    });
  });

  it('opens delete confirmation and deletes the selected parent', () => {
    const button = fixture.nativeElement.querySelector('button[title="Delete Parent"]') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Delete Parent');
    expect(text).toContain('Mohamed Hussein');

    const deleteButton = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((candidate) => (candidate as HTMLButtonElement).textContent?.includes('Delete Parent')) as HTMLButtonElement;
    deleteButton.click();

    expect(data.deleteParent).toHaveBeenCalledWith('parent-user-1');
  });
});
