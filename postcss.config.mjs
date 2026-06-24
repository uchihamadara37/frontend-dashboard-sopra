const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
  async redirects(){
    return [
      {
        source: '/',          // Jika user mengakses rute asal ini...
        destination: '/chat', // ...arahkan secara paksa ke rute ini
        permanent: true,      
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*', // Jika frontend memanggil rute yang berawalan /api/...
        destination: 'http://163.61.58.96:5000/api/:path*', // ...Vercel yang akan meneruskannya ke VPS ini
      },
    ]
  },
};

export default config;
