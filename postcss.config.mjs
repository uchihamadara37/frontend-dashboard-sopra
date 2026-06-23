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
  }
};

export default config;
