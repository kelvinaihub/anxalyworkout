import React, { useState, useEffect } from 'react';
import { getMarketplaceListings } from '../services/firebaseService.ts';
import { MarketplaceListing, User } from '../types.ts';
import { XIcon, MessagesIcon } from '../components/Icons.tsx';

// --- SUB-COMPONENTS (Moved to top-level to fix React Hook errors) ---

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackType: 'user' | 'post' = 'post') => {
    e.currentTarget.onerror = null;
    if (fallbackType === 'user') {
        e.currentTarget.src = 'https://placehold.co/150x150/1e1e1e/ffffff?text=User';
    } else {
        e.currentTarget.src = 'https://placehold.co/600x400/1e1e1e/ffffff?text=Image+Error';
    }
};

const ItemDetailModal: React.FC<{ item: MarketplaceListing, onClose: () => void, onOpenChat: (user: User) => void }> = ({ item, onClose, onOpenChat }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-dark-card rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-3 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Listing Details</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-dark-surface"><XIcon className="w-5 h-5"/></button>
                </div>
                <div className="overflow-y-auto">
                    <img src={item.imageUrl} onError={(e) => handleImageError(e, 'post')} alt={item.title} className="w-full h-64 object-cover" />
                    <div className="p-4">
                        <h3 className="text-2xl font-bold">${item.price}</h3>
                        <p className="text-lg mt-1">{item.title}</p>
                        <p className="text-sm text-dark-text-secondary mt-4">{item.description}</p>
                        
                        <div className="mt-6 p-3 bg-dark-surface rounded-lg">
                            <h4 className="font-semibold mb-2">Seller Information</h4>
                            <div className="flex items-center space-x-3">
                                <img src={item.seller.profilePictureUrl} alt={item.seller.name} onError={(e) => handleImageError(e, 'user')} className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-bold">{item.seller.name}</p>
                                    <p className="text-xs text-dark-text-secondary">Member since 2023</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => onOpenChat(item.seller)}
                                className="w-full mt-3 bg-brand-primary/20 text-brand-primary font-semibold py-2 rounded-lg text-sm flex items-center justify-center space-x-2 hover:bg-brand-primary/30"
                            >
                                <MessagesIcon className="w-4 h-4" />
                                <span>Message Seller</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

// --- MAIN MARKETPLACE SCREEN COMPONENT ---

interface MarketplaceScreenProps {
  onOpenChat: (user: User) => void;
}

const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ onOpenChat }) => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MarketplaceListing | null>(null);

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      try {
        const items = await getMarketplaceListings();
        setListings(items);
      } catch (error) {
        console.error("Failed to load marketplace listings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, []);

  return (
    <div className="max-w-screen-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Marketplace</h1>
      {loading ? (
        <p>Loading listings...</p>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {listings.map(item => (
            <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-dark-card rounded-lg overflow-hidden cursor-pointer group">
              <div className="aspect-square">
                <img src={item.imageUrl} alt={item.title} onError={(e) => handleImageError(e, 'post')} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-3">
                <p className="font-bold text-lg">${item.price}</p>
                <p className="text-sm truncate">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No listings found in the marketplace.</p>
      )}
      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onOpenChat={onOpenChat} />}
    </div>
  );
};

export default MarketplaceScreen;