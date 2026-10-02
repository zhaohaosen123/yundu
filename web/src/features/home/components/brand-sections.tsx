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
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Blocks,
  ChartNoAxesCombined,
  Fingerprint,
  Route,
  ShieldCheck,
  Waypoints,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/ui/button'

export function ModelRibbon() {
  const { t } = useTranslation()
  return (
    <div className='yundu-model-ribbon'>
      <div className='yundu-model-ribbon-inner'>
        <span className='yundu-ribbon-label'>
          {t('Built for the models you use')}
        </span>
        <div
          className='yundu-ribbon-models'
          aria-label={t('Supported model providers')}
        >
          {['OpenAI', 'Anthropic', 'Google Gemini', 'DeepSeek', 'Qwen'].map(
            (name) => (
              <span key={name}>{name}</span>
            )
          )}
          <span>{t('More')} +</span>
        </div>
      </div>
    </div>
  )
}

const CAPABILITIES = [
  {
    icon: Route,
    number: '01',
    title: 'One connection. Many models.',
    description:
      'Keep one integration while choosing the model that fits each task.',
    className: 'yundu-capability-wide',
  },
  {
    icon: ChartNoAxesCombined,
    number: '02',
    title: 'Every request, visible.',
    description: 'Follow usage and costs with clear records, from day one.',
    className: '',
  },
  {
    icon: Fingerprint,
    number: '03',
    title: 'Access on your terms.',
    description: 'Manage keys and permissions without losing control.',
    className: '',
  },
  {
    icon: Activity,
    number: '04',
    title: 'Built to keep moving.',
    description:
      'Route across available channels and keep your application connected.',
    className: 'yundu-capability-wide',
  },
] as const

export function Capabilities() {
  const { t } = useTranslation()
  return (
    <section className='yundu-section yundu-capabilities' id='capabilities'>
      <div className='yundu-section-heading'>
        <AnimateInView>
          <span className='yundu-section-eyebrow'>
            01 / {t('THE PLATFORM')}
          </span>
          <h2>{t('A clearer way to build with AI.')}</h2>
        </AnimateInView>
        <AnimateInView delay={100}>
          <p>
            {t(
              'The infrastructure stays in the background. Your ideas stay in front.'
            )}
          </p>
        </AnimateInView>
      </div>
      <div className='yundu-capability-grid'>
        {CAPABILITIES.map((item, index) => {
          const Icon = item.icon
          return (
            <AnimateInView
              key={item.number}
              delay={index * 70}
              className={`yundu-capability ${item.className}`}
            >
              <span className='yundu-capability-number'>{item.number}</span>
              <span className='yundu-capability-icon'>
                <Icon size={24} strokeWidth={1.5} aria-hidden='true' />
              </span>
              <h3>{t(item.title)}</h3>
              <p>{t(item.description)}</p>
              <span className='yundu-capability-arrow' aria-hidden='true'>
                <ArrowUpRight size={19} />
              </span>
            </AnimateInView>
          )
        })}
      </div>
    </section>
  )
}

const STEPS = [
  {
    icon: Blocks,
    number: '01',
    title: 'Create your account',
    description: 'Start with a workspace for your applications.',
  },
  {
    icon: ShieldCheck,
    number: '02',
    title: 'Create an API key',
    description: 'Give each integration its own secure access.',
  },
  {
    icon: Waypoints,
    number: '03',
    title: 'Send your first request',
    description: 'Use a familiar API format and choose your model.',
  },
] as const

export function Journey() {
  const { t } = useTranslation()
  return (
    <section className='yundu-section yundu-journey' id='how-it-works'>
      <div className='yundu-section-heading'>
        <AnimateInView>
          <span className='yundu-section-eyebrow'>
            02 / {t('GET CONNECTED')}
          </span>
          <h2>{t('From idea to first request.')}</h2>
        </AnimateInView>
        <AnimateInView delay={100}>
          <p>{t('A short path from sign up to building.')}</p>
        </AnimateInView>
      </div>
      <div className='yundu-journey-grid'>
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <AnimateInView
              key={step.number}
              delay={index * 100}
              className='yundu-journey-step'
            >
              <div className='yundu-journey-top'>
                <span>{step.number}</span>
                <Icon size={22} strokeWidth={1.5} aria-hidden='true' />
              </div>
              <h3>{t(step.title)}</h3>
              <p>{t(step.description)}</p>
              {index < STEPS.length - 1 && (
                <ArrowRight
                  className='yundu-journey-connector'
                  size={18}
                  aria-hidden='true'
                />
              )}
            </AnimateInView>
          )
        })}
      </div>
    </section>
  )
}

export function FinalCta(props: { isAuthenticated: boolean }) {
  const { t } = useTranslation()
  return (
    <section className='yundu-final-cta'>
      <div className='yundu-final-cta-glow' aria-hidden='true' />
      <div className='yundu-final-cta-inner'>
        <span className='yundu-section-eyebrow'>
          03 / {t('YOUR NEXT MOVE')}
        </span>
        <h2>{t('Make room for what comes next.')}</h2>
        <p>
          {t(
            'Explore the models, connect your app, and build at your own pace.'
          )}
        </p>
        <Button
          className='yundu-primary-action group h-12 rounded-xl px-7'
          render={
            <Link to={props.isAuthenticated ? '/dashboard' : '/sign-up'} />
          }
        >
          {props.isAuthenticated ? t('Go to Dashboard') : t('Get Started')}
          <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
        </Button>
      </div>
    </section>
  )
}
