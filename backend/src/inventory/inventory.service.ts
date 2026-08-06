import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { ClientStock } from './entities/client-stock.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,
    @InjectRepository(ClientStock)
    private readonly clientStockRepo: Repository<ClientStock>,
  ) {}

  findAllItems() {
    return this.itemRepo.find({ order: { name: 'ASC' } });
  }

  createItem(data: Partial<InventoryItem>) {
    const item = this.itemRepo.create(data);
    return this.itemRepo.save(item);
  }

  updateItem(id: number, data: Partial<InventoryItem>) {
    return this.itemRepo.update(id, data);
  }

  deleteItem(id: number) {
    return this.itemRepo.delete(id);
  }

  findAllClientStocks() {
    return this.clientStockRepo.find({ order: { updatedAt: 'DESC' } });
  }

  findByClient(clientId: number) {
    return this.clientStockRepo.find({
      where: { client: { id: clientId } },
      order: { updatedAt: 'DESC' },
    });
  }

  async transferToClient(
    clientId: number,
    itemId: number,
    quantity: number,
    minThreshold = 0,
  ) {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Insumo no encontrado');
    if (Number(item.stockQuantity) < quantity) {
      throw new BadRequestException('Stock insuficiente en depósito central');
    }

    item.stockQuantity = Number(item.stockQuantity) - quantity;
    await this.itemRepo.save(item);

    let clientStock = await this.clientStockRepo.findOne({
      where: { client: { id: clientId }, item: { id: itemId } },
    });

    if (clientStock) {
      clientStock.quantity = Number(clientStock.quantity) + quantity;
      if (minThreshold > 0) {
        clientStock.minThreshold = minThreshold;
      }
    } else {
      clientStock = this.clientStockRepo.create({
        client: { id: clientId },
        item: { id: itemId },
        quantity,
        minThreshold,
      });
    }

    return this.clientStockRepo.save(clientStock);
  }

  async updateClientStockQuantity(id: number, quantity: number) {
    const stock = await this.clientStockRepo.findOne({ where: { id } });
    if (!stock) throw new NotFoundException('Registro de stock no encontrado');
    stock.quantity = quantity;
    return this.clientStockRepo.save(stock);
  }

  deleteClientStock(id: number) {
    return this.clientStockRepo.delete(id);
  }
}
