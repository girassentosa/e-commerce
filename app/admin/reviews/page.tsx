import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminReviewsClient from './AdminReviewsClient';

const PAGE_SIZE = 20;

async function getInitialReviews() {
  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: PAGE_SIZE,
    }),
    prisma.review.count(),
  ]);

  return {
    reviews: reviews.map((review) => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
    })),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
  };
}

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/reviews');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const { reviews, totalCount, totalPages } = await getInitialReviews();

  return (
    <AdminReviewsClient
      initialReviews={reviews}
      initialPagination={{
        page: 1,
        limit: PAGE_SIZE,
        totalPages,
        totalCount,
      }}
    />
  );
}

