import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private repository: Repository<Task>,
  ) {}

  findAll(): Promise<Task[]> {
    return this.repository.find({ relations: ['client'] });
  }

  findOne(id: number): Promise<Task | null> {
    return this.repository.findOne({
      where: { id: Number(id) },
      relations: ['client'],
    });
  }

  create(data: Partial<Task>): Promise<Task> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: number, data: Partial<Task>): Promise<Task | null> {
    await this.repository.save({ ...data, id: Number(id) } as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
