import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomFieldDefinition } from './custom-field-definition.entity';

@Injectable()
export class CustomFieldsService {
  constructor(
    @InjectRepository(CustomFieldDefinition)
    private fieldRepo: Repository<CustomFieldDefinition>,
  ) {}

  async getDefinitionsForEntity(entityType: string): Promise<CustomFieldDefinition[]> {
    return this.fieldRepo.find({
      where: { entityType, isActive: true },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async getAllDefinitions(): Promise<CustomFieldDefinition[]> {
    return this.fieldRepo.find({ order: { entityType: 'ASC', order: 'ASC' } });
  }

  async createDefinition(dto: Partial<CustomFieldDefinition>): Promise<CustomFieldDefinition> {
    if (!dto.entityType || !dto.key || !dto.label) {
      throw new BadRequestException('entityType, key y label son campos obligatorios.');
    }

    const existing = await this.fieldRepo.findOne({
      where: { entityType: dto.entityType, key: dto.key },
    });
    if (existing) {
      throw new BadRequestException(`El campo '${dto.key}' ya existe para la entidad '${dto.entityType}'.`);
    }

    const newField = this.fieldRepo.create(dto);
    return this.fieldRepo.save(newField);
  }

  async updateDefinition(id: string, dto: Partial<CustomFieldDefinition>): Promise<CustomFieldDefinition> {
    const field = await this.fieldRepo.findOne({ where: { id } });
    if (!field) {
      throw new BadRequestException(`Campo personalizado con ID '${id}' no encontrado.`);
    }

    Object.assign(field, dto);
    return this.fieldRepo.save(field);
  }

  async deleteDefinition(id: string): Promise<void> {
    await this.fieldRepo.delete(id);
  }
}
