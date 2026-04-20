import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { TenantApiService } from '../data-access/tenant-api.service';

@Component({
  selector: 'app-tenant-group-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-group-create.component.html',
  styleUrl: './tenant-group-create.component.css'})
export class TenantGroupCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private tenantApi = inject(TenantApiService);

  isSubmitting = signal(false);
  groupId = signal<string | null>(null);
  isEditMode = computed(() => !!this.groupId());
  days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  selectedDays = signal<string[]>([]);
  showOwnedByDropdown = signal(false);
  showTeacherDropdown = signal(false);
  showGradeDropdown = signal(false);
  showSubjectDropdown = signal(false);
  showRoomDropdown = signal(false);

  teacherSearchQuery = signal('');
  gradeSearchQuery = signal('');
  subjectSearchQuery = signal('');
  roomSearchQuery = signal('');

  private isSuccess = false;
  private taskId = 'create-group-task';

  teachers = signal([
    { id: '1', name: 'Dr. Ahmed Zewail', subject: 'Physics' },
    { id: '2', name: 'Prof. Mona Helmy', subject: 'Mathematics' },
    { id: '3', name: 'Mr. Khaled Said', subject: 'Chemistry' },
    { id: '4', name: 'Ms. Fatma Ali', subject: 'Biology' },
    { id: '5', name: 'Dr. Mostafa El-Sayed', subject: 'Chemistry' },
    { id: '6', name: 'Prof. Farouk El-Baz', subject: 'Geology' },
  ]);

  grades = signal([
    { id: '1', name: 'Grade 10', level: 'Secondary' },
    { id: '2', name: 'Grade 11', level: 'Secondary' },
    { id: '3', name: 'Grade 12', level: 'Secondary' },
    { id: '4', name: 'Primary 1', level: 'Primary' },
    { id: '5', name: 'Primary 2', level: 'Primary' },
  ]);

  subjects = signal([
    { id: '1', name: 'Physics' },
    { id: '2', name: 'Mathematics' },
    { id: '3', name: 'Chemistry' },
    { id: '4', name: 'Biology' },
    { id: '5', name: 'English' },
    { id: '6', name: 'Arabic' },
  ]);

  rooms = signal([
    { id: '1', name: 'Lab 101', type: 'Laboratory' },
    { id: '2', name: 'Room 204', type: 'Classroom' },
    { id: '3', name: 'Virtual Room A', type: 'Virtual' },
    { id: '4', name: 'Main Hall', type: 'Auditorium' },
  ]);

  filteredTeachers = computed(() => {
    const query = this.teacherSearchQuery().toLowerCase();
    if (!query) return this.teachers();
    return this.teachers().filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.subject.toLowerCase().includes(query)
    );
  });

  filteredGrades = computed(() => {
    const query = this.gradeSearchQuery().toLowerCase();
    if (!query) return this.grades();
    return this.grades().filter(g => 
      g.name.toLowerCase().includes(query) || 
      g.level.toLowerCase().includes(query)
    );
  });

  filteredSubjects = computed(() => {
    const query = this.subjectSearchQuery().toLowerCase();
    if (!query) return this.subjects();
    return this.subjects().filter(s => s.name.toLowerCase().includes(query));
  });

  filteredRooms = computed(() => {
    const query = this.roomSearchQuery().toLowerCase();
    if (!query) return this.rooms();
    return this.rooms().filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.type.toLowerCase().includes(query)
    );
  });

  groupForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    grade: ['Grade 12', Validators.required],
    subject: ['Physics', Validators.required],
    teacher: ['Dr. Ahmed Zewail', Validators.required],
    ownedBy: ['', Validators.required],
    room: ['Lab 101', Validators.required],
    capacity: [25, [Validators.required, Validators.min(1)]],
    isFixedTime: [true],
    startTime: ['10:00', Validators.required],
    duration: [90, Validators.required],
    daySchedules: this.fb.group({}),
    fees: [500, Validators.required],
    autoInvoice: [true],
    allowSelfEnroll: [false],
    hasSpecificDuration: [false],
    startDate: [''],
    endDate: [''],
    requireApproval: [true],
    isActive: [true]
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.groupId.set(id);
      this.taskId = `edit-group-${id}`;
      // Mock pre-fill for edit mode
      this.groupForm.patchValue({
        name: 'Physics G12-A',
        grade: 'Grade 12',
        subject: 'Physics',
        teacher: 'Dr. Ahmed Zewail',
        room: 'Lab 101',
        capacity: 30,
        fees: 500
      });
      this.selectedDays.set(['Monday', 'Wednesday']);
    }

    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      const data = savedTask.data as Record<string, unknown>;
      this.groupForm.patchValue(data);
      if (data['scheduleDays']) {
        this.selectedDays.set(data['scheduleDays'] as string[]);
        // Restore variable schedules if needed
        if (data['isFixedTime'] === false) {
          this.onTimeTypeChange(false);
          if (data['daySchedules']) {
            const daySchedules = this.groupForm.get('daySchedules') as FormGroup;
            if (daySchedules) {
              daySchedules.patchValue(data['daySchedules'] as Record<string, unknown>);
            }
          }
        }
      }
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  ngOnDestroy() {
    // Save task if form has data and was not successfully submitted
    const value = this.groupForm.value;
    const hasData = value.name !== '' || value.ownedBy !== '';
    
    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `${this.isEditMode() ? 'Editing' : 'Creating'} Group: ${value.name || 'New Group'}`,
        route: this.router.url,
        data: {
          ...value,
          scheduleDays: this.selectedDays()
        }
      });
    }
  }

  onDayToggle(day: string) {
    const current = this.selectedDays();
    let newDays: string[];
    
    if (current.includes(day)) {
      newDays = current.filter(d => d !== day);
      // Remove control if exists
      const daySchedules = this.groupForm.get('daySchedules') as FormGroup;
      if (daySchedules && daySchedules.contains(day)) {
        daySchedules.removeControl(day);
      }
    } else {
      newDays = [...current, day];
      // Add control if variable time
      if (!this.groupForm.get('isFixedTime')?.value) {
         const daySchedules = this.groupForm.get('daySchedules') as FormGroup;
         if (daySchedules && !daySchedules.contains(day)) {
           daySchedules.addControl(day, this.fb.group({
              startTime: ['', Validators.required],
              endTime: ['', Validators.required]
           }));
         }
      }
    }
    this.selectedDays.set(newDays);
  }

  onTimeTypeChange(isFixed: boolean) {
    // We don't patchValue here because the radio button binding handles it, 
    // but if called programmatically (like in ngOnInit), we might need to.
    // However, the radio (change) event happens after the value change usually.
    // Let's ensure consistency.
    
    const daySchedules = this.groupForm.get('daySchedules') as FormGroup;
    if (!daySchedules) return;
    
    if (!isFixed) {
      // Add controls for all selected days
      this.selectedDays().forEach(day => {
        if (!daySchedules.contains(day)) {
          daySchedules.addControl(day, this.fb.group({
            startTime: ['', Validators.required],
            endTime: ['', Validators.required]
          }));
        }
      });
      // Remove global validators
      this.groupForm.get('startTime')?.clearValidators();
      this.groupForm.get('duration')?.clearValidators();
    } else {
      // Clear variable controls
      Object.keys(daySchedules.controls).forEach(key => daySchedules.removeControl(key));
      // Add global validators
      this.groupForm.get('startTime')?.setValidators(Validators.required);
      this.groupForm.get('duration')?.setValidators(Validators.required);
    }
    this.groupForm.get('startTime')?.updateValueAndValidity();
    this.groupForm.get('duration')?.updateValueAndValidity();
  }

  toggleOwnedByDropdown() {
    this.showOwnedByDropdown.update(v => !v);
    if (this.showOwnedByDropdown()) {
      this.closeAllDropdownsExcept('ownedBy');
    }
  }

  selectOwnedBy(value: string) {
    this.groupForm.patchValue({ ownedBy: value });
    this.showOwnedByDropdown.set(false);
  }

  toggleTeacherDropdown() {
    this.showTeacherDropdown.update(v => !v);
    if (this.showTeacherDropdown()) {
      this.closeAllDropdownsExcept('teacher');
      this.teacherSearchQuery.set('');
    }
  }

  selectTeacher(name: string) {
    this.groupForm.patchValue({ teacher: name });
    this.showTeacherDropdown.set(false);
  }

  toggleGradeDropdown() {
    this.showGradeDropdown.update(v => !v);
    if (this.showGradeDropdown()) {
      this.closeAllDropdownsExcept('grade');
      this.gradeSearchQuery.set('');
    }
  }

  selectGrade(name: string) {
    this.groupForm.patchValue({ grade: name });
    this.showGradeDropdown.set(false);
  }

  toggleSubjectDropdown() {
    this.showSubjectDropdown.update(v => !v);
    if (this.showSubjectDropdown()) {
      this.closeAllDropdownsExcept('subject');
      this.subjectSearchQuery.set('');
    }
  }

  selectSubject(name: string) {
    this.groupForm.patchValue({ subject: name });
    this.showSubjectDropdown.set(false);
  }

  toggleRoomDropdown() {
    this.showRoomDropdown.update(v => !v);
    if (this.showRoomDropdown()) {
      this.closeAllDropdownsExcept('room');
      this.roomSearchQuery.set('');
    }
  }

  selectRoom(name: string) {
    this.groupForm.patchValue({ room: name });
    this.showRoomDropdown.set(false);
  }

  private closeAllDropdownsExcept(except: string) {
    if (except !== 'ownedBy') this.showOwnedByDropdown.set(false);
    if (except !== 'teacher') this.showTeacherDropdown.set(false);
    if (except !== 'grade') this.showGradeDropdown.set(false);
    if (except !== 'subject') this.showSubjectDropdown.set(false);
    if (except !== 'room') this.showRoomDropdown.set(false);
  }

  onCancel() {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.router.navigate(['/tenant/groups']);
  }

  onSubmit() {
    if (this.groupForm.valid) {
      this.isSubmitting.set(true);
      
      const payload = {
        ...this.groupForm.value,
        scheduleDays: this.selectedDays()
      };

      this.tenantApi.createOrUpdateGroup(payload).subscribe((response) => {
        console.log('Group Created:', response);
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.isSubmitting.set(false);
        this.router.navigate(['/tenant/groups']);
      });
    }
  }
}
