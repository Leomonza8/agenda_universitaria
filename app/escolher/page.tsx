'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Zap, ArrowRight, LogOut, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSession, clearSession } from '@/lib/auth'

export default function EscolherPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }
    setUserName(session.name || 'Estudante')
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    clearSession()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="animate-pulse">
          <Sparkles className="h-8 w-8 text-stone-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout} 
          className="text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </header>

      {/* Conteudo */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {/* Saudacao */}
        <div className="mb-12 text-center">
          <p className="text-sm text-stone-400 dark:text-stone-500 mb-2">Bem-vindo de volta</p>
          <h1 className="text-3xl sm:text-4xl font-light text-stone-800 dark:text-stone-200 mb-4">
            Ola, {userName}
          </h1>
          <p className="text-stone-500 dark:text-stone-400">
            Como voce quer organizar seu dia hoje?
          </p>
        </div>

        {/* Cards de opcao */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl">
          {/* Agenda Completa */}
          <button
            onClick={() => router.push('/')}
            className="group relative bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-lg text-left"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-5 w-5 text-blue-500" />
            </div>
            
            <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <BookOpen className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            
            <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200 mb-2">
              Agenda Completa
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              Planejamento detalhado com grade de horarios, disciplinas, tarefas e revisoes
            </p>
            
            <div className="flex flex-wrap gap-2">
              {['Grade', 'Tarefas', 'Revisoes', 'Calendario'].map(tag => (
                <span 
                  key={tag}
                  className="px-2 py-1 text-xs rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>

          {/* Agenda Rapida */}
          <button
            onClick={() => router.push('/bullet-journal')}
            className="group relative bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-700 transition-all hover:shadow-lg text-left"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-5 w-5 text-amber-500" />
            </div>
            
            <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Zap className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            
            <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200 mb-2">
              Agenda Rapida
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              Bullet Journal digital - rapido, minimalista e focado no essencial
            </p>
            
            <div className="flex flex-wrap gap-2">
              {['Daily Log', 'Habitos', 'Notas', 'Minimalista'].map(tag => (
                <span 
                  key={tag}
                  className="px-2 py-1 text-xs rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        </div>

        {/* Dica */}
        <p className="mt-8 text-center text-xs text-stone-400 dark:text-stone-500">
          Voce pode trocar de modo a qualquer momento
        </p>
      </main>
    </div>
  )
}
