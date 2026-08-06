import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { Client } from '../clients/client.entity';
import { Task } from '../tasks/task.entity';
import { Visit } from '../visits/visit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Task, Visit])],
  controllers: [ReportsController],
})
export class ReportsModule {}
