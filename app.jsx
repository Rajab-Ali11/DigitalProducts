/*
Digital Products Frontend - single-file React app
Drop this file into a Vite+React project as `src/App.jsx` and run `npm install` with React Router + Axios.

Quick setup (recommended):
1) npm create vite@latest my-store -- --template react
2) cd my-store
3) npm install axios react-router-dom
4) Replace src/App.jsx with this file, create src/main.jsx as Vite default, then run `npm run dev`.

This app is a full-featured frontend that connects to the backend endpoints:
- GET /api/products
- GET /api/products/:id
- POST /api/auth/login
- POST /api/auth/register
- POST /api/checkout (protected)
- /api/admin/... endpoints for admin (protected)

NOTE: This is a single-file example for speed. For production split into components, add CSS pipeline (Tailwind), and secure keys.
*/

import React, { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

/* ----------------- Simple CSS (scoped via module-like approach) ----------------- */
const styles = `
:root{--accent:#6d28d9;--muted:#6b7280}
*{box-sizing:border-box}
body{font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial; margin:0; background:#f7f7fb; color:#111}
.header{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#fff;border-bottom:1px solid #e6e6ee}
.logo{font-weight:700;color:var(--accent)}
.nav a{margin-right:12px;text-decoration:none;color:#374151}
.container{max-width:1100px;margin:24px auto;padding:0 16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
.card{background:#fff;border-radius:12px;padding:12px;border:1px solid #edf0f7}
.card img{width:100%;height:160px;object-fit:cover;border-radius:8px}
.button{background:var(--accent);color:#fff;padding:8px 12px;border-radius:8px;border:none;cursor:pointer}
.button.ghost{background:transparent;color:var(--accent);border:1px solid #ece7ff}
.input{padding:8px;border-radius:8px;border:1px solid #e6e6ee;width:100%}
.row{display:flex;gap:8px;align-items:center}
.badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#f3f4f6;font-size:13px}
.footer{padding:24px;text-align:center;color:var(--muted);font-size:14px}
`;

/* ----------------- Auth & App Context ----------------- */
const AuthContext = createContext();
function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            // decode minimal info from JWT if needed or call /api/me (backend not provided)
            // here we'll just set a placeholder
            setUser({ email: 'user@me' });
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        } else {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        }
    }, [token]);

    const login = async (email, password) => {
        const res = await axios.post('/api/auth/login', { email, password });
        if (res.data?.token) { setToken(res.data.token); return { ok: true }; }
        return { ok: false, error: res.data?.error || 'Login failed' };
    };
    const register = async (email, password) => {
        const res = await axios.post('/api/auth/register', { email, password });
        if (res.data?.token) { setToken(res.data.token); return { ok: true }; }
        return { ok: false, error: res.data?.error || 'Register failed' };
    };
    const logout = () => setToken(null);

    return (
        <AuthContext.Provider value={{ token, login, register, logout, user }}>
            {children}
        </AuthContext.Provider>
    );
}

/* ----------------- Small UI helpers ----------------- */
function formatPrice(p) { return p === 0 ? 'Free' : '$' + (p / 100).toFixed(2); }
function useToast() { const [msg, setMsg] = useState(null); useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 3500); return () => clearTimeout(t); }, [msg]); return { msg, show: setMsg } }

/* ----------------- Pages ----------------- */
function Header() {
    const auth = useAuth();
    const navigate = useNavigate();
    return (
        <header className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="logo">DIGI<span style={{ color: 'var(--muted)' }}>STORE</span></div>
                <nav className="nav" style={{ marginLeft: 8 }}>
                    <Link to="/">Home</Link>
                    <Link to="/products">Products</Link>
                    <Link to="/admin">Admin</Link>
                </nav>
            </div>
            <div className="row">
                <Link to="/cart" className="badge">Cart</Link>
                {auth.token ? (
                    <>
                        <button className="button ghost" onClick={() => { auth.logout(); navigate('/'); }}>Logout</button>
                    </>
                ) : (
                    <Link to="/auth"><button className="button">Login</button></Link>
                )}
            </div>
        </header>
    );
}

