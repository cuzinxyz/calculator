# EzSplit

EzSplit is a web-based expense splitting application built with Nuxt 3, Tailwind CSS, and Supabase. It helps groups of friends or colleagues easily manage and split shared expenses.

## Features

### Role-Based Access
- **Payer Role**: View and manage payments that need to be settled
- **Spender Role**: Create and manage expenses

### Expense Management
- Create and track shared expenses
- Support for both equal and custom split amounts
- Automatic calculation of who owes what
- Pagination for expense lists
- Real-time expense summaries

### User Management
- Add and manage users with their banking information
- Support for multiple banks
- QR code generation for quick bank transfers
- Easy-to-use interface for updating user details

### Payment Features
- Generate QR codes for bank transfers
- Track payment status
- View payment history
- Automatic calculation of balances

## Getting Started

### Prerequisites
- Node.js (version 16.11.0 or higher)
- NPM or Yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ez-split
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:4001`

### Deployment

To deploy to GitHub Pages:
```bash
npm run deploy
```

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, Tailwind CSS
- **State Management**: Pinia
- **Backend/Database**: Supabase
- **UI Components**: HeadlessUI, HeroIcons
- **Styling**: Tailwind CSS
- **Deployment**: GitHub Pages

## Project Structure

```
ez-split/
├── assets/          # Static assets and global CSS
├── components/      # Vue components
├── composables/     # Composable functions
├── pages/          # Application pages
├── stores/         # Pinia stores
├── supabase/       # Supabase schema and configurations
└── public/         # Public static files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Made with ♥️ by abner

## Acknowledgments

- [Nuxt.js](https://nuxt.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com)
- [Vue Toastification](https://github.com/Maronato/vue-toastification)
