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
import { ArrowRight, ArrowUpRight, Check, Code2, Sparkles } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

const MODEL_ROUTES = [
  { name: 'OpenAI', model: 'GPT', angle: '0deg' },
  { name: 'Claude', model: 'CLAUDE', angle: '-90deg' },
  { name: 'Gemini', model: 'GEMINI', angle: '180deg' },
  { name: 'DeepSeek', model: 'DEEPSEEK', angle: '90deg' },
] as const

interface HeroProps {
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const [activeRoute, setActiveRoute] = useState(0)
  const selected = MODEL_ROUTES[activeRoute]

  return (
    <section className='yundu-hero' aria-labelledby='yundu-hero-title'>
      <div className='yundu-hero-noise' aria-hidden='true' />
      <div className='yundu-hero-grid' aria-hidden='true' />
      <div className='yundu-hero-atmosphere' aria-hidden='true'>
        <span className='yundu-hero-horizon' />
        <span className='yundu-hero-light yundu-hero-light-a' />
        <span className='yundu-hero-light yundu-hero-light-b' />
        <span className='yundu-hero-light yundu-hero-light-c' />
      </div>
      <div className='yundu-hero-inner'>
        <div className='yundu-hero-copy'>
          <div className='yundu-kicker'>
            <span className='yundu-kicker-pulse' />
            YUNDU / {t('Intelligent access, one gateway')}
          </div>
          <h1 id='yundu-hero-title'>
            {t('Connect every idea')}
            <br />
            <span>{t('to the right intelligence.')}</span>
          </h1>
          <p className='yundu-hero-description'>
            {t(
              'One clean API for the models you build with. Route requests, see usage, and keep control as you grow.'
            )}
          </p>
          <div className='yundu-hero-actions'>
            <Button
              className='yundu-primary-action group h-12 rounded-xl px-6 text-sm font-semibold'
              render={
                <Link to={props.isAuthenticated ? '/dashboard' : '/sign-up'} />
              }
            >
              {props.isAuthenticated ? t('Go to Dashboard') : t('Get Started')}
              <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
            </Button>
            <Button
              variant='outline'
              className='yundu-secondary-action group h-12 rounded-xl px-6 text-sm'
              render={<Link to='/pricing' />}
            >
              {t('Explore models and pricing')}
              <ArrowUpRight className='size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
            </Button>
          </div>
          <div className='yundu-hero-footnote'>
            <span>
              <Check className='size-3.5' />
              {t('One API endpoint')}
            </span>
            <span>
              <Check className='size-3.5' />
              {t('Transparent usage')}
            </span>
            <span>
              <Check className='size-3.5' />
              {t('Flexible model routing')}
            </span>
          </div>
        </div>

        <div
          className='yundu-hero-visual'
          aria-label={t('Interactive model route preview')}
        >
          <div className='yundu-orbit-particles' aria-hidden='true'>
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
          <div className='yundu-orbit-glow' aria-hidden='true' />
          <div className='yundu-orbit yundu-orbit-outer' aria-hidden='true' />
          <div className='yundu-orbit yundu-orbit-inner' aria-hidden='true' />
          <div
            className='yundu-orbit-beam'
            style={{ '--route-angle': selected.angle } as CSSProperties}
            aria-hidden='true'
          />
          <div className='yundu-orbit-core'>
            <Sparkles className='size-7' strokeWidth={1.5} aria-hidden='true' />
            <strong>云渡</strong>
            <small>YUNDU GATEWAY</small>
          </div>
          {MODEL_ROUTES.map((route, index) => (
            <Button
              key={route.name}
              variant='outline'
              type='button'
              className={`yundu-orbit-node yundu-orbit-node-${index} ${activeRoute === index ? 'is-active' : ''}`}
              onClick={() => setActiveRoute(index)}
              aria-pressed={activeRoute === index}
              aria-label={t('Preview {{model}} route', { model: route.name })}
            >
              <span className='yundu-node-led' />
              {route.name}
            </Button>
          ))}
          <div className='yundu-route-preview' aria-live='polite'>
            <div className='yundu-route-preview-top'>
              <span>
                <Code2 className='size-4' /> {t('Route preview')}
              </span>
              <span className='yundu-preview-live'>{t('Ready')}</span>
            </div>
            <div className='yundu-route-preview-code'>
              <span>POST</span> /v1/chat/completions
            </div>
            <div className='yundu-route-preview-bottom'>
              <span>{t('Selected model family')}</span>
              <strong>{selected.model}</strong>
            </div>
          </div>
        </div>
      </div>
      <div className='yundu-hero-bottomline' aria-hidden='true'>
        <span />
      </div>
    </section>
  )
}
