import api from './api';

const d = async p => (await p).data;
export const listUsers = async role => (await api.get('/users', {params: role ? {role} : {}})).data.map(u => ({
    ...u,
    id: u.id || u._id,
    joinedAt: u.joinedAt || u.createdAt
}));
export const setUserStatus = (id, status) => d(api.patch(`/users/${id}/status`, {status}));
export const listSellers = async () => (await api.get('/sellers')).data.map(s => ({
    ...s,
    id: s.id || s._id,
    storeName: s.storeName || s.name || 'Unnamed seller',
    businessName: s.businessName || s.storeName || s.name || 'Unnamed seller',
    ownerName: s.ownerName || s.name || '',
    ownerEmail: s.ownerEmail || s.email || '',
    accountStatus: s.accountStatus || s.status || 'Inactive'
}));
export const getSeller = async id => {
    if (id) {
        try {
            return await d(api.get(`/public/sellers/${id}`));
        } catch (e) {
            if (e.response?.status !== 401 && e.response?.status !== 403) throw e;
        }
    }
    return null;
};
export const getSellerAdmin = async id => {
    const data = await d(api.get(`/sellers/${id}`));
    return {
        ...data,
        seller: {
            ...data.seller,
            id: data.seller?.id || data.seller?._id,
            storeName: data.seller?.storeName || data.seller?.name || 'Unnamed seller'
        },
        products: (data.products || []).map(p => ({...p, id: p.id || p._id}))
    };
};
export const setSellerApproval = (id, approvalStatus) => d(api.patch(`/sellers/${id}/review`, {approvalStatus}));
export const updateSellerProfile = (id, patch) => d(api.patch(`/users/${id}`, patch));
export const reviewSellerApplication = (id, decision, reason) => d(api.patch(`/sellers/${id}/review`, {
    approvalStatus: decision,
    rejectionReason: reason
}));
export const getUserDetail = async id => {
    const data = await d(api.get(`/users/${id}`));
    return {
        ...data,
        user: data.user ? {
            ...data.user,
            id: data.user.id || data.user._id,
            joinedAt: data.user.joinedAt || data.user.createdAt,
            lastLogin: data.user.lastLogin || data.user.updatedAt,
            customer: data.user.customer || (() => {
                const address = (data.user.addresses || []).find(a => a.isDefault) || data.user.addresses?.[0];
                return address ? {
                    address: address.address,
                    city: address.city,
                    district: address.district,
                    postalCode: address.postalCode
                } : null;
            })()
        } : data.user,
        orders: (data.orders || []).map(o => ({...o, id: o.id || o._id}))
    };
};
const productImageFallback = {
    'Aura Pro Wireless': 'product-aura-pro-wireless.png',
    'Studio Wireless Mic': 'product-studio-wireless-mic.png',
    'Smart Fitness Watch': 'product-watch.jpg',
    'Ceylon Cotton Tee': 'product-cotton-tee.png',
    'Denim Jacket': 'product-denim-jacket.png',
    'Rattan Pendant Light': 'product-rattan-pendant-light.png',
    'Modern Table Lamp': 'product-lamp.jpg',
    'Scented Soy Candle Trio': 'product-scented-soy-candle-trio.png',
    'Vit C Glow Serum': 'product-vitc-serum.png',
    'Cloud Plush Bear': 'product-cloud-plush-bear.png',
    'Educational Building Blocks': 'product-builing-blocks.png',
    'Premium Ceylon Tea': 'product-ceylon-tea.png',
    'Organic Wildflower Honey': 'product-organic-wildflower-honey.png',
    'Leather Everyday Bag': 'product-bag.jpg'
};
const productImageUrl = name => productImageFallback[name] ? `https://res.cloudinary.com/m1b97faq/image/upload/${productImageFallback[name]}` : '';
export const getAdminSellerDetail = async id => {
    const data = await d(api.get(`/sellers/${id}`));
    return {
        ...data,
        seller: data.seller ? {
            ...data.seller,
            id: data.seller.id || data.seller._id,
            storeName: data.seller.storeName || data.seller.name || 'Unnamed seller',
            ownerName: data.seller.ownerName || data.seller.name || '',
            ownerEmail: data.seller.ownerEmail || data.seller.email || '',
            businessAddress: data.seller.businessAddress || '',
            joinedAt: data.seller.joinedAt || data.seller.createdAt,
            appliedAt: data.seller.appliedAt || data.seller.createdAt
        } : data.seller,
        products: (data.products || []).map(p => ({
            ...p,
            id: p.id || p._id,
            _id: p._id || p.id,
            image: p.image || p.images?.[0] || productImageUrl(p.name)
        }))
    };
};
export const listCategories = async () => (await api.get('/categories')).data.map(c => ({...c, id: c.id || c._id}));
export const saveCategory = (data, id) => d(id ? api.patch(`/categories/${id}`, data) : api.post('/categories', data));
export const deleteCategory = id => d(api.delete(`/categories/${id}`));
export const getProfile = () => d(api.get('/auth/me'));
export const updateProfile = (id, data) => {
    const f = new FormData();
    Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null && k !== 'avatar') f.append(k, v)
    });
    if (data.avatar instanceof File) f.append('avatar', data.avatar);
    return d(api.patch('/account/profile', f))
};
export const deleteAvatar = () => d(api.delete('/account/profile/avatar'));
export const getAddresses = () => d(api.get('/account/addresses'));
export const addAddress = x => d(api.post('/account/addresses', x));
export const updateAddress = (id, x) => d(api.patch(`/account/addresses/${id}`, x));
export const deleteAddress = id => d(api.delete(`/account/addresses/${id}`));
export const getPlatformStats = () => d(api.get('/admin/stats'));
export const getSellerStats = () => d(api.get('/seller/stats'));