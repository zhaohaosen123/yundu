/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { useSystemConfig } from '@/hooks/use-system-config'

import './auth-layout.css'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  return (
    <div className='yundu-auth-layout'>
      <aside className='yundu-auth-aside' aria-hidden='true'>
        <div className='yundu-auth-aside-grid' />
        <div className='yundu-auth-aside-orbit yundu-auth-aside-orbit-outer' />
        <div className='yundu-auth-aside-orbit yundu-auth-aside-orbit-inner' />
        <div className='yundu-auth-aside-core'>云渡</div>
        <div className='yundu-auth-aside-copy'>
          <span>YUNDU / INTELLIGENCE GATEWAY</span>
          <h2>
            {t('Connect every idea')}
            <br />
            {t('to the right intelligence.')}
          </h2>
          <p>{t('Intelligent access, one gateway')}</p>
        </div>
      </aside>
      <div className='yundu-auth-main'>
        <Link to='/' className='yundu-auth-brand'>
          <div className='relative h-8 w-8'>
            {loading ? (
              <Skeleton className='absolute inset-0 rounded-full' />
            ) : (
              <img
                src={logo}
                alt={t('Logo')}
                className='h-8 w-8 rounded-full object-cover'
              />
            )}
          </div>
          {loading ? (
            <Skeleton className='h-6 w-24' />
          ) : (
            <h1 className='text-xl font-semibold'>{systemName}</h1>
          )}
        </Link>
        <div className='yundu-auth-form-wrap'>
          <div className='mx-auto flex w-full max-w-[480px] flex-col justify-center space-y-2 px-4 py-8 sm:p-8'>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
