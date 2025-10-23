import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantApi } from '../../services/api/assistant.api';

type Msg = { who: 'user' | 'bot'; text: string; at: Date };

@Component({
  standalone: true,
  selector: 'app-chatbot',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h2><i class="fas fa-robot"></i> Assistant</h2>
        <p class="hint">Pose une question sur tes données (équipements, interventions…)</p>
      </div>

      <div class="card chat">
        <div class="history">
          <div *ngFor="let m of history" class="msg" [class.me]="m.who==='user'">
            <div class="bubble">
              <div class="who">{{ m.who==='user' ? 'Moi' : 'Assistant' }}</div>
              <div class="text">{{ m.text }}</div>
              <div class="time">{{ m.at | date:'HH:mm' }}</div>
            </div>
          </div>

          <div *ngIf="!history.length" class="empty">
            Exemples :<br>
            - "combien d'équipements ?"<br>
            - "interventions en attente ?" / "terminées ?"<br>
            - "à venir (7 jours ?)"
          </div>
        </div>

        <form class="composer" (ngSubmit)="send()" autocomplete="off">
          <input [(ngModel)]="draft" name="draft" placeholder="Écrire un message…" />
          <button type="submit" [disabled]="!draft.trim() || thinking">Envoyer</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
    .page{ padding:20px; }
    .header{ margin-bottom:12px; }
    .header h2{ margin:0 0 6px 0; display:flex; gap:8px; align-items:center; }
    .hint{ color:#6b7280; margin:0; }
    .card.chat{ background:#fff; border-radius:10px; box-shadow:0 3px 10px rgba(0,0,0,.05); display:flex; flex-direction:column; height:70vh; }
    .history{ flex:1; padding:14px; overflow:auto; display:flex; flex-direction:column; gap:10px; }
    .empty{ text-align:center; color:#9ca3af; margin-top:20px; }
    .msg{ display:flex; }
    .msg.me{ justify-content:flex-end; }
    .bubble{ max-width:70%; padding:10px 12px; border-radius:12px; background:#f3f4f6; }
    .msg.me .bubble{ background:#eef0ff; }
    .who{ font-size:12px; color:#6b7280; margin-bottom:4px; }
    .text{ white-space:pre-wrap; }
    .time{ font-size:11px; color:#9ca3af; margin-top:6px; text-align:right; }
    .composer{ border-top:1px solid #eee; padding:10px; display:flex; gap:8px; }
    .composer input{ flex:1; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; }
    .composer button{
      border:none; border-radius:10px; padding:10px 16px; font-weight:600; cursor:pointer;
      background:#3a36db; color:#fff;
    }
    .composer button:disabled{ opacity:.6; cursor:not-allowed; }
  `]
})
export class ChatbotComponent {
  history: Msg[] = [];
  draft = '';
  thinking = false;

  constructor(private api: AssistantApi) {}

  private faq(userText: string): string | null {
    const q = userText.toLowerCase();
    if (/\b(bonjour|salut|hello)\b/.test(q)) {
      return `Bonjour ! Tu peux me demander :
- “combien d’équipements ?”
- “combien d’interventions en attente ?”
- “interventions terminées ?”
- “interventions à venir (7 jours) ?”`;
    }
    if (q.includes('aide') || q.includes('help')) {
      return `Exemples utiles :
- Équipements : “combien d’équipements ?”
- Interventions : “en attente ?”, “terminées ?”
- À venir : “interventions à venir (7 jours) ?”`;
    }
    return null;
  }

  private async smartAnswer(userText: string): Promise<string> {
    const q = userText.toLowerCase();

    // ---- Intent: équipements
    if (q.includes('equipement') || q.includes('équipement')) {
      if (q.includes('combien') || q.includes('nombre')) {
        const n = await this.api.countEquipments();
        return `Tu as **${n}** équipement(s) au total.`;
      }
    }

    // ---- Intent: interventions par statut
    if (q.includes('intervention') || q.includes('maintenance')) {
      if (q.includes('attente') || q.includes('pending')) {
        const n = await this.api.countMaintenancesByStatus('attente');
        return `Interventions **en attente** : **${n}**.`;
      }
      if (q.includes('termin') || q.includes('done')) {
        const n = await this.api.countMaintenancesByStatus('termin');
        return `Interventions **terminées** : **${n}**.`;
      }
      if (q.includes('en cours') || q.includes('progress')) {
        const n = await this.api.countMaintenancesByStatus('cours');
        return `Interventions **en cours** : **${n}**.`;
      }
      if (q.includes('venir') || q.includes('7 jours') || q.includes('prochaines')) {
        const n = await this.api.upcomingMaintenances7d();
        return `Interventions **à venir sous 7 jours** : **${n}**.`;
      }
    }

    return this.faq(userText)
      ?? `Je n’ai pas compris. Essaie “combien d’équipements ?”, “interventions en attente ?”, “terminées ?”, “à venir (7 jours) ?”`;
  }

  async send(): Promise<void> {
    const text = this.draft.trim();
    if (!text || this.thinking) return;

    this.history.push({ who: 'user', text, at: new Date() });
    this.draft = '';
    this.thinking = true;

    try {
      const answer = await this.smartAnswer(text);
      this.history.push({ who: 'bot', text: answer, at: new Date() });
    } catch (e) {
      this.history.push({
        who: 'bot',
        text: `Oups… impossible de répondre (réseau/API). Réessaie.`,
        at: new Date(),
      });
    } finally {
      this.thinking = false;
    }
  }
}
