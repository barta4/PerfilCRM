import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inspection } from './inspection.entity';

@Injectable()
export class InspectionsService {
  constructor(
    @InjectRepository(Inspection)
    private readonly repo: Repository<Inspection>,
  ) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByClient(clientId: number) {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  create(data: Partial<Inspection>) {
    // Calculate general score automatically: 5 categories, 20% each max.
    let score = 0;
    score += (data.desksCleaned ?? 5) * 4; // Max 5 * 4 = 20%
    score += (data.floorsSwept ?? 5) * 4; // Max 5 * 4 = 20%
    score += data.binsEmptied ? 20 : 0;
    score += data.bathroomsSanitized ? 20 : 0;
    score += data.glassCleaned ? 20 : 0;

    const inspection = this.repo.create({
      ...data,
      generalScore: score,
    });
    return this.repo.save(inspection);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }
}
