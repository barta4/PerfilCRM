import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { ClientStock } from './entities/client-stock.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,
    @InjectRepository(ClientStock)
    private readonly clientStockRepo: Repository<ClientStock>,
    private readonly dataSource: DataSource,
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
    if (!quantity || quantity <= 0) {
      throw new BadRequestException('La cantidad a transferir debe ser mayor a cero.');
    }

    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(InventoryItem, { where: { id: itemId } });
      if (!item) throw new NotFoundException('Insumo no encontrado');
      if (Number(item.stockQuantity) < quantity) {
        throw new BadRequestException('Stock insuficiente en depósito central');
      }

      item.stockQuantity = Number(item.stockQuantity) - quantity;
      await manager.save(InventoryItem, item);

      let clientStock = await manager.findOne(ClientStock, {
        where: { client: { id: clientId }, item: { id: itemId } },
      });

      if (clientStock) {
        clientStock.quantity = Number(clientStock.quantity) + quantity;
        if (minThreshold > 0) {
          clientStock.minThreshold = minThreshold;
        }
      } else {
        clientStock = manager.create(ClientStock, {
          client: { id: clientId } as any,
          item: { id: itemId } as any,
          quantity,
          minThreshold,
        });
      }

      return manager.save(ClientStock, clientStock);
    });
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
