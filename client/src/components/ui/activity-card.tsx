import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import type { Activity } from '@/lib/api';

interface ActivityCardProps {
  activity: Activity;
  onClick: (activity: Activity) => void;
}

const typeColors = {
  coupon: 'bg-red-500',
  group: 'bg-primary',
  presale: 'bg-orange-500',
  franchise: 'bg-purple-500',
};

const typeLabels = {
  coupon: '卡券',
  group: '团购', 
  presale: '预售',
  franchise: '招商',
};

export function ActivityCard({ activity, onClick }: ActivityCardProps) {
  const { t, currentLang } = useI18n();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 获取图片数组 - 使用coverUrl
  const images = activity?.coverUrl ? [activity.coverUrl] : [];

  // 自动轮播（仅在多图且卡片在视口内时）
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000); // 3秒切换一次

    return () => clearInterval(interval);
  }, [images.length]);

  const handleClick = () => {
    // Track card click event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'evt_card_click', {
        id: activity.id,
        type: activity.type,
        utm: 'brand_page',
      });
    }
    
    onClick(activity);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click trigger
    handleClick();
  };

  const formatPrice = (price: number) => {
    return `฿${price}`;
  };

  const getButtonText = () => {
    switch (activity.type) {
      case 'coupon':
        return t('button.claim', '立即领取');
      case 'group':
        return t('button.join_group', '立即参团');
      case 'presale':
        return t('button.presale', '立即预订');
      case 'franchise':
        return t('button.franchise', '了解详情');
      default:
        return t('button.claim', '立即领取');
    }
  };

  const getDisplayTitle = () => {
    if (currentLang === 'th' && activity.titleTh) {
      return activity.titleTh;
    }
    return activity.title;
  };

  const getTypeLabel = () => {
    return t(`activity.type.${activity.type}`, typeLabels[activity.type]);
  };

  return (
    <div 
      data-testid={`card-${activity.id}`}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={handleClick}
    >
      {/* Image area - two-thirds of card */}
      <div className="relative w-full" style={{ height: '200px' }}>
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentImageIndex]} 
              alt={`${getDisplayTitle()} - ${currentImageIndex + 1}`}
              className="w-full h-full object-cover transition-opacity duration-300"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // Show broken image indicator instead of hiding the problem
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.upload-error')) {
                  parent.innerHTML += `<div class="upload-error flex items-center justify-center h-full bg-red-50 border-2 border-dashed border-red-200 rounded">
                    <div class="text-center text-red-600">
                      <div class="text-sm font-medium">图片加载失败</div>
                      <div class="text-xs mt-1">请重新上传</div>
                    </div>
                  </div>`;
                }
              }}
            />
            
            {/* 多图指示器 - 仅在多图时显示 */}
            {images.length > 1 && (
              <div className="absolute top-2 left-2 flex gap-1">
                {images.map((_: string, index: number) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">暂无图片</span>
          </div>
        )}
        
        {/* Activity type badge - top right */}
        <div className={`absolute top-2 right-2 ${typeColors[activity.type]} text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm`}>
          {t(`activity.type.${activity.type}`, typeLabels[activity.type])}
        </div>
        
        {/* Action button - bottom left */}
        <button 
          className={`absolute bottom-2 left-2 ${typeColors[activity.type]} text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-md hover:opacity-90 transition-opacity`}
          onClick={handleButtonClick}
        >
          {getButtonText()}
        </button>
      </div>
      
      {/* Content area - remaining one-third */}
      <div className="p-3" style={{ height: '100px' }}>
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 leading-tight">
          {getDisplayTitle()}
        </h3>
        <div className="flex items-end justify-between">
          {/* Price area - stacked, original price on top, current price below */}
          <div className="flex flex-col items-start">
            {activity.listPrice && (
              <span className="text-gray-500 line-through text-xs leading-tight">
                {formatPrice(activity.listPrice)}
              </span>
            )}
            <span className="text-emerald-600 font-bold text-base leading-tight">
              {formatPrice(activity.price)}
            </span>
          </div>
          {/* Remaining quantity */}
          {activity.quantity && (
            <span className="text-xs text-gray-500">
              {t('quantity.remaining_short', '剩余')} {activity.quantity} {t('quantity.unit_short', '份')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivityCard;