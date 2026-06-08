import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <div className="flex flex-col gap-3 group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[4/5] overflow-hidden bg-[#111] rounded-sm">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {product.isSale && (
          <div className="absolute top-3 right-3 bg-white text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
            Sale!
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-gray-400 text-[10px] font-medium tracking-wider uppercase">
          {product.category}
        </span>
        <h3 className="text-white text-sm font-bold leading-snug line-clamp-3 group-hover:text-green-500 transition-colors font-display tracking-tight">
          {product.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-500 line-through text-xs">
            ₹{product.originalPrice.toLocaleString()}
          </span>
          <span className="text-white font-bold text-sm">
            ₹{product.salePrice.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
