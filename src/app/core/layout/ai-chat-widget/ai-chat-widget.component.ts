import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, PLATFORM_ID, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';

type ChatRole = 'user' | 'assistant';

interface AiChatResponse {
  answer?: string;
  inScope?: boolean;
}

interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
  renderedText: string;
  loading: boolean;
  typing: boolean;
}

@Component({
  selector: 'app-ai-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './ai-chat-widget.component.html',
  styleUrl: './ai-chat-widget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatWidgetComponent {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private typingTimer: number | null = null;
  private messageId = 0;

  @ViewChild('messagesPane') private messagesPane?: ElementRef<HTMLDivElement>;

  readonly open = signal(false);
  readonly draft = signal('');
  readonly sending = signal(false);
  readonly messages = signal<ChatMessage[]>([
    {
      id: ++this.messageId,
      role: 'assistant',
      text: 'مرحبا، كيف يمكنني مساعدتك في AZ-EduManage؟',
      renderedText: 'مرحبا، كيف يمكنني مساعدتك في AZ-EduManage؟',
      loading: false,
      typing: false,
    },
  ]);

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTypingTimer());
  }

  toggle(): void {
    this.open.update((value) => !value);
    this.scrollMessagesSoon();
  }

  close(): void {
    this.open.set(false);
  }

  sendMessage(): void {
    const message = this.draft().trim();
    if (!message || this.sending()) {
      return;
    }

    this.clearTypingTimer();
    this.draft.set('');
    this.sending.set(true);

    const userMessage = this.createMessage('user', message);
    const assistantMessage = this.createMessage('assistant', '', { loading: true });
    this.messages.update((messages) => [...messages, userMessage, assistantMessage]);
    this.scrollMessagesSoon();

    this.http.post<AiChatResponse>(
      `${environment.apiBaseUrl}/ai/chat`,
      { message },
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      },
    )
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (response) => {
          const answer = response.answer?.trim() || 'لم أتمكن من العثور على إجابة مناسبة الآن.';
          this.startTypewriter(assistantMessage.id, answer);
        },
        error: () => {
          this.replaceMessage(assistantMessage.id, {
            text: 'تعذر الاتصال بالمساعد الآن. حاول مرة أخرى بعد قليل.',
            renderedText: 'تعذر الاتصال بالمساعد الآن. حاول مرة أخرى بعد قليل.',
            loading: false,
            typing: false,
          });
        },
      });
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }
    event.preventDefault();
    this.sendMessage();
  }

  private createMessage(role: ChatRole, text: string, options?: Partial<ChatMessage>): ChatMessage {
    return {
      id: ++this.messageId,
      role,
      text,
      renderedText: text,
      loading: false,
      typing: false,
      ...options,
    };
  }

  private startTypewriter(messageId: number, answer: string): void {
    if (!this.isBrowser) {
      this.replaceMessage(messageId, {
        text: answer,
        renderedText: answer,
        loading: false,
        typing: false,
      });
      return;
    }

    const letters = Array.from(answer);
    let index = 0;
    this.replaceMessage(messageId, {
      text: answer,
      renderedText: '',
      loading: false,
      typing: true,
    });

    const writeNext = () => {
      index += 1;
      this.replaceMessage(messageId, {
        renderedText: letters.slice(0, index).join(''),
        typing: index < letters.length,
      });
      this.scrollMessagesSoon();

      if (index < letters.length) {
        this.typingTimer = window.setTimeout(writeNext, 18);
      } else {
        this.typingTimer = null;
      }
    };

    this.typingTimer = window.setTimeout(writeNext, 80);
  }

  private replaceMessage(messageId: number, patch: Partial<ChatMessage>): void {
    this.messages.update((messages) =>
      messages.map((message) => message.id === messageId ? { ...message, ...patch } : message),
    );
    this.scrollMessagesSoon();
  }

  private clearTypingTimer(): void {
    if (this.typingTimer !== null) {
      if (this.isBrowser) {
        window.clearTimeout(this.typingTimer);
      }
      this.typingTimer = null;
    }
    this.messages.update((messages) => messages.map((message) => ({ ...message, typing: false })));
  }

  private scrollMessagesSoon(): void {
    if (!this.isBrowser) {
      return;
    }

    window.setTimeout(() => {
      const pane = this.messagesPane?.nativeElement;
      if (pane) {
        pane.scrollTop = pane.scrollHeight;
      }
    });
  }
}
