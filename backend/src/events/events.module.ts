import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './event.entity';
import { GoogleCalendarModule } from '../modules/google-calendar/google-calendar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    forwardRef(() => GoogleCalendarModule),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [TypeOrmModule, EventsService],
})
export class EventsModule {}
