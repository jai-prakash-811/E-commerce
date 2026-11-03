import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from './api.js';
import { heroSlides } from './heroSlides.js';

const StoreContext = createContext(null);
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
const imageFallback = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80';

// Hero Slider Component
function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState('next');

  const slides = heroSlides;

  const goToSlide = useCallback((index) => {
    setDirection(index > currentIndex ? 'next' : 'prev');
    setCurrentIndex(index);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setDirection('next');
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setDirection('prev');
  }, [slides.length]);

  // Auto-slide every 2 seconds
  useEffect(() => {
    const interval = setInterval(goNext, 2000);
    return () => clearInterval(interval);
  }, [goNext]);

  const currentSlide = slides[currentIndex];

  return (
    <section className="hero-slider">
      <div className="slider-track">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slider-slide ${index === currentIndex ? 'active' : ''} ${direction === 'next' && index === (currentIndex - 1 + slides.length) % slides.length ? 'exiting-prev' : ''} ${direction === 'prev' && index === (currentIndex + 1) % slides.length ? 'exiting-next' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="slider-content shell">
              <span className="slider-category">{slide.brand} · {slide.category}</span>
              <h2>{slide.title}</h2>
              <p>{slide.subtitle}</p>
              <Link to={slide.link} className="button button-light">{slide.cta} <i className="bx bx-right-arrow-alt" /></Link>
            </div>
          </div>
        ))}
      </div>
      <div className="slider-nav">
        <button className="slider-arrow prev" onClick={goPrev} aria-label="Previous slide"><i className="bx bx-chevron-left" /></button>
        <div className="slider-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        <button className="slider-arrow next" onClick={goNext} aria-label="Next slide"><i className="bx bx-chevron-right" /></button>
      </div>
    </section>
  );
}

function useStore() {
  return useContext(StoreContext);
}

function StoreProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('shopverse-cart') || '[]'));
  const [wishlist, setWishlist] = useState([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    localStorage.setItem('shopverse-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!localStorage.getItem('shopverse-token')) {
      setAuthReady(true);
      return;
    }
    api.me()
      .then((result) => {
        setUser(result.user);
        return api.wishlist()
          .then((result) => setWishlist(result))
          .catch((error) => setToast(error.message));
      })
      .catch((error) => {
        if (error.status === 401) {
          localStorage.removeItem('shopverse-token');
          setUser(null);
        } else {
          setToast(error.message);
        }
      })
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const signOut = () => {
    localStorage.removeItem('shopverse-token');
    setUser(null);
    setWishlist([]);
    setToast('You have been signed out.');
  };

  const addToCart = (product, quantity = 1) => {
    setCart((items) => {
      const found = items.find((item) => item.productId === product._id);
      return found
        ? items.map((item) => item.productId === product._id ? { ...item, quantity: item.quantity + quantity } : item)
        : [...items, { productId: product._id, quantity, product }];
    });
    setToast('Added to your bag.');
  };

  const updateCart = (productId, quantity) => {
    if (quantity < 1) {
      setCart((items) => items.filter((item) => item.productId !== productId));
      return;
    }
    setCart((items) => items.map((item) => item.productId === productId ? { ...item, quantity } : item));
  };

  const toggleWishlist = async (productId) => {
    if (!user) {
      setToast('Sign in to save your favourites.');
      return;
    }
    try {
      const result = await api.toggleWishlist(productId);
      setWishlist(result.wishlist);
      setToast(result.added ? 'Saved to your wishlist.' : 'Removed from wishlist.');
    } catch (error) {
      setToast(error.message);
    }
  };

  const value = useMemo(() => ({
    user, setUser, authReady, cart, setCart, wishlist, setWishlist, toast, setToast,
    signOut, addToCart, updateCart, toggleWishlist
  }), [user, authReady, cart, wishlist, toast]);

  return <StoreContext.Provider value={value}>{children}{toast && <div className="toast">{toast}</div>}</StoreContext.Provider>;
}

function Header() {
  const { user, cart, signOut } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  return (
    <>
      <div className="announcement">A little something extra: complimentary shipping over ₹2,999</div>
      <header className="site-header">
        <div className="header-inner shell">
          <Link className="brand" to="/"><span className="brand-symbol">s.</span><span>shopverse</span></Link>
          <nav className="main-nav">
            <Link to="/">Home</Link><Link to="/shop">Shop</Link><Link to="/shop?category=Footwear">Footwear</Link><Link to="/shop?category=Clothing">Clothing</Link><a href="/#story">Our story</a>
          </nav>
          <div className="header-actions">
            <Link className="icon-link wishlist-link" to="/wishlist" aria-label="Wishlist"><i className="bx bx-heart" /></Link>
            {user ? (
              <>
                {user.role === 'admin' && <Link className="admin-link" to="/admin">Admin</Link>}
                <button className="user-greeting" onClick={signOut}>Hi, {user.name.split(' ')[0]} <i className="bx bx-log-out" /></button>
              </>
            ) : <Link className="signin-link" to="/login">Sign in</Link>}
            <Link className="bag-link" to="/cart"><i className="bx bx-shopping-bag" /><span>Bag ({count})</span></Link>
            <button className="mobile-menu" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><i className={menuOpen ? 'bx bx-x' : 'bx bx-menu'} /></button>
          </div>
          {menuOpen && <nav className="mobile-dropdown"><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link><Link to="/shop" onClick={() => setMenuOpen(false)}>Shop all</Link><Link to="/shop?category=Footwear" onClick={() => setMenuOpen(false)}>Footwear</Link><Link to="/shop?category=Clothing" onClick={() => setMenuOpen(false)}>Clothing</Link><Link to="/wishlist" onClick={() => setMenuOpen(false)}>Favourites</Link>{user?.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)}>Store admin</Link>}{user ? <button onClick={() => { signOut(); setMenuOpen(false); }}>Sign out</button> : <Link to="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>}</nav>}
        </div>
      </header>
    </>
  );
}

function ProductCard({ product }) {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const saved = wishlist.some((item) => (item._id || item) === product._id);
  return (
    <article className="product-card">
      <div className="product-photo">
        <Link to={`/product/${product._id}`}><img src={product.image || imageFallback} alt={product.name} onError={(event) => { event.currentTarget.src = imageFallback; }} /></Link>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button className={`heart-button ${saved ? 'saved' : ''}`} aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => toggleWishlist(product._id)}>
          <i className={saved ? 'bx bxs-heart' : 'bx bx-heart'} />
        </button>
        <button className="quick-add" onClick={() => addToCart(product)}>Add to bag <i className="bx bx-right-arrow-alt" /></button>
      </div>
      <div className="product-card-info">
        <div className="product-kicker">{product.category}<span><i className="bx bxs-star" /> {product.rating?.toFixed?.(1) || product.rating || '4.8'}</span></div>
        <Link to={`/product/${product._id}`} className="product-name">{product.name}</Link>
        <strong>{money(product.price)}</strong>
      </div>
    </article>
  );
}

function ProductList({ products, loading, error }) {
  if (loading) return <div className="state-message">Curating the collection…</div>;
  if (error) return <div className="state-message error-state">{error}</div>;
  if (!products.length) return <div className="state-message">No pieces matched. Try a different search.</div>;
  return <div className="product-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>;
}

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api.products('?limit=4&sort=featured')
      .then((result) => setProducts(result.products))
      .catch((problem) => setError(problem.message))
      .finally(() => setLoading(false));
  }, []);
  return (
    <main>
      <HeroSlider />
      <section className="trust-strip"><div className="shell trust-items"><span><i className="bx bx-package" /> Premium materials</span><span><i className="bx bx-refresh" /> Easy 30-day returns</span><span><i className="bx bx-run" /> Built for movement</span><span><i className="bx bx-lock-alt" /> Secure checkout</span></div></section>
      <section className="section shell" id="collection">
        <div className="section-top"><div><p className="eyebrow">New arrivals</p><h2>Fresh picks for the season.</h2></div><Link to="/shop" className="text-link">View all <i className="bx bx-right-arrow-alt" /></Link></div>
        <ProductList products={products} loading={loading} error={error} />
      </section>
      <section className="story-band" id="story"><div className="story-image"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80" alt="Footwear and apparel collection" /></div><div className="story-copy"><p className="eyebrow">Move freely</p><h2>Gear that keeps up.<br /><em>Style that stands out.</em></h2><p>Whether you're hitting the trails, the gym, or the streets — our footwear and apparel are built for motion without compromising on looks.</p><Link className="text-link" to="/shop">Explore our story <i className="bx bx-right-arrow-alt" /></Link></div></section>
      <section className="newsletter shell"><div><p className="eyebrow">A note from us</p><h2>Good things, occasionally.</h2><p>New arrivals and thoughtful little extras. No noise, just the good stuff.</p></div><form onSubmit={(event) => { event.preventDefault(); event.currentTarget.reset(); window.alert('Thanks for subscribing!'); }}><input type="email" placeholder="Your email address" aria-label="Email address" required /><button type="submit" aria-label="Subscribe"><i className="bx bx-right-arrow-alt" /></button></form></section>
    </main>
  );
}

