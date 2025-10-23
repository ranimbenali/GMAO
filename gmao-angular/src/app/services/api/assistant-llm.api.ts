import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type ChatMsg = { role: 'user' | 'assistant' | 'system'; content: string };

@Injectable({ providedIn: 'root' })
export class AssistantLLMApi {
  constructor(private http: HttpClient) {}

  async chat(messages: ChatMsg[]): Promise<string> {
    const r = await firstValueFrom(
      this.http.post<{ reply: string }>('/api/assistant/chat', { messages })
    );
    return r.reply;
  }
}
