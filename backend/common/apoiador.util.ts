import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Recurso exclusivo para apoiadores ativos (admins também têm acesso). */
export async function assertApoiadorAtivo(
  prisma: PrismaService,
  userId: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isApoiadorAtivo: true, isAdmin: true },
  });
  if (!user || (!user.isApoiadorAtivo && !user.isAdmin)) {
    throw new ForbiddenException('Recurso exclusivo para apoiadores ativos.');
  }
}