function Shop() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ products: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'featured';
  useEffect(() => {
    setLoading(true);
    api.products(`?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}`)
      .then(setData)
      .catch((problem) => setError(problem.message))
      .finally(() => setLoading(false));
  }, [search, category, sort]);
  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };
  return <main className="shop-page shell"><div className="page-intro"><p className="eyebrow">Footwear & Apparel</p><h1>The collection</h1><p>Sports shoes, sneakers, jackets, shirts, tees, jeans, and trousers — curated for performance and style.</p></div>
    <div className="shop-toolbar"><span>{data.products.length} considered pieces</span><div className="filters"><input value={search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Search pieces…" aria-label="Search products" /><select value={category} onChange={(event) => setFilter('category', event.target.value)} aria-label="Filter category"><option value="">All categories</option>{data.categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={sort} onChange={(event) => setFilter('sort', event.target.value)} aria-label="Sort products"><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="rating">Top rated</option></select></div></div>
    <ProductList products={data.products} loading={loading} error={error} />
  </main>;
}

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [quantity, setQuantity] = useState(1);
  useEffect(() => { api.product(id).then(setProduct).catch((problem) => setError(problem.message)); }, [id]);
  if (error) return <main className="state-message error-state">{error}<p><Link to="/shop" className="text-link">Back to the collection</Link></p></main>;
  if (!product) return <main className="state-message">Finding the details…</main>;
  const saved = wishlist.some((item) => (item._id || item) === product._id);
  return <main className="detail-page shell"><div className="breadcrumbs"><Link to="/">Home</Link> / <Link to="/shop">Collection</Link> / {product.name}</div><div className="detail-grid"><div className="detail-image"><img src={product.image || imageFallback} alt={product.name} onError={(event) => { event.currentTarget.src = imageFallback; }} /></div><div className="detail-copy"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><div className="detail-rating"><i className="bx bxs-star" /> {product.rating} <span>•</span> Loved by our community</div><div className="detail-price">{money(product.price)}</div><p className="detail-description">{product.description}</p><div className="stock-note"><i className="bx bx-check-circle" /> {product.stock > 0 ? `${product.stock} in stock` : 'Currently unavailable'}</div><div className="purchase-row"><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))} aria-label="Increase quantity">+</button></div><button className="button button-dark" disabled={!product.stock} onClick={() => addToCart(product, quantity)}>Add to bag · {money(product.price * quantity)}</button></div><button className={`wishlist-detail ${saved ? 'saved' : ''}`} onClick={() => toggleWishlist(product._id)}><i className={saved ? 'bx bxs-heart' : 'bx bx-heart'} /> {saved ? 'Saved to favourites' : 'Save to favourites'}</button><div className="detail-perks"><p><i className="bx bx-package" /> Free shipping over ₹2,999</p><p><i className="bx bx-refresh" /> Easy returns within 30 days</p><p><i className="bx bx-lock-alt" /> Secure, encrypted checkout</p></div></div></div></main>;
}

