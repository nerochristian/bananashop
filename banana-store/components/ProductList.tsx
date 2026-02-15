import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  products: Product[];
  onView: (product: Product) => void;
  onBuyNow: (product: Product, quantity?: number) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onView, onBuyNow }) => {
  return (
    <section id="products" className="pb-40 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {products.map((product, index) => (
            <div key={product.id} className="animate-reveal" style={{ animationDelay: `${index * 100}ms` }}>
              <ProductCard 
                product={product} 
                onView={onView}
                onBuyNow={onBuyNow}
              />
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center py-32 rounded-[40px] border border-dashed border-white/5 animate-fade-in">
              <p className="text-white/20 font-black tracking-[0.2em] uppercase text-xs">Inventory is currently empty</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
