import React from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/I18nContext';
import { MapPin, Navigation } from 'lucide-react';
import type { Store } from '@/lib/api';

interface NearbySheetProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  onNavigate: (store: Store) => void;
}

export function NearbySheet({ isOpen, onClose, stores, onNavigate }: NearbySheetProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleNavigation = (store: Store) => {
    // Track nearby navigation click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'nearby_nav_click', {
        store_id: store.id,
        distance_km: store.distanceKm,
      });
    }
    
    onNavigate(store);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleBackdropClick}
      />
      
      {/* Bottom sheet */}
      <div 
        data-testid="nearby-sheet"
        className={`fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="p-4">
          {/* Handle */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
          
          {/* Header */}
          <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {t('nearby.title', '附近门店')}
          </h3>
          
          {/* Store list */}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stores.length === 0 ? (
              <div className="text-center py-8 text-tertiary">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>{t('nearby.no_stores', '附近暂无门店')}</p>
              </div>
            ) : (
              stores.map((store) => (
                <div 
                  key={store.id}
                  data-testid={`store-item-${store.id}`}
                  className="bg-gray-50 p-4 rounded-xl"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-secondary">{store.name}</h4>
                    {store.distanceKm && (
                      <span className="text-sm text-tertiary">
                        {t('nearby.distance', '约{{distance}}km').replace('{{distance}}', store.distanceKm.toString())}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-tertiary mb-3">{store.address}</p>
                  <Button
                    data-testid={`btn-nav-${store.id}`}
                    onClick={() => handleNavigation(store)}
                    className="w-full btn-mobile btn-primary"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    {t('button.navigation', '去导航')}
                  </Button>
                </div>
              ))
            )}
          </div>
          
          {/* Close button */}
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full btn-mobile"
            >
              {t('common.close', '关闭')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default NearbySheet;
