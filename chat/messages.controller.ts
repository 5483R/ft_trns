import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from "@nestjs/common";
import { PrismaClient } from '@prisma/client';
import { AddMemberDto, CreateRoomDto, CreateRoomwithMemebrs } from './dto/room.dto';
import { MessagesService } from "./messages.service";
import { MessageDto } from "./dto/create-message.dto";
import { JwtAuthGuard } from "src/auth/auth-guard/jwt-guard";
import { ApiTags } from "@nestjs/swagger";



 
@Controller('room')
@UseGuards(JwtAuthGuard)
@ApiTags('Chat')
export class RoomsController {
    constructor(private readonly messagesservice: MessagesService) {}


    @Post('/create')
async createRoomAndMembership(@Body() createRoomWithMembers: CreateRoomwithMemebrs, @Req() req) {
  const { room } = createRoomWithMembers;

  const createdRoom = await this.messagesservice.createRoom(room);
  if(!createdRoom)
    return false;
  const createdMembership = await this.messagesservice.createMembership(
    createdRoom.RoomId,
    req.user.UserId);
    if(!createdMembership)
        return false;
    return true;
}

    @Get(':roomId/messages/')
    async getMessagesByRoomId(@Param('roomId', ParseIntPipe) roomId: number) {
        const messages = await this.messagesservice.getMessage(roomId);
        return messages;
    }

    @Delete(':roomId/Delete')
       async deleteRoom(@Req() req, @Param('roomId', ParseIntPipe) roomId: number) {
    await this.messagesservice.deleteRoom(roomId, req.user.UserId);
    return { message: 'Room deleted successfully' };
       }

       //should be admin or owner
    @Delete(':roomId/kick/:userId')
    async kickUserFromRoom(@Req() req, @Param('roomId', ParseIntPipe) roomId: number, @Param('userId') userId: string,){
        await this.messagesservice.kickFromRoom(roomId, userId, req.user.UserId);
        return { message: 'User Kicked' };
      }

    @Delete(':roomId/leave/:userId')
    async leaveRoom(@Req() req, @Param('roomId', ParseIntPipe) roomId: number, @Param('userId') userId: string,) {
        await this.messagesservice.leaveRoom(roomId, req.user.UserId);
        return { message: 'Leaved Room' };
    }

    
//should be admin or owner
    @Post(':roomId/addmember')
    async addMemberToRoom(@Req() req, @Param('roomId', ParseIntPipe) roomId: number, @Body() addmemberdto: AddMemberDto) {
        const { userId } = addmemberdto;
      
        const createnewmember = await this.messagesservice.addMemberToRoom(roomId, userId, req.user.UserId);
        return {
          membership: createnewmember,
          message: 'Member added',
        };
    } 
//should be admin or owner
    @Post(':roomId/mute/:membershipid')
    async muteMember(@Req() req, @Param('membershipid', ParseIntPipe) membershipid: number, @Param('roomId', ParseIntPipe) roomId: number ) {
    
      await this.messagesservice.muteMember(req.user.UserId, membershipid, roomId);

      return { message: 'Member muted' };
    };
//should be admin or owner
    @Post(':roomId/ban/:membershipid')
    async BannedMember(@Req() req, @Param('membershipid', ParseIntPipe) membershipid: number, @Param('roomId', ParseIntPipe) roomId: number ) {
    
      await this.messagesservice.BannedMember(req.user.UserId, membershipid, roomId);

      return { message: 'Member banned' };
    };

    @Post(':roomId/umute/:membershipid')
    async ummuteMember(@Req() req, @Param('membershipid', ParseIntPipe) membershipid: number, @Param('roomId', ParseIntPipe) roomId: number ) {
    
      await this.messagesservice.unmuteMember(req.user.UserId, membershipid, roomId);

      return { message: 'Member unmuted' };
    };
//should be admin or owner
    @Post(':roomId/unban/:membershipid')
    async unBannedMember(@Req() req, @Param('membershipid', ParseIntPipe) membershipid: number, @Param('roomId', ParseIntPipe) roomId: number ) {
    
      await this.messagesservice.unBannedMember(req.user.UserId, membershipid, roomId);

      return { message: 'Member unbanned' };
    };

    @Get('/rooms')
    async getRooms(@Req() req) {
      const userId = req.user.UserId;
      const messages = await this.messagesservice.getRooms(userId);
        return messages;
    }

    // @Post('joinroom/:roomId')
    // async joinexistedroom(@Req() req, @Param('roomId', ParseIntPipe) roomId: number) {
      
    //     const joinroom = await this.joinexistedroom(req.user.UserId, roomId);
    //     return {
    //       membership: joinroom,
    //       message: 'U re joined',
    //     };
    // } 
    
  }






    //get messages base on room id 
    //delete group  base on room id {1-delete membrships+ 2-delete messages + 3-delete room}
    //kick from group
    //add membership
    //quite group
    //send message(store on database)
