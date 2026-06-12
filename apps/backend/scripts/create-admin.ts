import bcrypt from 'bcryptjs';
import { prisma } from '@rydo/db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin';

  if (!email || !password) {
    console.error('❌ Usage: npx tsx scripts/create-admin.ts <email> <password> [name]');
    process.exit(1);
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.error(`❌ User with email ${email} already exists!`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN'
      }
    });

    console.log(`\n🚀 Admin account created successfully!`);
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`👤 Name: ${adminUser.name}`);
    console.log(`🔑 Role: ${adminUser.role}\n`);
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
