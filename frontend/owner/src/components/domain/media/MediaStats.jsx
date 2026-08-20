import React from 'react';
import { Image, Star, UserCheck, LayoutGrid, Calendar, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import Card from '../../ui/Card';
import Skeleton from '../../ui/Skeleton';

export default function MediaStats({ stats = {}, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4 bg-surface border border-border-subtle">
            <Skeleton variant="text" width="60%" className="mb-2" />
            <Skeleton variant="text" width="40%" height="2rem" />
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Tổng media',
      value: stats.total || 0,
      subtext: `${((stats.totalSize || 0) / (1024 * 1024)).toFixed(1)} MB sử dụng`,
      icon: <Image size={20} className="text-accent-primary" />,
      bgColor: 'bg-accent-primary/10'
    },
    {
      title: 'Ảnh bìa',
      value: stats.hasCover ? '1 Ảnh active' : 'Chưa thiết lập',
      subtext: stats.hasCover ? 'Đã hiển thị trên App' : 'Cần cập nhật ảnh bìa',
      icon: <Star size={20} className={stats.hasCover ? 'text-amber-500' : 'text-gray-400'} />,
      bgColor: stats.hasCover ? 'bg-amber-500/10' : 'bg-gray-100',
      badge: stats.hasCover ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle2 size={10} /> Đã có
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          <AlertCircle size={10} /> Trống
        </span>
      )
    },
    {
      title: 'Ảnh đại diện',
      value: stats.hasAvatar ? '1 Ảnh active' : 'Chưa thiết lập',
      subtext: stats.hasAvatar ? 'Logo hiển thị tìm kiếm' : 'Cần tải logo/avatar',
      icon: <UserCheck size={20} className={stats.hasAvatar ? 'text-indigo-500' : 'text-gray-400'} />,
      bgColor: stats.hasAvatar ? 'bg-indigo-500/10' : 'bg-gray-100',
      badge: stats.hasAvatar ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle2 size={10} /> Đã có
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          <AlertCircle size={10} /> Trống
        </span>
      )
    },
    {
      title: 'Ảnh sân & Không gian',
      value: stats.venue || 0,
      subtext: `${stats.facility || 0} ảnh tiện ích`,
      icon: <LayoutGrid size={20} className="text-emerald-500" />,
      bgColor: 'bg-emerald-500/10'
    },
    {
      title: 'Sự kiện & Khuyến mãi',
      value: (stats.event || 0) + (stats.promotion || 0) + (stats.tournament || 0) + (stats.course || 0),
      subtext: `${stats.event || 0} sự kiện, ${stats.promotion || 0} ưu đãi`,
      icon: <Sparkles size={20} className="text-rose-500" />,
      bgColor: 'bg-rose-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {statCards.map((card, idx) => (
        <div
          key={idx}
          className="p-4 bg-surface border border-border-subtle rounded-2xl shadow-xs hover:shadow-sm transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`p-2 rounded-xl ${card.bgColor}`}>
              {card.icon}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                {card.value}
              </span>
              {card.badge}
            </div>
            <p className="text-[11px] text-text-muted mt-1 truncate">
              {card.subtext}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
