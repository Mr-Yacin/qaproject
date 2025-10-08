import './globals.css'

export const metadata = {
  title: 'Q&A Article FAQ API',
  description: 'API-first backend for Q&A content management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
