export const metadata = {
  title: 'Egbe em Movimento — Rifas',
  description: 'Sistema de rifas do Egbe em Movimento',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{margin:0, fontFamily:'system-ui, sans-serif', background:'#faf6f6'}}>
        {children}
      </body>
    </html>
  )
}
