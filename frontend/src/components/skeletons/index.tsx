import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

export function HackathonCardSkeleton() {
  return (
    <Card className="flex flex-col border border-gray-100 bg-white rounded-2xl overflow-hidden p-0 shadow-xs">
      <CardHeader className="p-5 pb-3 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4 rounded-md" />
        <Skeleton className="h-3.5 w-1/2 rounded-md" />
      </CardHeader>
      <CardContent className="p-5 pt-0 flex-1 space-y-4">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <Skeleton className="h-3.5 w-40 rounded-md" />
          <Skeleton className="h-3.5 w-32 rounded-md" />
          <Skeleton className="h-3.5 w-36 rounded-md" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-3 flex gap-2 border-t border-gray-100 bg-gray-50/40">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </CardFooter>
    </Card>
  );
}

export function TeamCardSkeleton() {
  return (
    <Card className="flex flex-col justify-between border border-gray-100 bg-white rounded-2xl overflow-hidden shadow-xs p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1.5 flex-1 pr-3">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-3.5 w-48 rounded-md" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <Skeleton className="h-4 w-full rounded-md" />
      <Skeleton className="h-4 w-4/5 rounded-md" />

      <div className="flex gap-1.5 pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-20 rounded-md" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar Skeleton */}
      <div className="px-6 py-4 bg-white shadow-xs border-b border-gray-100 flex items-center justify-between">
        <Skeleton className="h-7 w-28 rounded-md" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-20 rounded-md hidden md:block" />
          <Skeleton className="h-5 w-16 rounded-md hidden md:block" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        {/* Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 rounded-md" />
              <Skeleton className="h-4 w-64 rounded-md" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
          ))}
        </div>

        {/* Squad Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-36 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <TeamCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
      {[1, 2, 3, 4].map((i) => {
        const isSelf = i % 2 === 0;
        return (
          <div
            key={i}
            className={`flex items-end gap-2.5 ${isSelf ? 'justify-end' : 'justify-start'}`}
          >
            {!isSelf && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
            <div className={`space-y-1.5 max-w-xs sm:max-w-md ${isSelf ? 'items-end' : 'items-start'}`}>
              <Skeleton className={`h-3 w-20 rounded-md ${isSelf ? 'ml-auto' : ''}`} />
              <Skeleton className={`h-12 w-48 sm:w-64 rounded-2xl ${isSelf ? 'rounded-br-xs' : 'rounded-bl-xs'}`} />
            </div>
            {isSelf && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="p-2 space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 bg-gray-50/70 rounded-xl space-y-1.5 border border-gray-100">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-3/4 rounded-md" />
        </div>
      ))}
    </div>
  );
}
