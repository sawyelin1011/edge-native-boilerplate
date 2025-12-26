export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: '1rem', borderBottom: '1px solid #eaeaea' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>GSMFlow Storefront</h1>
            <div>
              <a href="/" style={{ marginRight: '1rem' }}>Home</a>
              <a href="/products">Products</a>
            </div>
          </nav>
        </header>
        <main style={{ padding: '1rem', minHeight: 'calc(100vh - 150px)' }}>
          {children}
        </main>
        <footer style={{ padding: '1rem', borderTop: '1px solid #eaeaea', textAlign: 'center' }}>
          <p>GSMFlow Storefront - Foundation Phase</p>
        </footer>
      </body>
    </html>
  )
}
