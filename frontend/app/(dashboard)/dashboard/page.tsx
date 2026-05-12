'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Users, Clock, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api, Course } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      if (user) {
        const data = await api.courses.getUserCourses(user.id);
        setCourses(data);
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-sand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section>
        <h1 className="text-3xl font-bold text-brand-navy">
          Witaj ponownie, {user?.firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Masz {courses.length} aktywnych kursów w tym semestrze.
        </p>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-brand-gray/10 shadow-brand-sm">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Aktywne Kursy</p>
          <p className="text-2xl font-bold text-brand-navy">{courses.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-brand-gray/10 shadow-brand-sm">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Zadania do oddania</p>
          <p className="text-2xl font-bold text-brand-navy">2</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-brand-gray/10 shadow-brand-sm">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Twoja grupa</p>
          <p className="text-2xl font-bold text-brand-navy">E-III-6</p>
        </div>
      </div>

      {/* My Courses Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-brand-navy">Moje Kursy</h2>
          <Link href="/courses" className="text-sm font-semibold text-brand-navy hover:text-brand-sand transition-colors flex items-center gap-1">
            Zobacz katalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Link 
                key={course.id} 
                href={`/courses/${course.id}`}
                className="group bg-white p-6 rounded-2xl border border-brand-gray/10 shadow-brand-sm hover:border-brand-sand transition-all duration-300 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-sand mb-1 block">
                      {course.code}
                    </span>
                    <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-sand transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{course.lecturers[0]}</p>
                  </div>
                  <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center text-brand-navy group-hover:bg-brand-sand transition-colors">
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-auto pt-6 border-t border-brand-gray/5">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-medium text-muted-foreground">Postęp kursu</span>
                    <span className="font-bold text-brand-navy">{course.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-brand-light rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-navy transition-all duration-500" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-brand-gray/10 text-center space-y-4">
            <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center text-brand-navy mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <p className="text-brand-navy font-bold">Nie należysz jeszcze do żadnego kursu.</p>
            <Link href="/courses" className="inline-block bg-brand-sand text-brand-navy px-6 py-2 rounded-xl text-sm font-bold shadow-brand-sm">
              Przejdź do katalogu
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