function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { setUser, setWishlist, setToast } = useStore();
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = mode === 'login' ? await api.login({ email: form.email, password: form.password }) : await api.signup(form);
      localStorage.setItem('shopverse-token', result.token);
      setUser(result.user);
      setWishlist([]);
      navigate('/');
      api.wishlist().then(setWishlist).catch((problem) => setToast(problem.message));
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  };
  return <main className="auth-page"><div className="auth-art"><img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1100&q=85" alt="ShopVerse fashion" /><Link to="/" className="brand auth-brand"><span className="brand-symbol">s.</span><span>shopverse</span></Link></div><div className="auth-form-wrap"><div className="auth-form-content"><p className="eyebrow">Your good things await</p><h1>{mode === 'login' ? 'Welcome back.' : 'Come on in.'}</h1><p className="auth-subtitle">{mode === 'login' ? 'Sign in to see your saved pieces and orders.' : 'Create an account to save your favourites and check out faster.'}</p><div className="auth-switch"><button className={mode === 'login' ? 'selected' : ''} onClick={() => setMode('login')}>Sign in</button><button className={mode === 'signup' ? 'selected' : ''} onClick={() => setMode('signup')}>Create account</button></div><form onSubmit={submit} className="form-stack">{mode === 'signup' && <label>Your name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" required minLength="2" /></label>}<label>Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required /></label><label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength="8" /></label>{error && <p className="form-error">{error}</p>}<button className="button button-dark button-wide" disabled={busy}>{busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create my account'} <i className="bx bx-right-arrow-alt" /></button></form><p className="auth-footnote">By continuing, you agree to our terms and privacy policy.</p></div></div></main>;
}

function Cart() {
  const { cart, updateCart, setToast } = useStore();
  const navigate = useNavigate();
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  return <main className="cart-page shell"><div className="page-intro"><p className="eyebrow">Almost yours</p><h1>Your bag</h1></div>{!cart.length ? <div className="empty-state"><i className="bx bx-shopping-bag" /><h2>Your bag is taking a little break.</h2><p>Find a few good things for your everyday.</p><Link to="/shop" className="button button-dark">Explore the collection</Link></div> : <div className="cart-layout"><div className="cart-lines">{cart.map(({ product, productId, quantity }) => <article className="cart-line" key={productId}><Link to={`/product/${productId}`}><img src={product.image || imageFallback} alt={product.name} /></Link><div className="cart-line-copy"><p className="eyebrow">{product.category}</p><Link to={`/product/${productId}`} className="product-name">{product.name}</Link><p>{money(product.price)}</p><div className="quantity-control"><button onClick={() => updateCart(productId, quantity - 1)} aria-label="Decrease quantity">−</button><span>{quantity}</span><button onClick={() => updateCart(productId, quantity + 1)} aria-label="Increase quantity">+</button></div></div><div className="cart-line-end"><strong>{money(product.price * quantity)}</strong><button className="remove-item" onClick={() => { updateCart(productId, 0); setToast('Removed from your bag.'); }}>Remove</button></div></article>)}</div><aside className="order-summary"><h2>Order summary</h2><div><span>Subtotal</span><span>{money(subtotal)}</span></div><div><span>Shipping</span><span>{subtotal >= 2999 ? 'Complimentary' : 'Calculated at checkout'}</span></div><p>Taxes included. Shipping calculated at checkout.</p><button className="button button-dark button-wide" onClick={() => navigate('/checkout')}>Continue to checkout <i className="bx bx-right-arrow-alt" /></button><Link to="/shop" className="text-link">Continue shopping</Link></aside></div>}</main>;
}

