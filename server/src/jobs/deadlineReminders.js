import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendDeadlineReminder } from '../services/emailService.js';

const prisma = new PrismaClient();

async function checkDeadlines() {
  const now = new Date();

  // Get all universities with upcoming deadlines, with their user
  const universities = await prisma.university.findMany({
    where: {
      applicationDeadline: { not: null },
      status: { notIn: ['submitted', 'accepted', 'rejected'] },
    },
    include: { user: true },
  });

  for (const uni of universities) {
    const deadline = new Date(uni.applicationDeadline);
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    const reminders = [
      { days: 30, field: 'reminder30SentAt' },
      { days: 14, field: 'reminder14SentAt' },
      { days: 7,  field: 'reminder7SentAt' },
    ];

    for (const { days, field } of reminders) {
      if (daysLeft === days && !uni[field]) {
        try {
          await sendDeadlineReminder({
            to: uni.user.email,
            name: uni.user.name,
            universityName: uni.name,
            program: uni.program,
            daysLeft,
            deadline: uni.applicationDeadline,
          });
          await prisma.university.update({
            where: { id: uni.id },
            data: { [field]: now },
          });
          console.log(`Reminder sent: ${uni.user.email} → ${uni.name} (${days}d)`);
        } catch (err) {
          console.error(`Failed reminder for ${uni.name}:`, err.message);
        }
      }
    }
  }
}

export function startDeadlineReminders() {
  // Run daily at 9am
  cron.schedule('0 9 * * *', checkDeadlines);
  console.log('Deadline reminder cron started');
}
