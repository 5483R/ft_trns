import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './entities/message.entity';
import { PrismaClient } from '@prisma/client';
import { CreateMembershipDto, CreateRoomDto } from './dto/room.dto';


@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaClient) {}

  messages: Message[] = [{ name: 'Saber', text: 'Heey' }];
  clientToUser = {};
  identify(name: string, clientId: string ){
    this.clientToUser[clientId] = name;

    return Object.values(this.clientToUser);
  }

  getClientName(clientId: string){
    return this.clientToUser[clientId];
  }
  create(createMessageDto: CreateMessageDto, clientId: string) {
    const message = { 
      name: this.clientToUser[clientId],
      text: createMessageDto.text,
    };
    this.messages.push(message);

    return message;
  }

  findAll() {
    return this.messages;
  }

  async createRoom(createRoomDto : CreateRoomDto) {
    const {name, password, isChannel } = createRoomDto;

    const room = await this.prisma.room.create({
      data: {
        RoomNAme : name,
        ischannel : isChannel,
        Password : password,
      },
    });

    return room;
  }
  async createMemberShip(createmembershipdto: CreateMembershipDto) {
    const {roomId, userId, IsBanned, IsMuted } = createmembershipdto;

    const membership = await this.prisma.membership.create({
      data: {
        RoomId: roomId,
        UserId: userId,
        isBanned: IsBanned,
        isMuted: IsMuted,
      },
    });
  
    return membership;
  }
}