import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Visit } from './visit.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit)
    private repository: Repository<Visit>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(clientId?: number): Promise<Visit[]> {
    const options: FindManyOptions<Visit> = {
      relations: ['client', 'createdBy'],
      order: { createdAt: 'DESC' },
    };

    if (clientId) {
      options.where = { client: { id: clientId } };
    }

    return this.repository.find(options);
  }

  findOne(id: number): Promise<Visit | null> {
    return this.repository.findOne({
      where: { id: Number(id) },
      relations: ['client', 'createdBy'],
    });
  }

  async create(data: any): Promise<Visit> {
    const { createTask, taskDueDate, taskTitle, taskPriority, ...visitData } = data;
    const entity = this.repository.create(visitData as Partial<Visit>);
    const saved = (await this.repository.save(entity)) as Visit;
    const full = await this.findOne(saved.id);
    if (full) {
      this.eventEmitter.emit('visit.created', {
        ...full,
        createTask,
        taskDueDate,
        taskTitle,
        taskPriority,
      });
    }
    return saved;
  }

  async update(id: number, data: Partial<Visit>): Promise<Visit | null> {
    await this.repository.save({ ...data, id: Number(id) } as Partial<Visit>);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
