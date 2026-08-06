import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  originalName: string;

  @Column()
  filename: string; // stored filename on disk

  @Column()
  mimetype: string;

  @Column({ type: 'int' })
  size: number; // bytes

  @Column()
  entityType: string; // 'client', 'task', 'shipment', etc.

  @Column()
  entityId: number;

  @CreateDateColumn()
  createdAt: Date;
}
