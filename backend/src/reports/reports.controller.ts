import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModulesGuard } from '../auth/modules.guard';
import { RequireModule } from '../auth/require-module.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../clients/client.entity';
import { Task } from '../tasks/task.entity';
import { Visit } from '../visits/visit.entity';
import type { Response } from 'express';
import * as ExcelJS from 'exceljs';

@Controller('reports')
@RequireModule('reports')
@UseGuards(JwtAuthGuard, ModulesGuard)
export class ReportsController {
  constructor(
    @InjectRepository(Client) private clientRepo: Repository<Client>,
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(Visit) private visitRepo: Repository<Visit>,
  ) {}

  @Get('summary')
  async summary() {
    const [totalClients, totalTasks, totalVisits] = await Promise.all([
      this.clientRepo.count(),
      this.taskRepo.count(),
      this.visitRepo.count(),
    ]);

    const activeClients = await this.clientRepo.count({
      where: { status: 'Activo' },
    });
    const pendingTasks = await this.taskRepo.count({
      where: [{ status: 'To Do' }, { status: 'In Progress' }],
    });

    return {
      totalClients,
      activeClients,
      totalTasks,
      pendingTasks,
      totalVisits,
    };
  }

  @Get('tasks-by-status')
  async tasksByStatus() {
    const statuses = ['To Do', 'In Progress', 'Done', 'Cancelled'];
    const data = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await this.taskRepo.count({ where: { status } as any }),
      })),
    );
    return data;
  }

  @Get('clients-by-status')
  async clientsByStatus() {
    const statuses = ['Activo', 'Inactivo', 'Potencial', 'Suspendido'];
    const data = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await this.clientRepo.count({ where: { status } as any }),
      })),
    );
    return data;
  }

  @Get('export/clients.xlsx')
  async exportClients(@Res() res: Response) {
    const clients = await this.clientRepo.find();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Clientes');
    ws.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Código', key: 'code', width: 15 },
      { header: 'Razón Social', key: 'businessName', width: 40 },
      { header: 'RUT/CI', key: 'taxId', width: 20 },
      { header: 'Industria', key: 'industry', width: 25 },
      { header: 'Segmento', key: 'segment', width: 15 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Dirección', key: 'address', width: 40 },
      { header: 'Creado', key: 'createdAt', width: 22 },
    ];
    // Header styling
    ws.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF003B5C' },
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });
    clients.forEach((c) => ws.addRow(c));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=clientes_pureza.xlsx',
    );
    await wb.xlsx.write(res);
    res.end();
  }

  @Get('export/visits.xlsx')
  async exportVisits(@Res() res: Response) {
    const visits = await this.visitRepo.find({ relations: ['client'] });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Visitas');
    ws.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Cliente', key: 'client', width: 35 },
      { header: 'Check-in', key: 'checkInTime', width: 22 },
      { header: 'Check-out', key: 'checkOutTime', width: 22 },
      { header: 'Latitud', key: 'checkInLat', width: 15 },
      { header: 'Longitud', key: 'checkInLng', width: 15 },
      { header: 'Drop-in', key: 'isDropIn', width: 10 },
      { header: 'Notas', key: 'notes', width: 50 },
    ];
    ws.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF003B5C' },
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });
    visits.forEach((v) =>
      ws.addRow({
        ...v,
        client: v.client?.businessName || '',
        communicationType: v.communicationType || 'Llamada',
      }),
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=visitas_perfilgranos.xlsx',
    );
    await wb.xlsx.write(res);
    res.end();
  }

  @Get('export/tasks.xlsx')
  async exportTasks(@Res() res: Response) {
    const tasks = await this.taskRepo.find({ relations: ['client'] });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Tareas');
    ws.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Título', key: 'title', width: 40 },
      { header: 'Cliente', key: 'client', width: 35 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Prioridad', key: 'priority', width: 12 },
      { header: 'Vence', key: 'dueDate', width: 22 },
    ];
    ws.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE91E63' },
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });
    tasks.forEach((t) =>
      ws.addRow({ ...t, client: t.client?.businessName || '' }),
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=tareas_pureza.xlsx',
    );
    await wb.xlsx.write(res);
    res.end();
  }
}
