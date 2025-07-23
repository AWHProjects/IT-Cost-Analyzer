import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Log database queries in development
    if (process.env.NODE_ENV === 'development') {
      this.prisma.$on('query', (e: any) => {
        logger.debug('Database Query:', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        });
      });
    }

    // Log database errors
    this.prisma.$on('error', (e: any) => {
      logger.error('Database Error:', e);
    });

    // Log database info
    this.prisma.$on('info', (e: any) => {
      logger.info('Database Info:', e.message);
    });

    // Log database warnings
    this.prisma.$on('warn', (e: any) => {
      logger.warn('Database Warning:', e.message);
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from database:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  // Utility methods for common operations
  public async createUser(data: {
    email: string;
    name?: string;
    role?: 'ADMIN' | 'USER';
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  public async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });
  }

  public async createOrganization(data: {
    name: string;
    domain?: string;
    settings?: any;
  }) {
    return this.prisma.organization.create({
      data,
    });
  }

  public async addUserToOrganization(
    userId: string,
    organizationId: string,
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' = 'MEMBER'
  ) {
    return this.prisma.organizationMember.create({
      data: {
        userId,
        organizationId,
        role,
      },
    });
  }

  public async createApplication(data: {
    name: string;
    category: string;
    vendor: string;
    description?: string;
    website?: string;
    logoUrl?: string;
    organizationId: string;
  }) {
    return this.prisma.application.create({
      data: {
        ...data,
        category: data.category as any,
      },
    });
  }

  public async createLicense(data: {
    applicationId: string;
    organizationId: string;
    licenseType: string;
    totalSeats: number;
    usedSeats?: number;
    costPerSeat: number;
    billingCycle: string;
    startDate: Date;
    endDate?: Date;
    notes?: string;
  }) {
    return this.prisma.license.create({
      data: {
        ...data,
        licenseType: data.licenseType as any,
        billingCycle: data.billingCycle as any,
      },
    });
  }

  public async recordUsageData(data: {
    applicationId: string;
    licenseId?: string;
    userId?: string;
    date: Date;
    activeUsers?: number;
    totalSessions?: number;
    duration?: number;
    features?: any;
  }) {
    return this.prisma.usageData.create({
      data,
    });
  }

  public async createAlert(data: {
    title: string;
    message: string;
    type: string;
    severity?: string;
    userId?: string;
    organizationId: string;
    metadata?: any;
  }) {
    return this.prisma.alert.create({
      data: {
        ...data,
        type: data.type as any,
        severity: (data.severity as any) || 'MEDIUM',
      },
    });
  }

  public async getOrganizationAnalytics(organizationId: string) {
    const [
      totalApplications,
      totalLicenses,
      activeLicenses,
      inactiveLicenses,
      totalCost,
      recentUsage,
    ] = await Promise.all([
      this.prisma.application.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      this.prisma.license.count({
        where: { organizationId },
      }),
      this.prisma.license.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      this.prisma.license.count({
        where: { 
          organizationId, 
          OR: [
            { status: 'EXPIRED' },
            { status: 'CANCELLED' },
            { status: 'SUSPENDED' }
          ]
        },
      }),
      this.prisma.license.aggregate({
        where: { organizationId, status: 'ACTIVE' },
        _sum: {
          costPerSeat: true,
        },
      }),
      this.prisma.usageData.findMany({
        where: {
          application: {
            organizationId,
          },
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        include: {
          application: true,
        },
        orderBy: {
          date: 'desc',
        },
        take: 100,
      }),
    ]);

    return {
      totalApplications,
      totalLicenses,
      activeLicenses,
      inactiveLicenses,
      totalCost: totalCost._sum.costPerSeat || 0,
      recentUsage,
    };
  }
}

export const db = DatabaseService.getInstance();
export default DatabaseService;