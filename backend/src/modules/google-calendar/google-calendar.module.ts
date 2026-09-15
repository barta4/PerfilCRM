import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCalendarController } from './google-calendar.controller';
import { User } from '../../auth/user.entity';
import { Event } from '../../events/event.entity';
import { Task } from '../../tasks/task.entity';
import { SettingsModule } from '../../settings/settings.module';
import { ModuleRegistryModule } from '../../core/modules-registry/module-registry.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Event, Task]),
    SettingsModule,
    ModuleRegistryModule,
  ],
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarService],
  exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}
