'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Paywall } from '@/components/ui/paywall'
import { getStripe } from '@/lib/stripe'
import { getPlanDisplayName, getPlanPrice } from '@/lib/subscriptions'
import { Check, Crown, CreditCard, Calendar, Zap } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function BillingPage() {
  const { user, subscription, features, refreshSubscription } = useAuth()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const searchParams = useSearchParams()
  
  const isSuccess = searchParams.get('success') === 'true'
  const isCanceled = searchParams.get('canceled') === 'true'

  // Refresh subscription data when returning from successful checkout
  useEffect(() => {
    if (isSuccess) {
      console.log('Checkout success detected, refreshing subscription data...')
      refreshSubscription()
    }
  }, [isSuccess, refreshSubscription])

  const handleUpgrade = async (priceType: 'monthly' | 'yearly') => {
    setLoading(true)
    try {
      console.log('Creating checkout session for price type:', priceType)
      
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          priceId: priceType === 'monthly' ? 'MONTHLY' : 'YEARLY' 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Checkout API error:', errorData)
        throw new Error(`Checkout failed: ${errorData.error || 'Unknown error'}`)
      }

      const { sessionId } = await response.json()
      console.log('Received sessionId:', sessionId)
      
      if (!sessionId) {
        throw new Error('No session ID received from server')
      }

      const stripe = await getStripe()
      
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      console.log('Redirecting to checkout with sessionId:', sessionId)
      
      // Set a flag to indicate checkout is starting
      sessionStorage.setItem('checkout_completed', 'true')
      
      const { error } = await stripe.redirectToCheckout({ sessionId })
      
      if (error) {
        console.error('Stripe redirect error:', error)
        throw error
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      })

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error creating portal session:', error)
    } finally {
      setPortalLoading(false)
    }
  }

  const isPro = subscription?.status === 'active' && subscription?.plan === 'pro'

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription and billing information</p>
      </div>

      {/* Success/Cancel Messages */}
      {isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Welcome to Pro! Your subscription is now active.
              </h3>
              <button 
                onClick={() => refreshSubscription()}
                className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
              >
                Refresh subscription status
              </button>
            </div>
          </div>
        </div>
      )}

      {isCanceled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Payment was canceled. Your subscription remains unchanged.
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-2">👑</span> Current Plan
            </h2>
            <div className="mt-4">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900">
                  {isPro ? 'Pro' : 'Free'}
                </span>
                {isPro && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                {isPro ? 'Full access to all features' : 'Limited access to features'}
              </p>
              {isPro && subscription && (
                <p className="text-sm text-gray-500 mt-2">
                  {subscription.current_period_end && (
                    <>Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}</>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {isPro ? (
                subscription?.price_id?.includes('year') ? '$120' : '$14.99'
              ) : (
                'Free'
              )}
            </div>
            {isPro && (
              <div className="text-sm text-gray-500">
                {subscription?.price_id?.includes('year') ? '/year' : '/month'}
              </div>
            )}
          </div>
        </div>
        
        {isPro && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </button>
          </div>
        )}
      </div>

      {/* Upgrade Plans (only show if not Pro) */}
      {!isPro && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Upgrade Plans</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pro Monthly */}
                <div className="border border-gray-200 rounded-lg p-6 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Pro Monthly</h3>
                      <p className="text-gray-600">Perfect for getting started</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      Popular
                    </span>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-gray-900">$14.99<span className="text-lg font-normal text-gray-600">/month</span></div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center text-sm text-gray-700">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Unlimited prompt access
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      JSON export for Veo 3
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Save favorites
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Remix prompts
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Create custom prompts
                    </li>
                  </ul>
                  
                  <button
                    onClick={() => handleUpgrade('monthly')}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Processing...' : 'Upgrade to Pro Monthly'}
                  </button>
                </div>

                {/* Pro Yearly */}
                <div className="border border-gray-200 rounded-lg p-6 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Pro Yearly</h3>
                      <p className="text-gray-600">Best value for long-term users</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      Save 33%
                    </span>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-gray-900">$120<span className="text-lg font-normal text-gray-600">/year</span></div>
                    <div className="text-sm text-gray-500">$179.88 billed annually</div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center text-sm text-gray-700">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      All monthly features
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Priority support
                    </li>
                    <li className="flex items-center text-sm text-gray-700">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Early access to new features
                    </li>
                  </ul>
                  
                  <button
                    onClick={() => handleUpgrade('yearly')}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Processing...' : 'Upgrade to Pro Yearly'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transaction History */}
      {isPro && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Transaction History</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscription && (
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.created_at ? new Date(subscription.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Pro {subscription.price_id?.includes('year') ? 'Yearly' : 'Monthly'} Subscription
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.price_id?.includes('year') ? '$120.00' : '$14.99'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Paid
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {!subscription && (
                <div className="text-center py-4 text-gray-500">
                  No transactions found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 