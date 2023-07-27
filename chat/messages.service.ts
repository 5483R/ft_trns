import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateMessageDto, MessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './entities/message.entity';
import { PrismaClient } from '@prisma/client';
import { CreateMembershipDto, CreateRoomDto } from './dto/room.dto';
import { StringDecoder } from 'string_decoder';
import * as bcrypt from 'bcrypt'
 
@Injectable()
export class MessagesService {

  constructor(private readonly prisma: PrismaClient) {}

  // messages: Message[] = [{ name: 'Saber', text: 'Heey' }];
  // clientToUser = {};
  // identify(name: string, clientId: string ){
  //   this.clientToUser[clientId] = name;

  //   return Object.values(this.clientToUser);
  // }

  // getClientName(clientId: string){
  //   return this.clientToUser[clientId];
  // }
  // create(createMessageDto: CreateMessageDto, clientId: string) {
  //   const message = { 
  //     name: this.clientToUser[clientId],
  //     text: createMessageDto.text,
  //   };
  //   this.messages.push(message);

  //   return message;
  // }

  // async findAll() {
  //   return this.messages;
  // }

  async createRoom(createRoomDto : CreateRoomDto) {

    const {name, password, type } = createRoomDto;
    if (type == 'protected') {
     if(!password)
      throw new NotFoundException ('password makaynch');
     else{
          const hashedPassword = await bcrypt.hash(password, 10);
          const room = await this.prisma.room.create({
            data: {
              RoomNAme : name,
              ischannel : true,
              Password : hashedPassword,
              Type : type, //protected //private //public
            },
          });
          return room;
    }
  }
  else{
    const room = await this.prisma.room.create({
      data: {
        RoomNAme : name,
        ischannel : true,
        Password : '',
        Type : type,
      },
    });
    return room;
  } 
}
  async   createMembership(roomId: number, userId: string) {
    const membership = await this.prisma.membership.create({
      data: {
        room: { connect: { RoomId: roomId } },
        member: { connect: { UserId: userId } },
        Role: 'Owner', //member //admin
        isBanned:  false,
        isMuted:  false,
      },
    });
  
    return membership;
  }

async storeMessage(messageDto: MessageDto) {
  const { roomId, userId, Content } = messageDto;

  const texts = await this.prisma.message.create({
    data: {
      room: { connect: { RoomId: roomId } },
      user: { connect: { UserId: userId } },
      Content: Content,
    },
  });
  return texts;
}

async deleteRoom(roomId: number, userId : string) {

  const membership = await this.prisma.membership.findFirst({
    where: {
      AND: [
        { RoomId: roomId },
        { UserId: userId },
      ],
    },
  });

  if(!membership)
  throw new UnauthorizedException('Membership doesnt exist');

  if (membership.Role !== 'Owner') {
    throw new UnauthorizedException('u dont have the right to delete room');
  }

  
  await this.prisma.message.deleteMany({
    where: {
      room: { RoomId: roomId },
    },
  });
  await this.prisma.membership.deleteMany({
    where: {
      room: { RoomId: roomId },
    },
  });

  return this.prisma.room.delete({
    where: {
      RoomId: roomId,
    },
  });

}

async kickFromRoom(roomId: number, userId: string, userIDmin : string) {
  const membership = await this.prisma.membership.findFirst({
    where: {
      AND: [
        { RoomId: roomId },
        { UserId: userIDmin},
      ],
    },
  });

  if(!membership)
  throw new UnauthorizedException('Membership doesnt exist');

  if (membership.Role !== 'Owner' && membership.Role !== 'Admin') {
    throw new UnauthorizedException('u dont have the right to kick');
  }

  await this.prisma.membership.deleteMany({
    where: {
      RoomId: roomId,
      UserId: userId,
    },
  });
}

async leaveRoom(roomId: number, userId: string) {
  await this.prisma.membership.deleteMany({
    where: {
      RoomId: roomId,
      UserId: userId,
    },
  });
}

async addMemberToRoom(roomId:number, userId: string, userIDmin :string){
  const membership = await this.prisma.membership.findFirst({
    where: {
      AND: [
        { RoomId: roomId },
        { UserId: userIDmin },
      ],
    },
  });

  if(!membership)
    throw new UnauthorizedException('Membership doesnt exist');

  if (membership.Role !== 'Owner' && membership.Role !== 'Admin') {
    throw new UnauthorizedException('u dont have the right to add');
  }
  const checkmember = await this.prisma.membership.findFirst({
    where: {
      AND: [
        { RoomId: roomId },
        { UserId: userId },
      ],
    },
  });

  if (checkmember) {
    throw new NotFoundException('User deja kayen f room!');
  }

  const addmembership = await this.prisma.membership.create({
    data: {
      RoomId : roomId,
      UserId : userId,
      isBanned : false,
      isMuted : false,
      Role : 'Member',
    },
    
  });
  
  return addmembership;
}

async muteMember(userId: string,  membershipId: number, roomid: number) {
  const membership = await this.prisma.membership.findFirst({
    where: {
      AND: [
        { UserId: userId },
      ],
    },
  });

  if (!membership) {
    throw new UnauthorizedException('Membership does not exist.');
  }

  if (membership.Role !== 'Owner' && membership.Role !== 'Admin') {
    throw new UnauthorizedException("You don't have the right to mute.");
  }

  await this.prisma.membership.update({
    where: {
      RoomId: roomid,
      MembershipId: membershipId,
    },
    data: {
      isMuted: true,
    },
  });
}

async BannedMember(userId: string,  membershipId: number, roomid: number) {

  const membership = await this.prisma.membership.findFirst({
    where: {
      AND: [
        { UserId: userId },
      ],
    },
  });

  if (!membership) {
    throw new UnauthorizedException('Membership does not exist.');
  }

  if (membership.Role !== 'Owner' && membership.Role !== 'Admin') {
    throw new UnauthorizedException("You don't have the right to ban.");
  }

  await this.prisma.membership.update({
    where: {
      RoomId: roomid,
      MembershipId: membershipId,
    },
    data: {
      isBanned: true,
    },
  });
}

async unmuteMember(userId: string,  membershipId: number, roomid: number) {
  const membership = await this.prisma.membership.findFirst({
    where: {
      AND: [
        { UserId: userId },
      ],
    },
  });

  if (!membership) {
    throw new UnauthorizedException('Membership does not exist.');
  }

  if (membership.Role !== 'Owner' && membership.Role !== 'Admin') {
    throw new UnauthorizedException("You don't have the right to mute.");
  }

  await this.prisma.membership.update({
    where: {
      RoomId: roomid,
      MembershipId: membershipId,
    },
    data: {
      isMuted: false,
    },
  });
}

async unBannedMember(userId: string,  membershipId: number, roomid: number) {

  const membership = await this.prisma.membership.findFirst({
    where: {
      AND: [
        { UserId: userId },
      ],
    },
  });

  if (!membership) {
    throw new UnauthorizedException('Membership does not exist.');
  }

  if (membership.Role !== 'Owner' && membership.Role !== 'Admin') {
    throw new UnauthorizedException("You don't have the right to ban.");
  }

  await this.prisma.membership.update({
    where: {
      RoomId: roomid,
      MembershipId: membershipId,
    },
    data: {
      isBanned: false,
    },
  });
}

async getMessage(roomid : number) {
  const messages = await this.prisma.message.findMany({
    where: {
      RoomId: roomid,
    },
  });
  return messages;
}

async getRooms(userid: string) {

  const messages = await this.prisma.room.findMany({
    where: {
      members: {
        some: {
          UserId: userid,
        },
      },
      ischannel : true,
    },
    include: {
      Message :{
        orderBy :{
          SendTime : 'desc',
        },
        take : 1
      },
    },
  });
  return messages;
}
async getroomsdms(userid: string)
{
  const messages = await this.prisma.room.findMany({
    where: {
      members: {
        some: {
          UserId: userid,
        },
      },
      ischannel : false,
    },
    include: {
      Message :{
        orderBy :{
          SendTime : 'desc',
        },
        take : 1
      },
      members: {
        include : {
          member: {
            select:{
              avatar : true,
              username: true,
              status: true,
            },
          },
        },
      },
    },

  })
  return messages;
}



// async joinexistedroom(req.user.UserId, roomId)

// async joinroom(roomid: string) {
//   const messages = await this.prisma.room.findMany({
//     where: {
//       members: {
//         some: {
//           UserId: userid,
//         },
//       },
//     },
//   });
//   return messages;
// }

}

