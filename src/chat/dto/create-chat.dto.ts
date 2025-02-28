import { IsNotEmpty, IsString } from "class-validator";

export class CreateChatDto {
    @IsString()
    @IsNotEmpty()
    senderId: string;

    @IsString()
    @IsNotEmpty()
    receiverId: string;

    @IsString()
    @IsNotEmpty()
    content: string;
}
