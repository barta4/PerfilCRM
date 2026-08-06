const fs = require('fs');
const path = require('path');

const modules = [
  { name: 'clients', entityName: 'Client', fileName: 'client.entity' },
  { name: 'contacts', entityName: 'Contact', fileName: 'contact.entity' },
  { name: 'events', entityName: 'Event', fileName: 'event.entity' },
  { name: 'visits', entityName: 'Visit', fileName: 'visit.entity' },
  { name: 'tasks', entityName: 'Task', fileName: 'task.entity' },
  { name: 'shipments', entityName: 'Shipment', fileName: 'shipment.entity' },
];

const basePath = path.join(__dirname, 'src');

modules.forEach(mod => {
  const dir = path.join(basePath, mod.name);
  
  const moduleCode = `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${mod.entityName}sController } from './${mod.name}.controller';
import { ${mod.entityName}sService } from './${mod.name}.service';
import { ${mod.entityName} } from './${mod.fileName}';

@Module({
  imports: [TypeOrmModule.forFeature([${mod.entityName}])],
  controllers: [${mod.entityName}sController],
  providers: [${mod.entityName}sService],
  exports: [TypeOrmModule, ${mod.entityName}sService],
})
export class ${mod.entityName}sModule {}
`;

  const controllerCode = `import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ${mod.entityName}sService } from './${mod.name}.service';
import { ${mod.entityName} } from './${mod.fileName}';

@Controller('${mod.name}')
export class ${mod.entityName}sController {
  constructor(private readonly service: ${mod.entityName}sService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() data: Partial<${mod.entityName}>) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<${mod.entityName}>) {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
`;

  const serviceCode = `import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ${mod.entityName} } from './${mod.fileName}';

@Injectable()
export class ${mod.entityName}sService {
  constructor(
    @InjectRepository(${mod.entityName})
    private repository: Repository<${mod.entityName}>,
  ) {}

  findAll(): Promise<${mod.entityName}[]> {
    return this.repository.find();
  }

  findOne(id: number): Promise<${mod.entityName} | null> {
    return this.repository.findOneBy({ id } as any);
  }

  create(data: Partial<${mod.entityName}>): Promise<${mod.entityName}> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: number, data: Partial<${mod.entityName}>): Promise<${mod.entityName} | null> {
    await this.repository.update(id, data as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
`;

  fs.writeFileSync(path.join(dir, `${mod.name}.module.ts`), moduleCode);
  fs.writeFileSync(path.join(dir, `${mod.name}.controller.ts`), controllerCode);
  fs.writeFileSync(path.join(dir, `${mod.name}.service.ts`), serviceCode);
});

console.log('CRUD logic generated successfully!');
