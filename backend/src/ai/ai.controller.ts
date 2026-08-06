import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatService } from './chat.service';
import { LlmAdapterService } from './llm-adapter.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly chatService: ChatService,
    private readonly llmAdapter: LlmAdapterService,
  ) {}

  @Get('status')
  getStatus() {
    return this.aiService.getStatus();
  }

  @Post('test-connection')
  testConnection(@Body() body: any) {
    return this.llmAdapter.testConnection(body);
  }

  @Get('recommendations')
  getRecommendations(@Request() req: any) {
    return this.aiService.generateRecommendations(req.user.userId);
  }

  @Get('analyze-contact/:id')
  analyzeContact(@Param('id') id: string) {
    return this.aiService.analyzeContactProfile(+id);
  }

  // --- CHAT ENDPOINTS ---

  @Get('conversations')
  getConversations(@Request() req: any) {
    return this.chatService.getUserConversations(req.user);
  }

  @Get('conversations/:id/messages')
  getConversationMessages(@Param('id') id: string, @Request() req: any) {
    return this.chatService.getConversationMessages(+id, req.user);
  }

  @Delete('conversations/:id')
  deleteConversation(@Param('id') id: string, @Request() req: any) {
    return this.chatService.deleteConversation(+id, req.user);
  }

  @Post('chat')
  sendMessage(
    @Request() req: any,
    @Body() body: { conversationId?: number; message: string },
  ) {
    return this.chatService.processMessage(req.user, body);
  }

  @Post('chat/confirm')
  confirmAction(
    @Request() req: any,
    @Body() body: { conversationId: number; messageId: number; confirmed: boolean },
  ) {
    return this.chatService.confirmAction(req.user, body);
  }
}
