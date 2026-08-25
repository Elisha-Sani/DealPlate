<div align="center">
  <h1>🍽️ DealPlate</h1>
  <p><strong>Connecting Campus Vendors with Students to Eliminate Food Waste</strong></p>
</div>

## Overview

**DealPlate** is an innovative platform designed for university campuses. It allows food vendors (like bakeries and pizzerias) to instantly list surplus meals as discounted "Mystery Bags." Students can browse the live marketplace, secure massive discounts on food, and pay seamlessly via M-Pesa. 

By matching excess high-quality food with hungry students, DealPlate actively fights food waste while making campus dining incredibly affordable.

## ✨ Key Features

### For Vendors
- **Live Analytics Dashboard**: Real-time insights into total revenue, pending pickups, and active listings, complete with a beautiful visual area chart.
- **AI-Powered Deal Generation**: Leveraging the **Google Gemini API**, vendors can simply input basic ingredients and allergens, and the AI will auto-generate compelling marketing copy and detailed descriptions for their Mystery Bags.
- **Secure Pickup Verification**: A built-in numpad system allows vendors to verify 6-digit student pickup codes securely against the live database.

### For Students
- **Dynamic Marketplace Feed**: A live feed of all available deals from verified campus vendors, showcasing discounts (often 50%+ off).
- **Split-Layout Deal Details**: A premium UI for viewing deal details, remaining stock urgency, and pickup specifications.
- **M-Pesa Integration**: Frictionaless checkout simulation tailored for local payment methods.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) with React 19
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **AI Integration**: [Google Gemini API](https://aistudio.google.com/) (Server Actions)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Supabase Project
- A Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Elisha-Sani/DealPlate.git
   cd DealPlate
   ```

# DealPlate - Prototype

DealPlate is a modern, dynamic web application designed to connect university students with local food vendors to rescue high-quality surplus meals at significant discounts.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS, Framer Motion
- **Backend/Database:** Supabase (PostgreSQL, Auth, Realtime)
- **Deployment:** Vercel (Recommended)

## Demo Credentials
We have seeded the database with demo accounts for testing both sides of the marketplace:

**Student Account:**
- **Email:** student@demo.com
- **Password:** demo@_123

**Vendor Account:**
- **Email:** vendor@demo.com
- **Password:** demo@_123

## Setup Instructions
1. Install dependencies: `npm install`
2. Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Run the development server: `npm run dev`
4. Access the app at `http://localhost:3000`

## Features Implemented
- Live Realtime Deal Feed for Students
- Live Order Syncing & Dashboard Analytics for Vendors
- Supabase Authentication Integration
- Secure RLS (Row Level Security) Database Policies
- Interactive, responsive, and dynamic UI using Framer Motion