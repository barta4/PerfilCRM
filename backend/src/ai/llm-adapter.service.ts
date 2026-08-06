import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: any[];
}

@Injectable()
export class LlmAdapterService {
  private readonly logger = new Logger(LlmAdapterService.name);

  constructor(private readonly settingsService: SettingsService) {}

  async getAiConfig() {
    const allSettings = await this.settingsService.getAll();
    const findKey = (key: string) => allSettings.find((s) => s.key === key)?.value;

    const baseUrl =
      findKey('ai_base_url') ||
      process.env.OPENAI_BASE_URL ||
      'https://api.openai.com/v1';

    const apiKey =
      findKey('ai_api_key') ||
      process.env.OPENAI_API_KEY ||
      process.env.GOOGLE_AI_KEY ||
      '';

    const model = findKey('ai_model') || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const providerName = findKey('ai_provider_name') || 'OpenAI Compatible';
    const temperature = parseFloat(findKey('ai_temperature') || '0.7');
    const maxTokens = parseInt(findKey('ai_max_tokens') || '2048', 10);
    const systemPrompt =
      findKey('ai_system_prompt') ||
      'Eres el Agente Inteligente Comercial y Operativo de PerfilCRM. Ayudas a gestionar terceros, tareas, comunicaciones, cotizaciones e inventario de forma profesional, eficiente y concisa.';

    return {
      baseUrl: baseUrl.replace(/\/+$/, ''),
      apiKey,
      model,
      providerName,
      temperature,
      maxTokens,
      systemPrompt,
    };
  }

  async testConnection(customConfig?: any) {
    const config = customConfig || (await this.getAiConfig());
    if (!config.apiKey && !config.baseUrl.includes('localhost') && !config.baseUrl.includes('127.0.0.1')) {
      return { success: false, message: 'Falta la API Key del proveedor de IA' };
    }

    try {
      const url = `${config.baseUrl}/chat/completions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'Responder únicamente con la palabra: OK' }],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `Error HTTP ${response.status}: ${errorText.slice(0, 150)}`,
        };
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'Sin respuesta';
      return {
        success: true,
        message: `Conexión exitosa con ${config.providerName} (${config.model}). Respuesta: ${reply.trim()}`,
      };
    } catch (error: any) {
      this.logger.error('Error al probar conexión con IA:', error);
      return {
        success: false,
        message: `Error de red o conexión: ${error.message}`,
      };
    }
  }

  async generateChatCompletion(
    messages: ChatCompletionMessage[],
    tools?: any[],
    overrideConfig?: any,
  ) {
    const config = overrideConfig || (await this.getAiConfig());

    const url = `${config.baseUrl}/chat/completions`;
    const payload: any = {
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Error en LLM API (${response.status}): ${errText}`);
        throw new Error(`Error en el proveedor de IA (${response.status}): ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      if (!choice) {
        throw new Error('El proveedor de IA no devolvió ninguna opción.');
      }

      return choice.message;
    } catch (error: any) {
      this.logger.error('Failed to get LLM completion:', error);
      throw error;
    }
  }
}
