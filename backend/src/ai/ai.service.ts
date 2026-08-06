import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ClientsService } from '../clients/clients.service';
import { VisitsService } from '../visits/visits.service';
import { ContactsService } from '../contacts/contacts.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private clientsService: ClientsService,
    private visitsService: VisitsService,
    private contactsService: ContactsService,
  ) {
    const apiKey = process.env.GOOGLE_AI_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async analyzeContactProfile(contactId: number) {
    if (!this.genAI) {
      return {
        archetype: 'Analítico',
        preferredStyle: 'Formal y directo',
        predictedInterests: ['Logística'],
        nextMove: 'Enviar email de seguimiento',
      };
    }

    const contact = await this.contactsService.findOne(contactId);
    if (!contact) throw new Error('Contact not found');

    const visits = await this.visitsService.findAll(contact.client?.id);

    const context = {
      name: contact.name,
      role: contact.role,
      hobbies: contact.hobbies,
      birthDate: contact.birthDate,
      gender: contact.gender,
      client: contact.client?.businessName,
      recentVisits: visits
        .slice(0, 5)
        .map((v) => ({ date: v.checkInTime, notes: v.notes })),
    };

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-3.1-flash-lite',
      });
      const prompt = `
        Eres un experto en inteligencia social y ventas B2B. Analiza el siguiente contacto:
        ${JSON.stringify(context)}
        
        Basado en su cargo, notas de visitas pasadas, y hobbies, genera un análisis de perfil social en formato JSON con la siguiente estructura exacta:
        {
          "archetype": "string (ej: El Negociador, El Analítico, El Relacional)",
          "preferredStyle": "string (Breve descripción de cómo prefiere comunicarse)",
          "predictedInterests": ["string", "string"],
          "nextMove": "string (Acción social recomendada, ej: Invitar a almorzar, felicitar por aniversario)"
        }
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonStr = text.substring(
        text.indexOf('{'),
        text.lastIndexOf('}') + 1,
      );
      return JSON.parse(jsonStr);
    } catch (error) {
      this.logger.error('Error in analyzeContactProfile', error);
      return {
        archetype: 'Desconocido',
        preferredStyle: 'Profesional',
        predictedInterests: [],
        nextMove: 'Mantener contacto regular',
      };
    }
  }

  getStatus() {
    if (this.genAI) {
      return {
        status: 'connected',
        mode: 'gemini-3.1-flash-lite',
        message: 'API Key configurada correctamente',
      };
    }
    return {
      status: 'degraded',
      mode: 'mock',
      message: 'Usando recomendaciones simuladas',
    };
  }

  async generateRecommendations(userId: number) {
    // 1. Recolectar contexto del usuario
    const [clients, visits] = await Promise.all([
      this.clientsService.findAll(), // Idealmente filtrar por ejecutivo
      this.visitsService.findAll(),
    ]);

    // Simplificar datos para el prompt (evitar exceder tokens y proteger privacidad)
    const context = {
      clients: clients.map((c) => ({
        name: c.businessName,
        status: c.status,
        lastUpdate: c.updatedAt,
      })),
      activeVisitsCount: visits.length,
    };

    if (!this.genAI) {
      this.logger.warn(
        'GOOGLE_AI_KEY not found. Returning mock recommendations.',
      );
      return this.getMockRecommendations();
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-3.1-flash-lite',
      });
      const prompt = `
        Eres un asistente experto en servicios de limpieza industrial y comercial (PurezaCRM) y CRM comercial.
        Tu objetivo es analizar los datos de los clientes y dar 3 recomendaciones accionables para un ejecutivo de ventas/operaciones.
        
        CONTEXTO:
        ${JSON.stringify(context)}

        REGLAS:
        - Sé breve y directo.
        - Prioriza clientes en estado 'Red' o 'Yellow'.
        - Sugiere programar visitas o tareas de control de calidad si ha pasado mucho tiempo.
        - Responde en formato JSON: { recommendations: [ { title: string, description: string, priority: 'high'|'medium'|'low', action: string } ] }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Limpiar respuesta para parsear JSON
      const jsonStr = text.substring(
        text.indexOf('{'),
        text.lastIndexOf('}') + 1,
      );
      return JSON.parse(jsonStr);
    } catch (error) {
      this.logger.error('Error generating AI insights', error);
      return this.getMockRecommendations();
    }
  }

  private getMockRecommendations() {
    return {
      recommendations: [
        {
          title: 'Caída de precios en Soja',
          description:
            'El precio de referencia de la Soja ha caído. Es un buen momento para contactar a los productores indecisos para fijar precio o negociar primas.',
          priority: 'high',
          action: 'Llamar Productores',
        },
        {
          title: 'Renovación de cupos de acopio',
          description:
            'Los cupos de acopio en planta se están agotando rápidamente para la próxima semana. Sugiere a tus clientes adelantar entregas.',
          priority: 'medium',
          action: 'Enviar Campaña',
        },
        {
          title: 'Oportunidad: Maíz Tardío',
          description:
            'Se reportan buenas condiciones de cosecha para el Maíz Tardío. Verifica con "Estancia La Paz" si requieren transporte logístico adicional.',
          priority: 'low',
          action: 'Agendar Visita',
        },
      ],
    };
  }
}
