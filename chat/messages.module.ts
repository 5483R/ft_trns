import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { RoomsController } from './messages.controller';
import { PrismaClient } from '@prisma/client';

@Module({
  providers: [MessagesService, PrismaClient],
  controllers: [RoomsController]
})
export class MessagesModule {}