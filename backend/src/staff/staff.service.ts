import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cleaner } from './cleaner.entity';
import { Schedule } from './schedule.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Cleaner)
    private readonly cleanerRepo: Repository<Cleaner>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
  ) {}

  findAllCleaners() {
    return this.cleanerRepo.find({ order: { name: 'ASC' } });
  }

  createCleaner(data: Partial<Cleaner>) {
    const cleaner = this.cleanerRepo.create(data);
    return this.cleanerRepo.save(cleaner);
  }

  updateCleaner(id: number, data: Partial<Cleaner>) {
    return this.cleanerRepo.update(id, data);
  }

  deleteCleaner(id: number) {
    return this.cleanerRepo.delete(id);
  }

  findAllSchedules() {
    return this.scheduleRepo.find({
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  findSchedulesByClient(clientId: number) {
    return this.scheduleRepo.find({
      where: { client: { id: clientId } },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  findSchedulesByCleaner(cleanerId: number) {
    return this.scheduleRepo.find({
      where: { cleaner: { id: cleanerId } },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  createSchedule(data: Partial<Schedule>) {
    const schedule = this.scheduleRepo.create(data);
    return this.scheduleRepo.save(schedule);
  }

  deleteSchedule(id: number) {
    return this.scheduleRepo.delete(id);
  }
}