function Checkout() {
  const { cart, user, setCart, setToast } = useStore();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: user?.name || '', email: user?.email || '', phone: '', address: '', city: '', postalCode: '' });
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal >= 2999 ? 0 : 99;
  useEffect(() => { if (!cart.length) navigate('/cart'); }, [cart.length, navigate]);
  const submit = async (event) => {
    event.preventDefault();
    if (!user) {
      setToast('Please sign in before checkout.');
      navigate('/login');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const order = await api.createOrder({ items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })), shippingAddress: form });
      setCart([]);
      navigate(`/orders/${order._id}`);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  };
  if (!cart.length) return null;
  return <main className="checkout-page shell"><div className="page-intro"><p className="eyebrow">One last little step</p><h1>Checkout</h1></div><div className="checkout-grid"><form className="checkout-form" onSubmit={submit}><h2>Delivery details</h2><div className="form-grid"><label className="span-two">Full name<input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label><label>Email<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Phone<input type="tel" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label className="span-two">Street address<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label><label>City<input required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label><label>PIN code<input required pattern="[0-9]{6}" title="Enter a 6-digit PIN code" value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} /></label></div><h2 className="payment-title">Payment</h2><div className="payment-option"><i className="bx bx-package" /><div><strong>Cash on delivery</strong><p>Pay in cash when your parcel arrives.</p></div><i className="bx bx-check-circle" /></div><p className="checkout-disclaimer">Online card / UPI payments are not enabled yet. No payment is collected online.</p>{error && <p className="form-error">{error}</p>}<button className="button button-dark button-wide" disabled={busy}>{busy ? 'Placing your order…' : `Place order · ${money(subtotal + shipping)}`}</button></form><aside className="order-summary"><h2>In your bag</h2>{cart.map((item) => <div className="checkout-item" key={item.productId}><img src={item.product.image || imageFallback} alt="" /><span>{item.product.name} × {item.quantity}</span><strong>{money(item.product.price * item.quantity)}</strong></div>)}<div className="checkout-item"><span>Shipping</span><strong>{shipping ? money(shipping) : 'Complimentary'}</strong></div><div className="summary-total"><span>Total</span><strong>{money(subtotal + shipping)}</strong></div></aside></div></main>;
}

function Wishlist() {
  const { wishlist } = useStore();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!localStorage.getItem('shopverse-token')) return;
    api.wishlist().then(setProducts).catch((problem) => setError(problem.message));
  }, [wishlist]);
  return <main className="shop-page shell"><div className="page-intro"><p className="eyebrow">Your saved pieces</p><h1>Favourites</h1></div>{error ? <p className="state-message error-state">{error}</p> : products.length ? <ProductList products={products} /> : <div className="empty-state"><i className="bx bx-heart" /><h2>Keep the good ones close.</h2><p>Tap the heart on a piece to save it here.</p><Link to="/shop" className="button button-dark">Explore the collection</Link></div>}</main>;
}

function Protected({ admin = false, children }) {
  const { user, authReady } = useStore();
  if (!authReady) return <div className="state-message">Just a moment…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function OrderConfirmation() {
  const { id } = useParams();
  const { setToast } = useStore();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.orders().then((orders) => setOrder(orders.find((item) => item._id === id) || null)).catch((problem) => setError(problem.message)); }, [id]);
  useEffect(() => { if (order) setToast('Your order is confirmed. Thank you!'); }, [order, setToast]);
  if (error) return <main className="state-message error-state">{error}</main>;
  if (!order) return <main className="state-message">Looking up your order…</main>;
  return <main className="confirmation-page shell"><div className="confirmation-icon"><i className="bx bx-check" /></div><p className="eyebrow">Order placed</p><h1>That's a good choice.</h1><p>Your order <strong>#{order._id.slice(-8).toUpperCase()}</strong> is in. We'll send updates to {order.shippingAddress.email}.</p><div className="order-confirm-summary">{order.items.map((item) => <div key={item.product}><span>{item.name} × {item.quantity}</span><strong>{money(item.price * item.quantity)}</strong></div>)}<div><span>Shipping</span><strong>{order.shippingCost ? money(order.shippingCost) : 'Complimentary'}</strong></div><div className="summary-total"><span>Total · Cash on delivery</span><strong>{money(order.total)}</strong></div></div><Link to="/shop" className="button button-dark">Back to the collection</Link></main>;
}

