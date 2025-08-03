'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { getStripe } from '@/lib/stripe'
import { getPlanDisplayName, getPlanPrice } from '@/lib/subscriptions'
import { Check, Crown, CreditCard, Calendar, Zap, CheckCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Client component that uses searchParams
function BillingPageContent() {
  const { user, subscription, features, refreshSubscription } = useAuth()
  const [monthlyLoading, setMonthlyLoading] = useState(false)
  const [yearlyLoading, setYearlyLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshAttempts, setRefreshAttempts] = useState(0)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const searchParams = useSearchParams()
  
  const isSuccess = searchParams.get('success') === 'true'
  const isCanceled = searchParams.get('canceled') === 'true'

  // Refresh subscription data when returning from successful checkout
  useEffect(() => {
    if (isSuccess) {
      console.log('Checkout success detected, refreshing subscription data...')
      handleRefreshSubscription()
      setShowSuccessAlert(true)
    }
  }, [isSuccess])

  const handleRefreshSubscription = async () => {
    setRefreshing(true)
    try {
      console.log(`Refreshing subscription (attempt ${refreshAttempts + 1})...`)
      await refreshSubscription()
      
      // If we still don't have an active subscription after refresh, try again up to 3 times
      if (subscription?.status !== 'active' && refreshAttempts < 3) {
        setRefreshAttempts(prev => prev + 1)
        setTimeout(() => handleRefreshSubscription(), 2000) // Try again after 2 seconds
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleUpgrade = async (priceType: 'monthly' | 'yearly') => {
    // Set loading state for the specific plan
    if (priceType === 'monthly') {
      setMonthlyLoading(true)
    } else {
      setYearlyLoading(true)
    }
    
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
      // Reset loading state for both plans
      setMonthlyLoading(false)
      setYearlyLoading(false)
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
      {showSuccessAlert && (
        <Alert 
          variant="success" 
          title={isPro ? "Your subscription is active!" : "Payment successful!"}
          dismissible
          icon={<CheckCircle className="h-5 w-5" />}
        >
          <div className="flex flex-col">
            <p>{isPro ? "You now have access to all pro features." : "Your subscription should activate shortly."}</p>
            {!isPro && (
              <button 
                onClick={handleRefreshSubscription}
                disabled={refreshing}
                className="mt-2 text-sm text-green-600 hover:text-green-800 underline self-start"
              >
                {refreshing ? 'Refreshing...' : 'Refresh subscription status'}
              </button>
            )}
          </div>
        </Alert>
      )}

      {isCanceled && (
        <Alert 
          variant="warning" 
          title="Payment was canceled"
          dismissible
          icon={<svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>}
        >
          Your subscription remains unchanged.
        </Alert>
      )}

      {/* Current Plan */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Crown className="h-5 w-5 mr-2 text-amber-500" /> Current Plan
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
                <p className="text-sm text-gray-500 mt-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
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
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </button>
          </div>
        )}
      </div>

      {/* Upgrade Plans (only show if not Pro) */}
      {!isPro && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Upgrade Plans</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pro Monthly */}
                <div className="relative bg-white border border-blue-200 rounded-xl shadow-sm p-6 transition-all hover:shadow-md hover:border-blue-300 flex flex-col h-full">
                  <div className="absolute top-0 right-0 -mt-3 -mr-3">
                    <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      Popular
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Pro Monthly</h3>
                        <p className="text-gray-600 text-sm">Perfect for getting started</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-gray-900">$14.99<span className="text-lg font-normal text-gray-600">/month</span></div>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center text-sm text-gray-700">
                        <Check className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                        Unlimited prompt access
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <Check className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                        JSON export for Veo 3
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <Check className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                        Save favorites
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <Check className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                        Remix prompts
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <Check className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                        Create custom prompts
                      </li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => handleUpgrade('monthly')}
                    disabled={monthlyLoading || yearlyLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center mt-auto"
                  >
                    {monthlyLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Upgrade to Pro Monthly
                      </>
                    )}
                  </button>
                </div>

                {/* Pro Yearly */}
                <div className="relative bg-white border border-green-200 rounded-xl shadow-sm p-6 transition-all hover:shadow-md hover:border-green-300 flex flex-col h-full">
                  <div className="absolute top-0 right-0 -mt-3 -mr-3">
                    <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      Save 33%
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Pro Yearly</h3>
                        <p className="text-gray-600 text-sm">Best value for long-term users</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-gray-900">$120<span className="text-lg font-normal text-gray-600">/year</span></div>
                      <div className="text-sm text-gray-500">$179.88 billed annually</div>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center text-sm text-gray-700">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        All monthly features
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Priority support
                      </li>
                      <li className="flex items-center text-sm text-gray-700">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        Early access to new features
                      </li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => handleUpgrade('yearly')}
                    disabled={monthlyLoading || yearlyLoading}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center mt-auto"
                  >
                    {yearlyLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Upgrade to Pro Yearly
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transaction History */}
      {isPro && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
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

// Main component with Suspense boundary
export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading billing information...</div>}>
      <BillingPageContent />
    </Suspense>
  )
} 