'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTopics } from '@/lib/api/topics';
import { FileText, FilePlus, Eye, PenSquare } from 'lucide-react';
import { ClientAuthCheck } from '@/components/admin/ClientAuthCheck';

async function DashboardStats() {
  try {
    // Fetch all topics to calculate stats
    const topicsData = await getTopics({ limit: 1000 });
    const topics = topicsData.items;

    const totalTopics = topics.length;
    const publishedTopics = topics.filter(
      (topic) => topic.article?.status === 'PUBLISHED'
    ).length;
    const draftTopics = topics.filter(
      (topic) => topic.article?.status === 'DRAFT'
    ).length;

    const stats = [
      {
        label: 'Total Topics',
        value: totalTopics,
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        label: 'Published',
        value: publishedTopics,
        icon: Eye,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
      {
        label: 'Drafts',
        value: draftTopics,
        icon: PenSquare,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  } catch (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-8">
        <p className="text-sm">Failed to load dashboard statistics</p>
      </div>
    );
  }
}

function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ClientAuthCheck>
      <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome to your CMS dashboard. Manage your content and monitor your site.
        </p>
      </div>

      {/* Stats cards */}
      <Suspense fallback={<StatsLoadingSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Quick actions */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/topics/new">
            <Button className="w-full justify-start h-auto py-4 transition-all duration-200 hover:scale-105" size="lg">
              <FilePlus className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Create New Topic</div>
                <div className="text-xs opacity-90">
                  Start writing a new article
                </div>
              </div>
            </Button>
          </Link>

          <Link href="/admin/topics">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 transition-all duration-200 hover:scale-105"
              size="lg"
            >
              <FileText className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Manage Topics</div>
                <div className="text-xs opacity-90">
                  View and edit all topics
                </div>
              </div>
            </Button>
          </Link>

          <Link href="/">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 transition-all duration-200 hover:scale-105"
              size="lg"
            >
              <Eye className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">View Public Site</div>
                <div className="text-xs opacity-90">
                  See how visitors see your content
                </div>
              </div>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Recent activity placeholder */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Getting Started
        </h2>
        <div className="space-y-3 text-gray-600">
          <p className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-center font-semibold mr-3 flex-shrink-0">
              1
            </span>
            <span>
              Create your first topic by clicking "Create New Topic" above
            </span>
          </p>
          <p className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-center font-semibold mr-3 flex-shrink-0">
              2
            </span>
            <span>
              Write engaging content with the rich text editor
            </span>
          </p>
          <p className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-center font-semibold mr-3 flex-shrink-0">
              3
            </span>
            <span>
              Add FAQ items to provide comprehensive answers
            </span>
          </p>
          <p className="flex items-start">
            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-center font-semibold mr-3 flex-shrink-0">
              4
            </span>
            <span>
              Publish your content and view it on the public site
            </span>
          </p>
        </div>
      </Card>
    </div>
    </ClientAuthCheck>
  );
}
