import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationMessage } from './entities/conversation-message.entity';
import { User } from '../auth/user.entity';
import { LlmAdapterService, ChatCompletionMessage } from './llm-adapter.service';
import { ToolRegistryService } from './tool-registry.service';
import { ToolExecutorService } from './tool-executor.service';
import { ContextEngineService } from './context-engine.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ConversationMessage)
    private readonly messageRepo: Repository<ConversationMessage>,
    private readonly llmAdapter: LlmAdapterService,
    private readonly toolRegistry: ToolRegistryService,
    private readonly toolExecutor: ToolExecutorService,
    private readonly contextEngine: ContextEngineService,
  ) {}

  async getUserConversations(user: User): Promise<Conversation[]> {
    return this.conversationRepo.find({
      where: { user: { id: user.id } },
      order: { updatedAt: 'DESC' },
      take: 20,
    });
  }

  async getConversationMessages(id: number, user: User): Promise<ConversationMessage[]> {
    const conv = await this.conversationRepo.findOne({
      where: { id: Number(id), user: { id: user.id } },
      relations: ['messages'],
    });
    if (!conv) throw new NotFoundException('Conversación no encontrada');
    return conv.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async deleteConversation(id: number, user: User): Promise<void> {
    await this.conversationRepo.delete({ id: Number(id), user: { id: user.id } });
  }

  async processMessage(
    user: User,
    payload: { conversationId?: number; message: string },
  ) {
    let conversation: Conversation;

    if (payload.conversationId) {
      const found = await this.conversationRepo.findOne({
        where: { id: Number(payload.conversationId), user: { id: user.id } },
        relations: ['messages'],
      });
      if (!found) throw new NotFoundException('Conversación no encontrada');
      conversation = found;
    } else {
      const title = payload.message.slice(0, 30) + (payload.message.length > 30 ? '...' : '');
      conversation = this.conversationRepo.create({
        user,
        title,
      });
      conversation = await this.conversationRepo.save(conversation);
      conversation.messages = [];
    }

    // Save user message
    const userMsg = this.messageRepo.create({
      conversation,
      role: 'user',
      content: payload.message,
    });
    await this.messageRepo.save(userMsg);

    // Build context
    const aiConfig = await this.llmAdapter.getAiConfig();
    const systemContext = await this.contextEngine.buildContextPrompt(user);
    const fullSystemPrompt = `${aiConfig.systemPrompt}\n\n${systemContext}`;

    // Load recent history
    const historyMessages = conversation.messages || [];
    const history: ChatCompletionMessage[] = [
      { role: 'system', content: fullSystemPrompt },
    ];

    // Include up to last 10 messages
    const recent = historyMessages.slice(-10);
    for (const m of recent) {
      history.push({
        role: m.role as any,
        content: m.content || '',
      });
    }
    history.push({ role: 'user', content: payload.message });

    const toolsSchema = this.toolRegistry.getOpenAiToolsSchema();

    // Call LLM
    const responseMessage = await this.llmAdapter.generateChatCompletion(
      history,
      toolsSchema,
    );

    // Check if LLM wants to invoke tool_calls
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      const toolName = toolCall.function.name;
      let toolArgs: any = {};
      try {
        toolArgs = JSON.parse(toolCall.function.arguments || '{}');
      } catch {}

      const toolDef = this.toolRegistry.getTool(toolName);

      if (toolDef && toolDef.requiresConfirmation) {
        // Requires user confirmation -> Store pending action
        const assistantMsg = this.messageRepo.create({
          conversation,
          role: 'assistant',
          content: responseMessage.content || `He preparado la siguiente acción: **${toolName}**. Por favor confirma para proceder.`,
          toolCalls: responseMessage.tool_calls,
          pendingAction: {
            toolCallId: toolCall.id,
            toolName,
            args: toolArgs,
            summary: this.buildActionSummary(toolName, toolArgs),
          },
        });

        const savedMsg = await this.messageRepo.save(assistantMsg);
        await this.conversationRepo.update(conversation.id, { updatedAt: new Date() });

        return {
          conversationId: conversation.id,
          message: savedMsg,
          requiresConfirmation: true,
          pendingAction: savedMsg.pendingAction,
        };
      } else {
        // Read-only tool -> Execute immediately in loop
        const toolResult = await this.toolExecutor.executeTool(toolName, toolArgs, user);

        history.push({
          role: 'assistant',
          content: responseMessage.content || undefined,
          tool_calls: responseMessage.tool_calls,
        });

        history.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: JSON.stringify(toolResult),
        });

        // Call LLM again with tool result
        const finalResponse = await this.llmAdapter.generateChatCompletion(history);

        const assistantMsg = this.messageRepo.create({
          conversation,
          role: 'assistant',
          content: finalResponse.content || 'Acción procesada.',
        });

        const savedMsg = await this.messageRepo.save(assistantMsg);
        await this.conversationRepo.update(conversation.id, { updatedAt: new Date() });

        return {
          conversationId: conversation.id,
          message: savedMsg,
          requiresConfirmation: false,
        };
      }
    }

    // Direct text response
    const assistantMsg = this.messageRepo.create({
      conversation,
      role: 'assistant',
      content: responseMessage.content || 'Entendido.',
    });

    const savedMsg = await this.messageRepo.save(assistantMsg);
    await this.conversationRepo.update(conversation.id, { updatedAt: new Date() });

    return {
      conversationId: conversation.id,
      message: savedMsg,
      requiresConfirmation: false,
    };
  }

  async confirmAction(
    user: User,
    payload: { conversationId: number; messageId: number; confirmed: boolean },
  ) {
    const msg = await this.messageRepo.findOne({
      where: { id: Number(payload.messageId) },
      relations: ['conversation'],
    });

    if (!msg || !msg.pendingAction) {
      throw new NotFoundException('Acción pendiente no encontrada o ya procesada.');
    }

    const { toolName, args } = msg.pendingAction;
    const conversation = msg.conversation;

    if (!payload.confirmed) {
      msg.pendingAction = null;
      msg.content = `${msg.content || ''}\n\n❌ *Acción cancelada por el usuario.*`;
      await this.messageRepo.save(msg);
      return { success: false, message: 'Acción cancelada por el usuario.' };
    }

    // Execute the write tool
    const executionResult = await this.toolExecutor.executeTool(toolName, args, user);

    // Clear pending action and save status
    msg.pendingAction = null;
    await this.messageRepo.save(msg);

    // Create system/tool response message
    const aiConfig = await this.llmAdapter.getAiConfig();
    const systemContext = await this.contextEngine.buildContextPrompt(user);

    const history: ChatCompletionMessage[] = [
      { role: 'system', content: `${aiConfig.systemPrompt}\n\n${systemContext}` },
      { role: 'user', content: `Confirmé la ejecución de ${toolName} con los datos ${JSON.stringify(args)}. Resultado de la ejecución: ${JSON.stringify(executionResult)}` },
    ];

    const finalResponse = await this.llmAdapter.generateChatCompletion(history);

    const resultMessage = this.messageRepo.create({
      conversation,
      role: 'assistant',
      content: finalResponse.content || `✅ Acción ${toolName} ejecutada con éxito.`,
    });

    const savedResult = await this.messageRepo.save(resultMessage);
    await this.conversationRepo.update(conversation.id, { updatedAt: new Date() });

    return {
      success: true,
      executionResult,
      resultMessage: savedResult,
    };
  }

  private buildActionSummary(toolName: string, args: any): string {
    switch (toolName) {
      case 'create_client':
        return `Crear Tercero "${args.businessName || 'Empresa'}" (RUT: ${args.taxId || 'Sin RUT'}, Rol: ${args.isSupplier ? 'Proveedor' : 'Cliente'})`;
      case 'create_task':
        return `Crear Tarea "${args.title}" (Prioridad: ${args.priority || 'Normal'}, Vence: ${args.dueDate || 'Sin fecha'})`;
      case 'create_visit':
        return `Registrar Comunicación (${args.communicationType || 'Reunión'}) para Cliente #${args.clientId}`;
      case 'create_event':
        return `Agendar Evento "${args.title}" (${args.type}) para el cliente #${args.clientId}`;
      case 'create_quotation':
        return `Crear Cotización por USD para Cliente #${args.clientId} (${args.items?.length || 0} ítems)`;
      default:
        return `Ejecutar ${toolName}`;
    }
  }
}
