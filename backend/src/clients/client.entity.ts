import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { PdfTemplate } from '../modules/pdf-templates/entities/pdf-template.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PdfTemplate, { nullable: true, eager: true, onDelete: 'SET NULL' })
  preferredPdfTemplate: PdfTemplate;

  @Column({ nullable: true })
  code: string;

  @Column()
  businessName: string;

  @Column({ nullable: true })
  taxId: string; // RUT de Uruguay (12 dígitos)

  @Column({ default: true })
  isClient: boolean;

  @Column({ default: false })
  isSupplier: boolean;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  segment: string; // e.g. VIP, Standard

  @Column({ default: 'Activo' })
  status: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  companyEmail: string;

  @Column({ nullable: true, default: '30 días' })
  paymentTerms: string;

  @Column({ type: 'int', default: 5 })
  rating: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