function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', image: '', category: '', price: '', stock: '', rating: '4.8', badge: '' });
  const [busy, setBusy] = useState(false);
  const load = () => Promise.all([api.adminProducts(), api.orders()]).then(([productList, orderList]) => { setProducts(productList); setOrders(orderList); }).catch((problem) => setError(problem.message));
  useEffect(() => { load(); }, []);
  const edit = (product) => { setEditing(product._id); setForm({ ...product, price: String(product.price), stock: String(product.stock) }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.saveProduct({ ...form, price: Number(form.price), stock: Number(form.stock), rating: Number(form.rating) }, editing);
      setEditing(null);
      setForm({ name: '', description: '', image: '', category: '', price: '', stock: '', rating: '4.8', badge: '' });
      await load();
    } catch (problem) { setError(problem.message); } finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!window.confirm('Remove this product from the store?')) return;
    try { await api.deleteProduct(id); await load(); } catch (problem) { setError(problem.message); }
  };
  const changeOrderStatus = async (id, status) => {
    try { await fetch(`/api/admin/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('shopverse-token')}` }, body: JSON.stringify({ status }) }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message); }); await load(); } catch (problem) { setError(problem.message); }
  };
  return <main className="admin-page shell"><div className="page-intro"><p className="eyebrow">Store management</p><h1>Good morning, admin.</h1><p>Manage the collection and fulfilment from here.</p></div>{error && <p className="form-error">{error}</p>}<div className="admin-stats"><div><span>Listed pieces</span><strong>{products.length}</strong></div><div><span>Orders to manage</span><strong>{orders.length}</strong></div><div><span>Revenue placed</span><strong>{money(orders.reduce((sum, order) => sum + order.total, 0))}</strong></div></div><section className="admin-section"><div className="section-top"><div><p className="eyebrow">The collection</p><h2>{editing ? 'Edit a piece' : 'Add a piece'}</h2></div></div><form className="admin-form form-grid" onSubmit={submit}><label>Product name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Category<input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label><label>Price in ₹<input required type="number" min="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label>Available stock<input required type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} /></label><label>Image URL<input required type="url" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></label><label>Badge (optional)<input value={form.badge} onChange={(event) => setForm({ ...form, badge: event.target.value })} /></label><label className="span-two">Description<textarea required rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><div className="admin-form-actions"><button className="button button-dark" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</button>{editing && <button type="button" className="text-link" onClick={() => { setEditing(null); setForm({ name: '', description: '', image: '', category: '', price: '', stock: '', rating: '4.8', badge: '' }); }}>Cancel</button>}</div></form></section><section className="admin-section"><div className="section-top"><div><p className="eyebrow">Inventory</p><h2>Your products</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><div className="table-product"><img src={product.image} alt="" /><strong>{product.name}</strong></div></td><td>{product.category}</td><td>{money(product.price)}</td><td>{product.stock}</td><td><button className="table-action" onClick={() => edit(product)}>Edit</button><button className="table-action danger" onClick={() => remove(product._id)}>Delete</button></td></tr>)}</tbody></table></div></section><section className="admin-section"><div className="section-top"><div><p className="eyebrow">Fulfilment</p><h2>Recent orders</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Update</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td>#{order._id.slice(-8).toUpperCase()}</td><td>{order.shippingAddress.fullName}</td><td>{money(order.total)}</td><td><span className={`status-pill ${order.status}`}>{order.status}</span></td><td><select value={order.status} onChange={(event) => changeOrderStatus(order._id, event.target.value)}><option value="placed">Placed</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></td></tr>)}</tbody></table></div></section></main>;
}

function Footer() {
  return <footer className="site-footer"><div className="shell footer-main"><div><Link className="brand footer-brand" to="/"><span className="brand-symbol">s.</span><span>shopverse</span></Link><p>Everyday, thoughtfully considered.</p></div><div><h3>Explore</h3><Link to="/shop">The collection</Link><Link to="/wishlist">Your favourites</Link></div><div><h3>We're here</h3><a href="mailto:hello@shopverse.example">hello@shopverse.example</a><p>Monday–Friday, 9am–5pm IST</p></div><div className="footer-signoff">Good things,<br /><em>well chosen.</em></div></div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} ShopVerse</span><span>Made for the everyday.</span><span>Payments: Cash on delivery</span></div></footer>;
}

function App() {
  return <StoreProvider><Header /><Routes><Route path="/" element={<Home />} /><Route path="/shop" element={<Shop />} /><Route path="/product/:id" element={<ProductDetail />} /><Route path="/login" element={<AuthPage />} /><Route path="/cart" element={<Cart />} /><Route path="/checkout" element={<Protected><Checkout /></Protected>} /><Route path="/wishlist" element={<Wishlist />} /><Route path="/orders/:id" element={<Protected><OrderConfirmation /></Protected>} /><Route path="/admin" element={<Protected admin><Admin /></Protected>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes><Footer /></StoreProvider>;
}

export default App;
