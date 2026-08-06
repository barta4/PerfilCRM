import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Client } from '../../clients/client.entity';
import { InventoryItem } from './inventory-item.entity';

@Entity('client_stocks')
export class ClientStock {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Client, { onDelete: 'CASCADE', eager: true })
  client: Client;

  @ManyToOne(() => InventoryItem, { onDelete: 'CASCADE', eager: true })
  item: InventoryItem;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minThreshold: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
