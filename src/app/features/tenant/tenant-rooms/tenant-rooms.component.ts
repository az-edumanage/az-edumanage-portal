import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';

interface Room {
  id: string;
  name: string;
  type: 'Classroom' | 'Laboratory' | 'Virtual' | 'Auditorium';
  capacity: number;
  status: 'Available' | 'Occupied' | 'Maintenance';
  equipment: string[];
}

@Component({
  selector: 'app-tenant-rooms',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-rooms.component.html',
})
export class TenantRoomsComponent {
  private fb = inject(FormBuilder);

  searchQuery = signal('');
  showFilterPanel = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');

  filterForm = this.fb.group({
    type: [''],
    status: [''],
    sortBy: ['name']
  });

  filterValues = toSignal(
    this.filterForm.valueChanges.pipe(startWith(this.filterForm.value)),
    { initialValue: this.filterForm.value }
  );

  rooms = signal<Room[]>([
    { id: '1', name: 'Room 101', type: 'Classroom', capacity: 30, status: 'Available', equipment: ['Projector', 'AC', 'Whiteboard'] },
    { id: '2', name: 'Physics Lab', type: 'Laboratory', capacity: 20, status: 'Occupied', equipment: ['Lab Kits', 'Projector', 'Safety Gear'] },
    { id: '3', name: 'Main Hall', type: 'Auditorium', capacity: 150, status: 'Available', equipment: ['Sound System', 'Stage', 'AC'] },
    { id: '4', name: 'Virtual Room A', type: 'Virtual', capacity: 500, status: 'Available', equipment: ['Zoom Integration', 'Recording'] },
    { id: '5', name: 'Room 204', type: 'Classroom', capacity: 25, status: 'Maintenance', equipment: ['Whiteboard'] },
  ]);

  activeFiltersCount = computed(() => {
    let count = 0;
    const values = this.filterValues();
    if (values.type) count++;
    if (values.status) count++;
    if (values.sortBy !== 'name') count++;
    return count;
  });

  filteredRooms = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const filters = this.filterValues();
    
    const result = this.rooms().filter(room => {
      const matchesSearch = !query || 
        room.name.toLowerCase().includes(query) || 
        room.equipment.some(e => e.toLowerCase().includes(query));
      
      const matchesType = !filters.type || room.type === filters.type;
      const matchesStatus = !filters.status || room.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sorting
    if (filters.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'capacity-desc') {
      result.sort((a, b) => b.capacity - a.capacity);
    } else if (filters.sortBy === 'capacity-asc') {
      result.sort((a, b) => a.capacity - b.capacity);
    }

    return result;
  });

  toggleFilterPanel() {
    this.showFilterPanel.update(v => !v);
  }

  clearAllFilters() {
    this.searchQuery.set('');
    this.clearAdvancedFilters();
  }

  clearAdvancedFilters() {
    this.filterForm.reset({
      type: '',
      status: '',
      sortBy: 'name'
    });
  }
}
