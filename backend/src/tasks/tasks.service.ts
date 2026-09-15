import { Injectable, Inject, forwardRef, Optional, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { GoogleCalendarService } from '../modules/google-calendar/google-calendar.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private repository: Repository<Task>,
    @Optional()
    @Inject(forwardRef(() => GoogleCalendarService))
    private googleCalendarService?: GoogleCalendarService,
  ) {}

  findAll(): Promise<Task[]> {
    return this.repository.find({ relations: ['client', 'assignedTo'] });
  }

  findOne(id: number): Promise<Task | null> {
    return this.repository.findOne({
      where: { id: Number(id) },
      relations: ['client', 'assignedTo'],
    });
  }

  async create(data: Partial<Task>, userId?: number): Promise<Task> {
    if (userId && !data.assignedTo) {
      data.assignedTo = { id: userId } as any;
    }
    const entity = this.repository.create(data);
    const saved = await this.repository.save(entity);

    if (this.googleCalendarService && saved.dueDate) {
      try {
        const full = await this.findOne(saved.id);
        if (full) {
          await this.googleCalendarService.syncTaskToGoogle(full, userId);
        }
      } catch (err: any) {
        this.logger.warn(`Failed to sync task #${saved.id} to Google Calendar: ${err?.message || err}`);
      }
    }

    return (await this.findOne(saved.id)) || saved;
  }

  async update(id: number, data: Partial<Task>, userId?: number): Promise<Task | null> {
    await this.repository.save({ ...data, id: Number(id) } as any);
    const updated = await this.findOne(id);
    if (updated && this.googleCalendarService && updated.dueDate) {
      try {
        await this.googleCalendarService.syncTaskToGoogle(updated, userId);
      } catch (err: any) {
        this.logger.warn(`Failed to sync updated task #${id} to Google Calendar: ${err?.message || err}`);
      }
    }
    return updated;
  }

  async remove(id: number, userId?: number): Promise<void> {
    const existing = await this.findOne(id);
    if (existing?.googleEventId && this.googleCalendarService) {
      try {
        await this.googleCalendarService.deleteTaskFromGoogle(existing.googleEventId, userId);
      } catch (err: any) {
        this.logger.warn(`Failed to delete task #${id} from Google Calendar: ${err?.message || err}`);
      }
    }
    await this.repository.delete(id);
  }
}
