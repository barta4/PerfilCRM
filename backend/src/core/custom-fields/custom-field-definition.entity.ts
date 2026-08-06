import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('custom_field_definitions')
@Index(['entityType', 'key'], { unique: true })
export class CustomFieldDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityType: string; // e.g. 'client', 'quotation', 'visit', 'task', 'product', 'inspection'

  @Column()
  key: string; // Internal identifier e.g. 'hectares', 'vessel_imo', 'crop_type'

  @Column()
  label: string; // Human readable label e.g. 'Superficie (Ha)', 'IMO Buque', 'Tipo de Cereal'

  @Column({ default: 'string' })
  type: 'string' | 'number' | 'select' | 'date' | 'boolean' | 'textarea';

  @Column({ type: 'jsonb', nullable: true, default: [] })
  options: string[]; // Options for 'select' type e.g. ['Trigo', 'Maíz', 'Soja']

  @Column({ default: false })
  required: boolean;

  @Column({ nullable: true })
  defaultValue: string;

  @Column({ default: 0 })
  order: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
