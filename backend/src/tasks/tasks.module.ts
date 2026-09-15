import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { GoogleCalendarModule } from '../modules/google-calendar/google-calendar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    forwardRef(() => GoogleCalendarModule),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TypeOrmModule, TasksService],
})
export class TasksModule {}
