export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: '1rem', borderBottom: '1px solid #eaeaea' }}>
          <h1>GSMFlow Admin</h1>
          <nav>
            <a href="/">Dashboard</a> | <a href="/settings">Settings</a>
          </nav>
        </header>
        <main style={{ padding: '1rem' }}>
          {children}
        </main>
        <footer style={{ padding: '1rem', borderTop: '1px solid #eaeaea', marginTop: '2rem' }}>
          <p>GSMFlow Admin Dashboard - Foundation Phase</p>
        </footer>
      </body>
    </html>
  )
}
