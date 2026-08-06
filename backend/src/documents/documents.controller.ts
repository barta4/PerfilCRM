import {
  Controller,
  Post,
  Get,
  Delete,
  Query,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModulesGuard } from '../auth/modules.guard';
import { RequireModule } from '../auth/require-module.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';
import type { Response } from 'express';

const storage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${extname(file.originalname)}`);
  },
});

@Controller('documents')
export class DocumentsController {
  constructor(
    @InjectRepository(Document)
    private repo: Repository<Document>,
  ) {}

  @Post('upload')
  @RequireModule('clients')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    console.log('[DocumentsController] Upload attempt:', {
      entityType,
      entityId,
      file: file?.originalname,
    });

    if (!file) {
      throw new Error('No se recibió ningún archivo en la petición');
    }

    const doc = this.repo.create({
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      entityType,
      entityId: +entityId,
    });
    return this.repo.save(doc);
  }

  @Get()
  @RequireModule('clients')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  findByEntity(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.repo.find({
      where: { entityType, entityId: +entityId },
      order: { createdAt: 'DESC' },
    });
  }

  @Get(':filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const uploadDir = join(process.cwd(), 'uploads');
    const filePath = join(uploadDir, filename);
    if (!filePath.startsWith(uploadDir)) {
      throw new Error('Invalid file path');
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }

    console.log('[DocumentsController] Serving file:', filePath);
    return res.sendFile(filePath);
  }

  @Delete(':id')
  @RequireModule('clients')
  @UseGuards(JwtAuthGuard, ModulesGuard)
  async remove(@Param('id') id: string) {
    await this.repo.delete(+id);
    return { success: true };
  }
}
