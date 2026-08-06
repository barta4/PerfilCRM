import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AutomationEngineService } from './automation-engine.service';
import { LlmAdapterService } from './llm-adapter.service';
import { ToolRegistryService } from './tool-registry.service';
import { ToolExecutorService } from './tool-executor.service';
import { ContextEngineService } from './context-engine.service';
import { ChatService } from './chat.service';
import { Conversation } from './entities/conversation.entity';
import { ConversationMessage } from './entities/conversation-message.entity';

import { ClientsModule } from '../clients/clients.module';
import { VisitsModule } from '../visits/visits.module';
import { ContactsModule } from '../contacts/contacts.module';
import { TasksModule } from '../tasks/tasks.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { QuotationsModule } from '../quotations/quotations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationMessage]),
    ClientsModule,
    VisitsModule,
    ContactsModule,
    TasksModule,
    EventsModule,
    NotificationsModule,
    SettingsModule,
    QuotationsModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    AutomationEngineService,
    LlmAdapterService,
    ToolRegistryService,
    ToolExecutorService,
    ContextEngineService,
    ChatService,
  ],
  exports: [
    AiService,
    AutomationEngineService,
    LlmAdapterService,
    ChatService,
  ],
})
export class AiModule {}
