# SalinTinig 🎙️ - Deployment & Operations Guide

This guide covers step-by-step instructions for deploying and maintaining the **SalinTinig** Web App, Backend API, Cloudflare DNS, Custom Domain, and Resend Email Services.

---

## 🌐 1. Domain & DNS Configuration (Name.com + Cloudflare)

### Domain
- **Registered Domain**: `salintinig.org` (Purchased on Name.com)

### Custom Nameservers on Name.com
Replace default Name.com nameservers with Cloudflare assigned nameservers:
- `harmony.ns.cloudflare.com`
- `trevor.ns.cloudflare.com`

### Cloudflare DNS Records
| Type | Name | Target / Content | Proxy Status | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `CNAME` | `@` (`salintinig.org`) | `salintinig.pages.dev` | 🟠 Proxied | Web frontend routing with CNAME flattening |
| `CNAME` | `www` | `salintinig.pages.dev` | 🟠 Proxied | WWW subdomain routing |
| `TXT` | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3...` | ⚪ DNS Only | Resend DKIM email verification |
| `CNAME` | `rsend` | `rsend-apne1.forge.rmta.net` | ⚪ DNS Only | Resend SPF email verification |
| `CNAME` | `send` | `send.forge.rmta.net` | ⚪ DNS Only | Resend sending domain verification |
| `TXT` | `_dmarc` | `v=DMARC1; p=none;` | ⚪ DNS Only | DMARC email policy |

---

## ⚡ 2. Frontend Deployment (Cloudflare Pages)

1. **Repository Link**: Connected to GitHub `iamaoii/salintinig` (`dev` branch).
2. **Build Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
   - **Root Directory**: `frontend`
3. **Environment Variables**:
   - `VITE_API_URL` = `https://salintinig.onrender.com`

---

## ⚙️ 3. Backend Deployment (Render Web Service)

1. **Service Type**: Render Node.js Web Service
2. **Build Command**: `npm install`
3. **Start Command**: `npm start` (or `node src/index.js`)
4. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5000
   CLIENT_URL=https://salintinig.org
   SUPABASE_URL=https://your-supabase-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GROQ_API_KEY=gsk_your_groq_api_key
   RESEND_API_KEY=re_your_resend_api_key
   RESEND_FROM_EMAIL=SalinTinig <noreply@salintinig.org>
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   JWT_SECRET=your_jwt_secret_key
   ```

---

## ✉️ 4. Transactional Email Setup (Resend)

1. **Domain Verification**: `salintinig.org` verified in Resend.
2. **Sender Behavior**:
   - **Development (`NODE_ENV !== 'production'`)**: Sends from `SalinTinig <onboarding@resend.dev>` (Restricted to account owner to prevent spamming test users).
   - **Production (`NODE_ENV === 'production'`)**: Sends from `SalinTinig <noreply@salintinig.org>` (Delivers to any email worldwide).
3. **Sender Logo Icons**:
   - Registered `noreply@salintinig.org` on **Google Account** ("Use my current email address instead") & **Gravatar** with the official SalinTinig logo icon for Gmail, Yahoo, Outlook & Apple Mail.

---

## 🧪 5. Verification Checklist

- [x] `https://salintinig.org` loads with HTTPS green padlock icon.
- [x] `https://www.salintinig.org` redirects and loads seamlessly.
- [x] Login and teacher PHIL-IRI dashboards fetch data directly from `https://salintinig.onrender.com`.
- [x] Welcome temporary passwords and password reset emails deliver from `noreply@salintinig.org`.
