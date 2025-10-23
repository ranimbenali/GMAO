import { Body, Controller, Post } from '@nestjs/common';
import OpenAI from 'openai';
// ✅ Types à importer depuis le sous-module du SDK
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';

import { AssistantToolsService } from './assistant.tools';

// Le front NE doit pas envoyer de messages role:"tool"
type ChatMsg = { role: 'user' | 'assistant' | 'system'; content: string };

@Controller('api/assistant')
export class AssistantController {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  private model = process.env.MODEL || 'gpt-4o-mini';

  constructor(private readonly tools: AssistantToolsService) {}

  @Post('chat')
  async chat(@Body() body: { messages: ChatMsg[] }) {
    // Map des messages du front vers le type attendu par le SDK
    const messages: ChatCompletionMessageParam[] = (body?.messages ?? []).map(
      (m) => ({ role: m.role, content: m.content }),
    );

    // 1) Premier tour : on déclare les tools
    const first = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            "Tu es l'assistant de la GMAO de l'entreprise. " +
            "Tu peux appeler des outils pour récupérer des données réelles (équipements, maintenances). " +
            'Toujours répondre en français, concis, avec des chiffres précis si disponibles.',
        },
        ...messages,
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'getEquipmentCount',
            description: 'Retourne le nombre total d’équipements',
            parameters: { type: 'object', properties: {}, additionalProperties: false },
          },
        },
        {
          type: 'function',
          function: {
            name: 'getMaintenanceStats',
            description: 'Compter les maintenances par statut (ex: "en attente", "terminée")',
            parameters: {
              type: 'object',
              properties: { status: { type: 'string' } },
              required: ['status'],
              additionalProperties: false,
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'getUpcomingMaintenances7d',
            description: 'Nombre d’interventions planifiées dans les 7 prochains jours',
            parameters: { type: 'object', properties: {}, additionalProperties: false },
          },
        },
      ],
    });

    const choice = first.choices?.[0];
    const toolCall: ChatCompletionMessageToolCall | undefined =
      choice?.message?.tool_calls?.[0];

    // 2) Si le modèle veut appeler un outil
    if (toolCall && toolCall.type === 'function' && toolCall.function?.name) {
      const toolName = toolCall.function.name;
      const argStr = toolCall.function.arguments ?? '{}';

      let args: any = {};
      try {
        args = JSON.parse(argStr);
      } catch {
        args = {};
      }

      let toolResult: any = null;
      if (toolName === 'getEquipmentCount') {
        toolResult = await this.tools.getEquipmentCount();
      } else if (toolName === 'getMaintenanceStats') {
        toolResult = await this.tools.getMaintenanceStats(args.status);
      } else if (toolName === 'getUpcomingMaintenances7d') {
        toolResult = await this.tools.getUpcomingMaintenances7d();
      }

      // 3) Second tour : on renvoie le résultat OBLIGATOIREMENT avec tool_call_id
      const second = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'Réponds en une phrase claire, chiffres mis en évidence.' },
          ...messages,
          choice!.message!, // message assistant (avec tool_calls)
          {
            role: 'tool',
            tool_call_id: toolCall.id, // ⚠️ requis par le SDK
            content: JSON.stringify(toolResult),
          },
        ],
      });

      const text =
        second.choices?.[0]?.message?.content?.trim() || 'Je n’ai rien trouvé.';
      return { reply: text };
    }

    // 4) Pas d’outil nécessaire
    const text = choice?.message?.content?.trim() || 'Je n’ai rien trouvé.';
    return { reply: text };
  }
}
