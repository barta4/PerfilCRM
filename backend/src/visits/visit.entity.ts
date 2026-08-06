import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { User } from '../auth/user.entity';

@Entity('visits')
export class Visit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'Llamada' })
  communicationType: string; // Llamada, Reunión, Email, WhatsApp, Otro

  @Column({ nullable: true })
  subject: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkInLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkInLng: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkOutLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkOutLng: number;

  @Column({ type: 'timestamp', nullable: true })
  checkInTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkOutTime: Date;

  @Column('text', { nullable: true })
  notes: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE', eager: true })
  client: Client;

  @ManyToOne(() => User, { nullable: true, eager: true })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
