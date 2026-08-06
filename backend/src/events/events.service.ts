import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private repository: Repository<Event>,
  ) {}

  findAll(): Promise<Event[]> {
    return this.repository.find({ relations: ['client'] });
  }

  findOne(id: number): Promise<Event | null> {
    return this.repository.findOne({
      where: { id: Number(id) },
      relations: ['client'],
    });
  }

  create(data: Partial<Event>): Promise<Event> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: number, data: Partial<Event>): Promise<Event | null> {
    await this.repository.save({ ...data, id: Number(id) } as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
