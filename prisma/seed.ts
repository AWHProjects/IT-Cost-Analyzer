import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a test organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Acme Corporation',
      domain: 'acme.com',
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        fiscalYearStart: 'January',
      },
    },
  });

  console.log('✅ Created organization:', organization.name);

  // Create a test user
  const user = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      name: 'John Admin',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created user:', user.email);

  // Add user to organization
  await prisma.organizationMember.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: 'OWNER',
    },
  });

  console.log('✅ Added user to organization');

  // Create sample applications
  const applications = await Promise.all([
    prisma.application.create({
      data: {
        name: 'Microsoft 365',
        category: 'PRODUCTIVITY',
        vendor: 'Microsoft',
        description: 'Office productivity suite with Word, Excel, PowerPoint, and more',
        website: 'https://www.microsoft.com/microsoft-365',
        organizationId: organization.id,
      },
    }),
    prisma.application.create({
      data: {
        name: 'Slack',
        category: 'COMMUNICATION',
        vendor: 'Slack Technologies',
        description: 'Team communication and collaboration platform',
        website: 'https://slack.com',
        organizationId: organization.id,
      },
    }),
    prisma.application.create({
      data: {
        name: 'GitHub',
        category: 'DEVELOPMENT',
        vendor: 'GitHub Inc.',
        description: 'Code hosting and version control platform',
        website: 'https://github.com',
        organizationId: organization.id,
      },
    }),
    prisma.application.create({
      data: {
        name: 'Figma',
        category: 'DESIGN',
        vendor: 'Figma Inc.',
        description: 'Collaborative design and prototyping tool',
        website: 'https://figma.com',
        organizationId: organization.id,
      },
    }),
    prisma.application.create({
      data: {
        name: 'Salesforce',
        category: 'SALES',
        vendor: 'Salesforce Inc.',
        description: 'Customer relationship management platform',
        website: 'https://salesforce.com',
        organizationId: organization.id,
      },
    }),
  ]);

  console.log('✅ Created applications:', applications.map(app => app.name).join(', '));

  // Create sample licenses
  const licenses = await Promise.all([
    prisma.license.create({
      data: {
        applicationId: applications[0].id, // Microsoft 365
        organizationId: organization.id,
        licenseType: 'NAMED_USER',
        totalSeats: 100,
        usedSeats: 85,
        costPerSeat: 12.50,
        billingCycle: 'MONTHLY',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        notes: 'Business Premium plan',
      },
    }),
    prisma.license.create({
      data: {
        applicationId: applications[1].id, // Slack
        organizationId: organization.id,
        licenseType: 'NAMED_USER',
        totalSeats: 50,
        usedSeats: 42,
        costPerSeat: 8.00,
        billingCycle: 'MONTHLY',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        notes: 'Pro plan',
      },
    }),
    prisma.license.create({
      data: {
        applicationId: applications[2].id, // GitHub
        organizationId: organization.id,
        licenseType: 'NAMED_USER',
        totalSeats: 25,
        usedSeats: 20,
        costPerSeat: 4.00,
        billingCycle: 'MONTHLY',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        notes: 'Team plan',
      },
    }),
    prisma.license.create({
      data: {
        applicationId: applications[3].id, // Figma
        organizationId: organization.id,
        licenseType: 'NAMED_USER',
        totalSeats: 15,
        usedSeats: 8,
        costPerSeat: 12.00,
        billingCycle: 'MONTHLY',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        notes: 'Professional plan',
      },
    }),
    prisma.license.create({
      data: {
        applicationId: applications[4].id, // Salesforce
        organizationId: organization.id,
        licenseType: 'NAMED_USER',
        totalSeats: 20,
        usedSeats: 18,
        costPerSeat: 75.00,
        billingCycle: 'MONTHLY',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        notes: 'Professional edition',
      },
    }),
  ]);

  console.log('✅ Created licenses for all applications');

  // Create sample usage data for the last 30 days
  const usageData: any[] = [];
  const now = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    
    for (const [index, application] of applications.entries()) {
      const baseUsers = [85, 42, 20, 8, 18][index];
      const variance = Math.floor(Math.random() * 10) - 5; // ±5 users
      const activeUsers = Math.max(1, baseUsers + variance);
      
      usageData.push({
        applicationId: application.id,
        licenseId: licenses[index].id,
        date,
        activeUsers,
        totalSessions: activeUsers * (Math.floor(Math.random() * 3) + 1),
        duration: activeUsers * (Math.floor(Math.random() * 240) + 60), // 60-300 minutes
        features: {
          topFeatures: ['login', 'dashboard', 'reports'],
          sessionDuration: Math.floor(Math.random() * 120) + 30,
        },
      });
    }
  }

  await prisma.usageData.createMany({
    data: usageData,
  });

  console.log('✅ Created usage data for the last 30 days');

  // Create sample alerts
  await Promise.all([
    prisma.alert.create({
      data: {
        title: 'Unused Licenses Detected',
        message: 'Figma has 7 unused licenses that could be reallocated or cancelled',
        type: 'UNUSED_LICENSE',
        severity: 'MEDIUM',
        organizationId: organization.id,
        metadata: {
          applicationName: 'Figma',
          unusedLicenses: 7,
          potentialSavings: 84.00,
        },
      },
    }),
    prisma.alert.create({
      data: {
        title: 'License Expiring Soon',
        message: 'Microsoft 365 license expires in 30 days',
        type: 'EXPIRING_LICENSE',
        severity: 'HIGH',
        organizationId: organization.id,
        metadata: {
          applicationName: 'Microsoft 365',
          expirationDate: '2024-12-31',
          daysRemaining: 30,
        },
      },
    }),
    prisma.alert.create({
      data: {
        title: 'Cost Spike Detected',
        message: 'Salesforce costs increased by 15% this month',
        type: 'COST_SPIKE',
        severity: 'HIGH',
        organizationId: organization.id,
        metadata: {
          applicationName: 'Salesforce',
          percentageIncrease: 15,
          previousCost: 1500.00,
          currentCost: 1725.00,
        },
      },
    }),
  ]);

  console.log('✅ Created sample alerts');

  // Create a sample integration
  await prisma.integration.create({
    data: {
      name: 'Microsoft Graph API',
      type: 'SAAS_API',
      applicationId: applications[0].id, // Microsoft 365
      organizationId: organization.id,
      config: {
        clientId: 'sample-client-id',
        tenantId: 'sample-tenant-id',
        scopes: ['User.Read', 'Reports.Read.All'],
      },
      status: 'ACTIVE',
      lastSync: new Date(),
      syncFrequency: '0 0 * * *', // Daily at midnight
    },
  });

  console.log('✅ Created sample integration');

  console.log('🎉 Database seed completed successfully!');
  
  // Print summary
  const summary = await prisma.organization.findFirst({
    include: {
      applications: true,
      licenses: true,
      alerts: true,
      integrations: true,
    },
  });

  console.log('\n📊 Seed Summary:');
  console.log(`- Organization: ${summary?.name}`);
  console.log(`- Applications: ${summary?.applications.length}`);
  console.log(`- Licenses: ${summary?.licenses.length}`);
  console.log(`- Alerts: ${summary?.alerts.length}`);
  console.log(`- Integrations: ${summary?.integrations.length}`);
  console.log(`- Usage Data Points: ${usageData.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });