import { Injectable } from '@nestjs/common';
import { ClientsService } from '../../clients/clients.service';
import { Client } from '../../clients/client.entity';

@Injectable()
export class SuppliersService {
  constructor(private readonly clientsService: ClientsService) {}

  async findAll(): Promise<Client[]> {
    return this.clientsService.findAll(undefined, 'supplier');
  }

  async findOne(id: string): Promise<Client | null> {
    return this.clientsService.findOne(Number(id));
  }

  async create(data: Partial<Client>): Promise<Client> {
    return this.clientsService.create({
      ...data,
      isSupplier: true,
    });
  }

  async update(id: string, data: Partial<Client>): Promise<Client | null> {
    return this.clientsService.update(Number(id), {
      ...data,
      isSupplier: data.isSupplier !== undefined ? data.isSupplier : true,
    });
  }

  async remove(id: string): Promise<void> {
    return this.clientsService.remove(Number(id));
  }
}
