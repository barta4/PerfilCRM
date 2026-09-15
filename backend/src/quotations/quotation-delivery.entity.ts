import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Quotation } from './quotation.entity';
import { QuotationItem } from './quotation-item.entity';
import { User } from '../auth/user.entity';

@Entity('quotation_deliveries')
export class QuotationDelivery {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Quotation, (quotation) => quotation.deliveries, {
    onDelete: 'CASCADE',
  })
  quotation: Quotation;

  @ManyToOne(() => QuotationItem, {
    onDelete: 'CASCADE',
    eager: true,
    nullable: true,
  })
  item: QuotationItem;

  @Column({ nullable: true })
  productName: string; // Respaldo del nombre de grano / producto

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  quantityDelivered: number; // Toneladas o unidades entregadas en este despacho

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  deliveryDate: Date;

  @Column({ nullable: true })
  remitoNumber: string; // N° de Remito / Guía de Traslado (DGI / Acopio)

  @Column({ nullable: true })
  truckPlate: string; // Matrícula del camión / chasis / acoplado

  @Column({ nullable: true })
  driverName: string; // Nombre del chofer o empresa de transporte

  @Column('text', { nullable: true })
  notes: string; // Observaciones de pesaje, silo de descarga, etc.

  @ManyToOne(() => User, { nullable: true, eager: true, onDelete: 'SET NULL' })
  deliveredBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
