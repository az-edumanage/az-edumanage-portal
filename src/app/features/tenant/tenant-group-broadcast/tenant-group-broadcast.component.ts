import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
  role: 'Teacher' | 'Student';
}

@Component({
  selector: 'app-tenant-group-broadcast',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './tenant-group-broadcast.component.html',
  styleUrl: './tenant-group-broadcast.component.css'})
export class TenantGroupBroadcastComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  groupId = signal<string | null>(null);
  isPublic = signal(false);
  newMessage = '';
  
  messages = signal<Message[]>([
    { id: '1', sender: 'System', text: 'Welcome to the Physics G12-A Broadcast channel!', time: '09:00 AM', isMe: false, role: 'Teacher' },
    { id: '2', sender: 'Dr. Ahmed Zewail', text: 'Good morning everyone! Today we will discuss Quantum Mechanics.', time: '10:05 AM', isMe: true, role: 'Teacher' },
    { id: '3', sender: 'Ahmed Ali', text: 'Will there be a quiz today?', time: '10:07 AM', isMe: false, role: 'Student' },
    { id: '4', sender: 'Dr. Ahmed Zewail', text: 'Yes, check the Exam section in a few minutes.', time: '10:10 AM', isMe: true, role: 'Teacher' },
  ]);

  onlineStudents = signal(['Ahmed Ali', 'Sara Mohamed', 'Omar Hassan', 'Laila Mahmoud', 'Youssef Ibrahim', 'Mona Ahmed']);

  ngOnInit() {
    this.groupId.set(this.route.snapshot.paramMap.get('id'));
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    
    const msg: Message = {
      id: Date.now().toString(),
      sender: 'Dr. Ahmed Zewail',
      text: this.newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      role: 'Teacher'
    };
    
    this.messages.update(list => [...list, msg]);
    this.newMessage = '';
  }

  goLive() {
    alert('Starting Live Video Stream...');
  }
}
