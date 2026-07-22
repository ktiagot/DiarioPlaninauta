import { User } from '@prisma/client';
import { UserResponseDto } from '../dto/user-response.dto';

export function toUserResponse(user: User): UserResponseDto {
  const { passwordHash: _, token: __, ...safeUser } = user;
  return safeUser as UserResponseDto;
}
