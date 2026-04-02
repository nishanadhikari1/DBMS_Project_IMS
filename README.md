# Everest Inventory Management System

## Setup Instructions

1. **Clone/Download the project.**
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Environment Variables:**
   Create a `.env` file in the root directory (or use the one provided) with the following:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

## Troubleshooting

### Tailwind CSS Native Bindings
Tailwind v4 uses a Rust-based engine (`@tailwindcss/oxide`). If `npm` fails to install the correct native binding for your platform, we have added them as `optionalDependencies` in `package.json`. Running `npm install` should automatically pick the right one.
