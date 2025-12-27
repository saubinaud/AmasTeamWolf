import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from './ui/button';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { ProductDetailDialog } from './ProductDetailDialog';
import { OptimizedImage } from './OptimizedImage';
import { useDataSaver } from '../hooks/useNetworkStatus';
import { toast } from 'sonner';
import { allStoreProducts, Implement } from '../data/implements';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { CartDrawerHome, CartItem } from './CartDrawerHome';
import { PopupPago } from './PopupPago';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { useUmami } from '../hooks/useUmami';

interface TiendaPageProps {
  onNavigate: (page: string) => void;
}

export function TiendaPage({ onNavigate }: TiendaPageProps) {
  // Umami analytics
  const { trackAddToCart, trackEvent } = useUmami();

  const [isMobile, setIsMobile] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Implement | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPagoOpen, setIsPagoOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  
  const shouldReduceMotion = useReducedMotion();
  const isDataSaver = useDataSaver();
  const shouldDisableAnimations = isMobile || shouldReduceMotion || isDataSaver;

  // Scroll to top when component mounts
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('amasCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('amasCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Categorías basadas en el tipo de producto
  const getCategory = (product: Implement) => {
    if (['gloves'].includes(product.id)) return 'Guantes';
    if (['shoes'].includes(product.id)) return 'Zapatos';
    if (['bostaff', 'combat-weapon', 'nunchaku'].includes(product.id)) return 'Armas';
    if (['patch', 'membership'].includes(product.id)) return 'Membresías';
    if (['uniform', 'polo'].includes(product.id)) return 'Uniformes';
    if (['protection-set'].includes(product.id)) return 'Protecciones';
    if (['bag', 'headband'].includes(product.id)) return 'Accesorios';
    return 'Otros';
  };

  const categories = ['Todos', ...Array.from(new Set(allStoreProducts.map(p => getCategory(p))))];
  // Filtrar productos: excluir el parche (solo disponible en programa Leadership)
  const availableProducts = allStoreProducts.filter(p => p.id !== 'patch');
  
  const filteredProducts = activeCategory === 'Todos' 
    ? availableProducts 
    : availableProducts.filter(p => getCategory(p) === activeCategory);

  const handleOpenProduct = (product: Implement) => {
    setSelectedProduct(product);
    const firstColor = product.colors?.[0] || '';
    setSelectedColor(firstColor);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      toast.error('Error al añadir producto');
      return;
    }
    
    const variant = selectedColor || 'Único';
    
    const existingItemIndex = cartItems.findIndex(
      item => item.id === selectedProduct.id && item.variant === variant
    );

    if (existingItemIndex >= 0) {
      const newCart = [...cartItems];
      newCart[existingItemIndex].quantity += quantity;
      setCartItems(newCart);
    } else {
      const newItem: CartItem = {
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        image: selectedProduct.image,
        variant: variant,
        quantity: quantity
      };
      setCartItems([...cartItems, newItem]);
    }
    
    toast.success(`${selectedProduct.name} añadido al carrito`);

    // Track add to cart with Umami
    trackAddToCart(selectedProduct.name, selectedProduct.price * quantity);

    setSelectedProduct(null);
  };

  const handleUpdateQuantity = (id: string, variant: string, quantity: number) => {
    const newCart = cartItems.map(item =>
      item.id === id && item.variant === variant
        ? { ...item, quantity }
        : item
    );
    setCartItems(newCart);
  };

  const handleRemoveItem = (id: string, variant: string) => {
    setCartItems(cartItems.filter(item => !(item.id === id && item.variant === variant)));
  };

  const handleCheckout = (total: number, items: CartItem[]) => {
    setTotalAmount(total);
    setCheckoutItems(items);
    setIsPagoOpen(true);

    // Track checkout initiation with Umami
    trackEvent('Iniciar Checkout Tienda', {
      valor: total,
      moneda: 'PEN',
      cantidad_items: items.length
    });
  };

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Advanced Gradient Background - igual que el home */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(250, 123, 33, 0.15) 0%, transparent 50%)'
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at 80% 50%, rgba(252, 169, 41, 0.2) 0%, transparent 60%)'
          }}
        />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      <div className="relative z-10">
        <HeaderMain 
          onNavigate={onNavigate}
          onOpenMatricula={() => {}}
          onCartClick={() => setIsCartOpen(true)}
          cartItemsCount={cartItemsCount}
        />
      
        <NetworkStatusIndicator />

        {/* Hero Section */}
        <section className="pt-24 sm:pt-28 pb-12 sm:pb-16 relative overflow-hidden">

        <div className="container mx-auto px-4 relative z-10">
          {/* Back Button */}
          <motion.button
            onClick={() => onNavigate('home')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-white/70 hover:text-[#FCA929] transition-colors mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Volver al inicio</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 px-4"
              style={{
                background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 50%, #FA7B21 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Tienda AMAS
            </motion.h1>
            <p className="text-white/70 text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4">
              Todo el equipamiento profesional para tu entrenamiento
            </p>
          </motion.div>

          {/* Categories Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setActiveCategory(category)}
                variant={activeCategory === category ? 'default' : 'outline'}
                className={`text-sm ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white border-transparent'
                    : 'border-white/20 text-white/70 hover:text-white hover:border-[#FA7B21]/30 bg-transparent'
                }`}
              >
                {category}
              </Button>
            ))}
          </motion.div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: shouldDisableAnimations ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: shouldDisableAnimations ? 0 : index * 0.05 }}
                whileHover={!shouldDisableAnimations ? { y: -8, scale: 1.02 } : {}}
                className="cursor-pointer group"
                onClick={() => handleOpenProduct(product)}
              >
                <div className="bg-zinc-900 rounded-lg overflow-hidden border border-white/10 hover:border-[#FA7B21]/50 transition-all duration-300 h-full flex flex-col">
                  <div className="relative aspect-square bg-zinc-800 overflow-hidden">
                    <OptimizedImage
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      aspectRatio="1/1"
                      objectFit="cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <span className="text-white text-sm flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Ver detalles
                      </span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <p className="text-[#FCA929] text-xs mb-1">{getCategory(product)}</p>
                    <h3 className="text-white text-sm sm:text-base mb-2 line-clamp-2 flex-1">
                      {product.name}
                    </h3>
                    <p className="text-[#FA7B21] text-lg sm:text-xl">
                      S/ {product.price}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FooterMain 
        onNavigate={onNavigate}
        onOpenMatricula={() => {}}
      />

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(product) => {
          const variant = selectedColor || 'Único';
          const existingItemIndex = cartItems.findIndex(
            item => item.id === product.id && item.variant === variant
          );

          if (existingItemIndex >= 0) {
            const newCart = [...cartItems];
            newCart[existingItemIndex].quantity += 1;
            setCartItems(newCart);
          } else {
            const newItem: CartItem = {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              variant: variant,
              quantity: 1
            };
            setCartItems([...cartItems, newItem]);
          }
          
          toast.success(`${product.name} añadido al carrito`);
        }}
      />

      {/* Cart Drawer */}
      <CartDrawerHome
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

        {/* Payment Popup */}
        <PopupPago
          isOpen={isPagoOpen}
          onClose={() => {
            setIsPagoOpen(false);
            // Limpiar el carrito después de proceder al pago
            if (checkoutItems.length > 0) {
              setCartItems([]);
              setCheckoutItems([]);
            }
          }}
          totalAmount={totalAmount}
          cartItems={checkoutItems}
        />
      </div>
    </div>
  );
}