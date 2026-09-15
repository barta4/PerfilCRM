import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './contact.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private repository: Repository<Contact>,
  ) {}

  findAll(clientId?: number): Promise<Contact[]> {
    return this.repository.find({
      where: clientId ? { client: { id: clientId } } : {},
      relations: ['client'],
    });
  }

  findOne(id: number): Promise<Contact | null> {
    return this.repository.findOne({
      where: { id: Number(id) },
      relations: ['client'],
    });
  }

  findByEmail(email: string): Promise<Contact | null> {
    return this.repository.findOne({
      where: { email },
      relations: ['client'],
    });
  }

  create(data: Partial<Contact> | any): Promise<Contact> {
    const payload = { ...data };
    if (payload.birthDate && typeof payload.birthDate === 'string') {
      payload.birthDate = new Date(payload.birthDate);
    }
    if (payload.clientId && !payload.client) {
      payload.client = { id: Number(payload.clientId) };
    }
    const entity = this.repository.create(payload as Partial<Contact>);
    return this.repository.save(entity);
  }

  async update(id: number, data: Partial<Contact> | any): Promise<Contact | null> {
    const payload = { ...data, id: Number(id) };
    if (payload.birthDate && typeof payload.birthDate === 'string') {
      payload.birthDate = new Date(payload.birthDate);
    }
    if (payload.clientId && !payload.client) {
      payload.client = { id: Number(payload.clientId) };
    }
    await this.repository.save(payload as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
