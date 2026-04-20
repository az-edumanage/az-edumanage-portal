import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskService);
    service.clearAll();
  });

  it('should add and retrieve a task', () => {
    service.addTask({
      id: 'task-1',
      type: 'form',
      label: 'Task 1',
      route: '/owner/tenants/create',
      data: { field: 'value' },
    });

    const task = service.getTask('task-1');
    expect(task).toBeDefined();
    expect(task?.label).toBe('Task 1');
  });

  it('should update existing task with same id', () => {
    service.addTask({
      id: 'task-1',
      type: 'form',
      label: 'Task 1',
      route: '/owner/tenants/create',
      data: { field: 'value-1' },
    });

    service.addTask({
      id: 'task-1',
      type: 'form',
      label: 'Task 1 Updated',
      route: '/owner/tenants/create',
      data: { field: 'value-2' },
    });

    expect(service.activeTasks().length).toBe(1);
    expect(service.getTask('task-1')?.label).toBe('Task 1 Updated');
  });

  it('should remove task by id', () => {
    service.addTask({
      id: 'task-1',
      type: 'form',
      label: 'Task 1',
      route: '/owner/tenants/create',
      data: {},
    });

    service.removeTask('task-1');

    expect(service.getTask('task-1')).toBeUndefined();
  });
});
