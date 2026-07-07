import { UserResponseDto } from '../dto/user-response.dto';

type UserWithSecrets = UserResponseDto & {
  passwordHash: string | null;
  token: string | null;
};

export function toUserResponse(user: UserWithSecrets): UserResponseDto {
  const { passwordHash: _, token: __, ...safeUser } = user;
  return safeUser;
}
