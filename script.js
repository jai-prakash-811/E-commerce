const { useState, useEffect } = React;

const API_URL = 'http://localhost:5000/api';
const fallbackProducts = [
  { id: 'p1', name: 'Classic Leather Jacket', price: 2999, category: 'Jackets', rating: 4.8, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', description: 'Premium quality jacket with a clean and elegant silhouette.' },
  { id: 'p2', name: 'Running Shoes', price: 799, category: 'Footwear', rating: 4.7, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', description: 'Shock-absorbing comfort designed for speed and style.' },
  { id: 'p3', name: 'Cotton Casual Shirt', price: 1299, category: 'Apparel', rating: 4.6, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', description: 'Everyday essential with soft cotton texture and relaxed fit.' },
  { id: 'p4', name: 'Polarized Sunglasses', price: 1799, category: 'Accessories', rating: 4.9, image: 'https://images.unsplash.com/photo-1577803947579-9f2cb2f4b9d6?auto=format&fit=crop&w=900&q=80', description: 'Premium UV protection and comfortable all-day wear.' },
  { id: 'p5', name: 'Urban Backpack', price: 1999, category: 'Accessories', rating: 4.5, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80', description: 'Spacious and durable for work, travel, and daily commute.' },
  { id: 'p6', name: 'Smart Watch', price: 3499, category: 'Gadgets', rating: 4.8, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80', description: 'Modern wearable with health tracking and premium finish.' }
];

const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function App() {
  const [products, setProducts] = useState(fallbackProducts);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('ecommerce-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    const token = localStorage.getItem('ecommerce-token');
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: 'Bearer ' + token }
      })
        .then((res) => res.ok ? res.json() : Promise.reject())
        .then((data) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('ecommerce-token');
          localStorage.removeItem('ecommerce-user');
          setUser(null);
        });
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ecommerce-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ecommerce-user');
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      if (Array.isArray(data) && data.length) {
        setProducts(data);
      }
    } catch (error) {
      setProducts(fallbackProducts);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFeedback('');

    try {
      const endpoint = authMode === 'login' ? `${API_URL}/auth/login` : `${API_URL}/auth/signup`;
      const payload = authMode === 'login'
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to process request');
      }

      localStorage.setItem('ecommerce-token', data.token);
      setUser(data.user);
      setAuthOpen(false);
      setFormData({ name: '', email: '', password: '' });
      setFeedback(data.message);
    } catch (error) {
      setFeedback(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const totalCartValue = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const filteredProducts = products.filter((product) => {
    const query = search.toLowerCase();
    return product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query);
  });

  const logout = () => {
    localStorage.removeItem('ecommerce-token');
    localStorage.removeItem('ecommerce-user');
    setUser(null);
  };

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <p>Free shipping on orders above ₹2,999 • 30-day easy returns</p>
          <div className="auth-toggle">
            {user ? (
              <>
                <span className="welcome-text">Hi, {user.name}</span>
                <button className="ghost-button" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <button className={`toggle-button ${authMode === 'login' && authOpen ? 'active' : ''}`} onClick={() => { setAuthMode('login'); setAuthOpen(true); }}>
                  Sign In
                </button>
                <button className={`toggle-button ${authMode === 'signup' && authOpen ? 'active' : ''}`} onClick={() => { setAuthMode('signup'); setAuthOpen(true); }}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="navbar">
        <div className="container navbar-inner">
          <div className="logo-wrap">
            <span className="logo-mark">S</span>
            <span>ShopVerse</span>
          </div>

          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#shop">Shop</a></li>
            <li><a href="#collections">Collections</a></li>
            <li><a href="#news">Blog</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          <div className="nav-actions">
            <button className="cart-button">
              <i className="bx bx-shopping-bag"></i>
              <span>{cart.reduce((total, item) => total + item.quantity, 0)}</span>
            </button>
          </div>
        </div>
      </nav>

      <main>
        <section id="home" className="hero-section">
          <div className="container hero-grid">
            <div className="hero-image-box">
              <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80" alt="shopping collection" />
            </div>
            <div className="hero-content">
              <p className="eyebrow">Summer Collection</p>
              <h1>Fresh styles for every season</h1>
              <p className="hero-text">Premium fashion essentials designed to keep you confident, comfy, and trend-forward all year round.</p>
              <div className="hero-actions">
                <a href="#shop" className="primary-btn">Shop now</a>
                <button className="secondary-btn" onClick={() => { setAuthMode('signup'); setAuthOpen(true); }}>Create account</button>
              </div>
              <div className="social-links">
                <a href="#"><i className="bx bxl-facebook"></i></a>
                <a href="#"><i className="bx bxl-twitter"></i></a>
                <a href="#"><i className="bx bxl-instagram"></i></a>
                <a href="#"><i className="bx bxl-pinterest"></i></a>
              </div>
            </div>
          </div>
        </section>

        <section id="collections" className="collections-section">
          <div className="container collections-grid">
            <article className="collection-card large-card">
              <img src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80" alt="fashion collection" />
              <div className="collection-overlay">
                <p>Clothing Collection</p>
                <button>Shop now</button>
              </div>
            </article>
            <article className="collection-card">
              <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80" alt="shoes collection" />
              <div className="collection-overlay">
                <p>Shoes Spring</p>
                <button>Shop now</button>
              </div>
            </article>
            <article className="collection-card">
              <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80" alt="accessories collection" />
              <div className="collection-overlay">
                <p>Accessories</p>
                <button>Shop now</button>
              </div>
            </article>
          </div>
        </section>

        <section id="shop" className="shop-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Best sellers</p>
                <h2>Top sales</h2>
              </div>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                className="search-box"
              />
            </div>

            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image-box">
                    <img src={product.image} alt={product.name} />
                  </div>
                  <div className="product-body">
                    <div className="product-meta">
                      <span>{product.category}</span>
                      <span>⭐ {product.rating}</span>
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="product-footer">
                      <strong>{currencyFormatter.format(product.price)}</strong>
                      <button onClick={() => addToCart(product)}>Add to cart</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="deal-section">
          <div className="container deal-grid">
            <div className="deal-copy">
              <p className="eyebrow">Deal of the week</p>
              <h3>Comfortable and affordable modern essentials</h3>
            </div>
            <div className="deal-info">
              <span>Up to 50% off</span>
              <p>Refresh your wardrobe with premium picks that balance quality, comfort, and trend-setting style.</p>
              <button className="primary-btn" onClick={() => { setAuthMode('signup'); setAuthOpen(true); }}>Claim offer</button>
            </div>
          </div>
        </section>

        <section id="news" className="blog-section">
          <div className="container">
            <div className="section-heading center">
              <p className="eyebrow">Latest news</p>
              <h2>Fashion new trends</h2>
            </div>
            <div className="blog-grid">
              <article className="blog-card">
                <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80" alt="trend" />
                <div className="blog-copy">
                  <span>12 November 2025</span>
                  <h4>New style direction for winter</h4>
                  <a href="#">Read more</a>
                </div>
              </article>
              <article className="blog-card">
                <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80" alt="trend" />
                <div className="blog-copy">
                  <span>16 November 2025</span>
                  <h4>Comfort meets craftsmanship</h4>
                  <a href="#">Read more</a>
                </div>
              </article>
              <article className="blog-card">
                <img src="https://images.unsplash.com/photo-1577803947579-9f2cb2f4b9d6?auto=format&fit=crop&w=900&q=80" alt="trend" />
                <div className="blog-copy">
                  <span>21 November 2025</span>
                  <h4>Upgrade your daily look</h4>
                  <a href="#">Read more</a>
                </div>
              </article>
            </div>
          </div>
        </section>

        <aside className="cart-panel">
          <div className="cart-header">
            <h3>Your cart</h3>
            <span>{cart.length} items</span>
          </div>
          {cart.length === 0 ? (
            <p className="empty-cart">Your cart is empty.</p>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.quantity} × {currencyFormatter.format(item.price)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)}>Remove</button>
                  </div>
                ))}
              </div>
              <div className="cart-summary">
                <span>Total</span>
                <strong>{currencyFormatter.format(totalCartValue)}</strong>
              </div>
              <button className="checkout-button">Checkout</button>
            </>
          )}
        </aside>
      </main>

      <footer id="contact" className="site-footer">
        <div className="container footer-grid">
          <div>
            <div className="logo-wrap footer-logo">
              <span className="logo-mark">S</span>
              <span>ShopVerse</span>
            </div>
            <p>Premium products, trend-led styling, and a seamless shopping experience designed for modern life.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <a href="#shop">Trending now</a>
            <a href="#shop">Sales</a>
            <a href="#shop">New arrivals</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#news">About us</a>
            <a href="#contact">Contact</a>
            <a href="#">Careers</a>
          </div>
          <div>
            <h4>Support</h4>
            <a href="#">Help center</a>
            <a href="#">Shipping</a>
            <a href="#">Privacy</a>
          </div>
        </div>
        <div className="footer-bottom">Designed & built for a modern e-commerce experience.</div>
      </footer>

      {authOpen && (
        <div className="auth-modal-overlay" onClick={() => setAuthOpen(false)}>
          <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
            <div className="auth-header">
              <h3>{authMode === 'login' ? 'Welcome back' : 'Create account'}</h3>
              <button className="close-button" onClick={() => setAuthOpen(false)}>×</button>
            </div>

            <div className="auth-toggle-row">
              <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
              <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Sign Up</button>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authMode === 'signup' && (
                <input type="text" name="name" placeholder="Full name" value={formData.name} onChange={handleFormChange} required />
              )}
              <input type="email" name="email" placeholder="Email address" value={formData.email} onChange={handleFormChange} required />
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleFormChange} required />
              {feedback && <p className="auth-feedback">{feedback}</p>}
              <button type="submit" className="primary-btn full-width" disabled={loading}>
                {loading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
