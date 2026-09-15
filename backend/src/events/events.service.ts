import { Injectable, Inject, forwardRef, Optional, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { GoogleCalendarService } from '../modules/google-calendar/google-calendar.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private repository: Repository<Event>,
    @Optional()
    @Inject(forwardRef(() => GoogleCalendarService))
    private googleCalendarService?: GoogleCalendarService,
  ) {}

  findAll(): Promise<Event[]> {
    return this.repository.find({ relations: ['client', 'creator'] });
  }

  findOne(id: number): Promise<Event | null> {
    return this.repository.findOne({
      where: { id: Number(id) },
      relations: ['client', 'creator'],
    });
  }

  async create(data: Partial<Event>, userId?: number): Promise<Event> {
    if (userId && !data.creator) {
      data.creator = { id: userId } as any;
    }
    const entity = this.repository.create(data);
    const saved = await this.repository.save(entity);

    if (this.googleCalendarService) {
      try {
        const full = await this.findOne(saved.id);
        if (full) {
          await this.googleCalendarService.syncEventToGoogle(full, userId);
        }
      } catch (err: any) {
        this.logger.warn(`Failed to sync event #${saved.id} to Google Calendar: ${err?.message || err}`);
      }
    }

    return (await this.findOne(saved.id)) || saved;
  }

  async update(id: number, data: Partial<Event>, userId?: number): Promise<Event | null> {
    await this.repository.save({ ...data, id: Number(id) } as any);
    const updated = await this.findOne(id);
    if (updated && this.googleCalendarService) {
      try {
        await this.googleCalendarService.syncEventToGoogle(updated, userId);
      } catch (err: any) {
        this.logger.warn(`Failed to sync updated event #${id} to Google Calendar: ${err?.message || err}`);
      }
    }
    return updated;
  }

  async remove(id: number, userId?: number): Promise<void> {
    const existing = await this.findOne(id);
    if (existing?.googleEventId && this.googleCalendarService) {
      try {
        await this.googleCalendarService.deleteEventFromGoogle(existing.googleEventId, userId);
      } catch (err: any) {
        this.logger.warn(`Failed to delete event #${id} from Google Calendar: ${err?.message || err}`);
      }
    }
    await this.repository.delete(id);
  }
}
