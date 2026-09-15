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
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModulesGuard } from '../auth/modules.guard';
import { RequireModule } from '../auth/require-module.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join, basename } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';
import type { Response } from 'express';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

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
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Tipo de archivo no permitido (${file.mimetype}). Solo se permiten documentos (PDF, Word, Excel, CSV, Texto) e imágenes.`,
            ),
            false,
          );
        }
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo en la petición');
    }

    const parsedId = Number(entityId);
    const doc = this.repo.create({
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      entityType: entityType || 'client',
      entityId: Number.isFinite(parsedId) ? parsedId : 0,
    });
    return this.repo.save(doc);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findByEntity(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    const parsedId = Number(entityId);
    return this.repo.find({
      where: { entityType, entityId: Number.isFinite(parsedId) ? parsedId : 0 },
      order: { createdAt: 'DESC' },
    });
  }

  @Get(':filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const safeFilename = basename(filename);
    if (
      safeFilename !== filename ||
      filename.includes('..') ||
      !/^[a-zA-Z0-9_\-\.]+$/.test(filename)
    ) {
      throw new BadRequestException('Ruta de archivo inválida');
    }

    const uploadDir = join(process.cwd(), 'uploads');
    const filePath = join(uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado');
    }

    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(filePath);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    const doc = await this.repo.findOneBy({ id: +id });
    if (doc) {
      const uploadDir = join(process.cwd(), 'uploads');
      const safeFilename = basename(doc.filename);
      const filePath = join(uploadDir, safeFilename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('[DocumentsController] Error unlinking physical file:', err);
        }
      }
      await this.repo.delete(+id);
    }
    return { success: true };
  }
}
