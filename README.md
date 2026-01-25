# RemontCo - B2C Home & Property Services Marketplace

## Overview
RemontCo is a professional platform designed to connect end consumers with verified, legally registered construction and renovation companies. Our mission is to protect users from fraud, ensure legal accountability, and improve the quality of home services in Bulgaria.

## Core Values
- **Legal Only**: We exclusively partner with registered legal entities (companies). No freelancers or unverified individuals are allowed.
- **Transparency**: Guaranteed contracts, invoices, and traceable responsibility for every job.
- **Quality**: A curated list of professional companies across a wide range of services.

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES Modules), Bootstrap 5
- **Build Tool**: Vite
- **Backend**: Supabase (Authentication, PostgreSQL Database, Storage)
- **Internationalization**: Custom i18n system (BG/EN)

## Setup and Installation
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Rename `.env.example` to `.env` and add your Supabase credentials.
4. Run `npm run dev` to start the development server.

## Features
- **User Roles**: Consumer, Company Admin, Platform Admin.
- **Verification**: Mandatory EIK (BULSTAT) validation for all companies.
- **Bilingual Interface**: Support for Bulgarian and English.
- **Secure Auth**: Powered by Supabase Auth with RLS (Row Level Security).

## License
MIT License
