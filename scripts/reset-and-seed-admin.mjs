 
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "jandreycaceres@unicesar.edu.co";
  const adminPassword = "Sopas123#";
  const adminName = "Jhoan Caceres";
  const adminDocument = "0000000000";
  const adminProgram = "Ingeniería de Sistemas";

  console.log("-- Resetting data (keeping training modules)...");

  await prisma.trainingProgress.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.ventureUpdate.deleteMany({});
  await prisma.venture.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.verificationToken.deleteMany({});

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      role: Role.ADMIN,
      passwordHash,
      profile: {
        create: {
          fullName: adminName,
          documentNumber: adminDocument,
          program: adminProgram,
        },
      },
    },
  });

  console.log("✅ Reset complete. Admin user created:", adminEmail);
}

main()
  .catch((err) => {
    console.error("❌ Error resetting database", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