function Home() {
    const [featured, setFeatured] = useState([]);
    useEffect(() => { axios.get('/api/products').then(r => setFeatured(r.data.slice(0, 6))).catch(() => { }); }, []);
    return (
        <div>
            <section style={{ background: 'linear-gradient(90deg,#eef2ff,#fdf2ff)', padding: 32 }}>
                <div className="container">
                    <h1 style={{ fontSize: 32, margin: 0 }}>Sell digital products — fast</h1>
                    <p style={{ color: 'var(--muted)' }}>Instant downloads, license control, and secure delivery.</p>
                </div>
            </section>
            <div className="container">
                <h2>Featured</h2>
                <div className="grid">
                    {featured.map(p => (
                        <div key={p.id} className="card">
                            <img src={p.coverImageUrl || '/placeholder.png'} alt="cover" />
                            <h3>{p.title}</h3>
                            <p style={{ color: 'var(--muted)' }}>{p.description}</p>
                            <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
                                <div>{formatPrice(p.price)}</div>
                                <Link to={`/product/${p.id}`}><button className="button">View</button></Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Products() {
    const [products, setProducts] = useState([]);
    const [q, setQ] = useState('');
    useEffect(() => { axios.get('/api/products').then(r => setProducts(r.data)).catch(() => { }); }, []);
    const filtered = products.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
    return (
        <div className="container">
            <h2>All Products</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input className="input" placeholder="Search products..." value={q} onChange={(e) => setQ(e.target.value)} />
                <Link to="/products?sort=latest"><button className="button ghost">Sort</button></Link>
            </div>
            <div className="grid">
                {filtered.map(p => (
                    <div key={p.id} className="card">
                        <img src={p.coverImageUrl || '/placeholder.png'} alt="cover" />
                        <h3>{p.title}</h3>
                        <p style={{ color: 'var(--muted)' }}>{p.description}</p>
                        <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
                            <div>{formatPrice(p.price)}</div>
                            <Link to={`/product/${p.id}`}><button className="button">View</button></Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const auth = useAuth();
    const toast = useToast();

    useEffect(() => { setLoading(true); axios.get('/api/products/' + id).then(r => { setProduct(r.data); }).catch(() => { }).finally(() => setLoading(false)); }, [id]);

    const buyNow = async () => {
        if (!auth.token) return toast.show('Please login first');
        try {
            const res = await axios.post('/api/checkout', { productId: id });
            if (res.data?.downloadUrl) {
                // show link
                window.location.href = res.data.downloadUrl;
            } else {
                toast.show(res.data?.error || 'Checkout failed');
            }
        } catch (e) { toast.show('Checkout error'); }
    };

    if (loading) return <div className="container">Loading...</div>;
    if (!product) return <div className="container">Product not found.</div>;

    return (
        <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
                <div>
                    <img src={product.coverImageUrl || '/placeholder.png'} style={{ width: '100%', borderRadius: 12 }} />
                    <h2>{product.title}</h2>
                    <p style={{ color: 'var(--muted)' }}>{product.description}</p>
                </div>
                <aside className="card">
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{formatPrice(product.price)}</div>
                    <div style={{ marginTop: 12 }}>
                        <button className="button" onClick={buyNow}>{product.price === 0 ? 'Download' : 'Buy & Download'}</button>
                    </div>
                </aside>
            </div>
        </div>
    );
}

/* ----------------- Simple Cart (in-memory) ----------------- */
const CartContext = createContext();
function CartProvider({ children }) {
    const [items, setItems] = useState([]);
    const add = (product, qty = 1) => setItems(prev => { const found = prev.find(p => p.id === product.id); if (found) return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + qty } : p); return [...prev, { ...product, qty }] });
    const remove = (id) => setItems(prev => prev.filter(p => p.id !== id));
    const clear = () => setItems([]);
    return <CartContext.Provider value={{ items, add, remove, clear }}>{children}</CartContext.Provider>
}
function useCart() { return useContext(CartContext); }

function CartPage() {
    const { items, remove, clear } = useCart();
    const total = items.reduce((s, it) => s + (it.price * it.qty), 0);
    return (
        <div className="container">
            <h2>Cart</h2>
            {items.length === 0 ? <p>Your cart is empty.</p> : (
                <div>
                    {items.map(it => (
                        <div key={it.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <img src={it.coverImageUrl || '/placeholder.png'} style={{ width: 100, height: 60, objectFit: 'cover' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>{it.title}</div>
                                <div style={{ color: 'var(--muted)' }}>{formatPrice(it.price)} x {it.qty}</div>
                            </div>
                            <div>
                                <button className="button ghost" onClick={() => remove(it.id)}>Remove</button>
                            </div>
                        </div>
                    ))}
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700 }}>Total: {formatPrice(total)}</div>
                        <div>
                            <button className="button ghost" onClick={clear}>Clear</button>
                            <Link to="/checkout"><button className="button" style={{ marginLeft: 8 }}>Checkout</button></Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ----------------- Auth Page ----------------- */
function AuthPage() {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const auth = useAuth();
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        if (mode === 'login') {
            const r = await auth.login(email, pass);
            if (r.ok) navigate('/'); else alert(r.error);
        } else {
            const r = await auth.register(email, pass);
            if (r.ok) navigate('/'); else alert(r.error);
        }
    };

    return (
        <div className="container">
            <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
            <form onSubmit={submit} style={{ maxWidth: 420 }}>
                <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input className="input" placeholder="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} />
                <div style={{ marginTop: 8 }}>
                    <button className="button" type="submit">{mode === 'login' ? 'Login' : 'Register'}</button>
                    <button type="button" className="button ghost" style={{ marginLeft: 8 }} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Switch to Register' : 'Switch to Login'}</button>
                </div>
            </form>
        </div>
    );
}

/* ----------------- Admin Page (frontend for admin API) ----------------- */
function AdminPage() {
    const auth = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ title: '', description: '', price: 0, coverImageUrl: '' });

    useEffect(() => { load(); }, []);
    const load = () => axios.get('/api/products').then(r => { setProducts(r.data); setLoading(false); }).catch(() => setLoading(false));

    const create = async (e) => {
        e.preventDefault();
        if (!auth.token) return alert('Login as admin');
        const payload = { ...form, price: Number(form.price) };
        const res = await axios.post('/api/admin/products', payload, { headers: { Authorization: 'Bearer ' + auth.token } }).catch(e => e.response?.data);
        if (res?.data?.id) { alert('Created'); load(); } else alert('Create failed');
    };

    const uploadFile = async (id, file) => {
        const fd = new FormData(); fd.append('file', file);
        const res = await axios.post(`/api/admin/products/${id}/file`, fd, { headers: { Authorization: 'Bearer ' + auth.token } }).catch(e => e.response?.data);
        if (res?.data?.filePath) alert('Uploaded'); else alert('Upload failed');
        load();
    };

    return (
        <div className="container">
            <h2>Admin</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
                <div>
                    <h3>Create Product</h3>
                    <form className="card" onSubmit={create}>
                        <input className="input" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                        <textarea className="input" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        <input className="input" placeholder="Price (in cents, e.g. 799 = $7.99)" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                        <input className="input" placeholder="Cover Image URL" value={form.coverImageUrl} onChange={e => setForm({ ...form, coverImageUrl: e.target.value })} />
                        <div style={{ marginTop: 8 }}><button className="button" type="submit">Create</button></div>
                    </form>

                    <h3 style={{ marginTop: 16 }}>Your Products</h3>
                    {loading ? <p>Loading...</p> : (
                        <div className="grid">
                            {products.map(p => (
                                <div key={p.id} className="card">
                                    <img src={p.coverImageUrl || '/placeholder.png'} />
                                    <h4>{p.title}</h4>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input type="file" onChange={e => uploadFile(p.id, e.target.files[0])} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <aside>
                    <div className="card">
                        <h4>Admin Tips</h4>
                        <p style={{ color: 'var(--muted)' }}>Default admin (change in backend .env): admin@example.com / admin123</p>
                        <p style={{ color: 'var(--muted)' }}>Files uploaded via the file input will be attached to products for download.</p>
                    </div>
                </aside>
            </div>
        </div>
    );
}

/* ----------------- Checkout (simple) ----------------- */
function Checkout() {
    // For simplicity, assume cart has single item and we call /api/checkout
    const { items, clear } = useCart();
    const auth = useAuth();
    const navigate = useNavigate();

    const doCheckout = async () => {
        if (!auth.token) return alert('Login first');
        if (!items.length) return alert('Cart empty');
        try {
            // naive: checkout first item
            const res = await axios.post('/api/checkout', { productId: items[0].id });
            if (res.data?.downloadUrl) {
                window.location.href = res.data.downloadUrl;
                clear();
            } else alert(res.data?.error || 'Checkout failed');
        } catch (e) { alert('Checkout error'); }
    };

    return (
        <div className="container">
            <h2>Checkout</h2>
            <p>Items: {items.length}</p>
            <button className="button" onClick={doCheckout}>Pay & Get Download</button>
            <button className="button ghost" style={{ marginLeft: 8 }} onClick={() => navigate('/cart')}>Back to Cart</button>
        </div>
    );
}

/* ----------------- App Root ----------------- */
export default function App() {
    // inject styles
    useEffect(() => {
        const s = document.createElement('style'); s.innerHTML = styles; document.head.appendChild(s); return () => { document.head.removeChild(s); };
    }, []);

    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <Header />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="*" element={<div className="container">Not found.</div>} />
                    </Routes>
                    <footer className="footer">&copy; {new Date().getFullYear()} Digital Products Store</footer>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}
