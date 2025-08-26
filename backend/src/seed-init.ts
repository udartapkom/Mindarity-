import { INestApplication } from '@nestjs/common';
import { SeedService } from './modules/seed/seed.service';

export async function initializeSeedData(app: INestApplication) {
  try {
    const seedService = app.get(SeedService);
    await seedService.seed();
    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.log('⚠️ Database seeding failed:', error.message);
    console.log('You can manually run seed via POST /seed endpoint');
  }
}
