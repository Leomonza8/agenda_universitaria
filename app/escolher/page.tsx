'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, Zap, ArrowRight, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { logout } from '@/lib/auth'

export default function EscolherPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>

      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Agenda Universitária</h1>
        <p className="text-muted-foreground text-lg">Escolha seu modo de organização</p>
      </div>

      {/* Opções */}
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl w-full mb-8">
        {/* Agenda Completa */}
        <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg group" onClick={() => router.push('/dashboard')}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <CardTitle className="text-xl">Agenda Completa</CardTitle>
            <CardDescription>Para planejamento detalhado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sistema completo com grade de horários, gerenciamento de disciplinas, tarefas, revisões e anotações.
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ Grade de horários interativa</li>
              <li>✓ Gerenciador de disciplinas</li>
              <li>✓ Tarefas e revisões</li>
              <li>✓ Calendário semanal</li>
            </ul>
          </CardContent>
        </Card>

        {/* Agenda Rápida (Bullet Journal) */}
        <Card className="border-2 hover:border-amber-500/50 transition-all cursor-pointer hover:shadow-lg group" onClick={() => router.push('/bullet-journal')}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
            </div>
            <CardTitle className="text-xl">Agenda Rápida</CardTitle>
            <CardDescription>Bullet Journal digital</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Método rápido e minimalista de planejamento inspirado em Bullet Journal.
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ Daily Log (tarefas, eventos, notas)</li>
              <li>✓ Habit Tracker visual</li>
              <li>✓ Mood Tracker diário</li>
              <li>✓ Collections personalizadas</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Você pode trocar de modo a qualquer momento nos ajustes da conta</p>
      </div>
    </div>
  )
}
