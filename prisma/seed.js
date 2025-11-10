import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { encryptText } from '../src/utils/crypto.js';

const prisma = new PrismaClient();

async function main() {

  // ✅ SAB purana data remove
  await prisma.user.deleteMany();

  const adminPass = 'admin123';
  const hashedAdmin = await hash(adminPass, 10);
  const encryptedAdmin = encryptText(adminPass);

  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedAdmin,
      encryptedPassword: encryptedAdmin,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User'
    }
  });

  console.log('✅ Admin Seeded Successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
