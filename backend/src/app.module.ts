import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from './clients/clients.module';
import { ContactsModule } from './contacts/contacts.module';
import { EventsModule } from './events/events.module';
import { VisitsModule } from './visits/visits.module';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DocumentsModule } from './documents/documents.module';
import { ReportsModule } from './reports/reports.module';
import { AiModule } from './ai/ai.module';
import { SettingsModule } from './settings/settings.module';
import { QuotationsModule } from './quotations/quotations.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { AccountingModule } from './modules/accounting/accounting.module';

import { ModuleRegistryModule } from './core/modules-registry/module-registry.module';
import { CustomFieldsModule } from './core/custom-fields/custom-fields.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 100 requests per minute
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true, // Auto-create tables for Perfilgranos CRM
      }),
      inject: [ConfigService],
    }),
    // Core engine modules
    ModuleRegistryModule,
    CustomFieldsModule,
    // Core business modules
    AuthModule,
    ClientsModule,
    ContactsModule,
    EventsModule,
    VisitsModule,
    TasksModule,
    NotificationsModule,
    DocumentsModule,
    ReportsModule,
    AiModule,
    SettingsModule,
    QuotationsModule,
    SuppliersModule,
    AccountingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
