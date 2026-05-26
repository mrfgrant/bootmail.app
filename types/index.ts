// ─── DATABASE TYPES ──────────────────────────────────────

export type Branch = 'army' | 'marines' | 'navy' | 'airforce' | 'coastguard' | 'spaceforce'
export type Plan = 'free' | 'pro' | 'family'
export type TrainingStatus = 'pre-training' | 'training' | 'ait' | 'active' | 'deployed' | 'separated'
export type LetterStatus = 'draft' | 'paid' | 'processing' | 'printed' | 'mailed' | 'delivered'
export type PackageType = 'essentials' | 'boost' | 'comfort' | 'full_send' | 'custom'
export type BookTier = 'basic' | 'legacy' | 'family' | 'fullstory' | 'deluxe'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  plan: Plan
  stripe_customer_id: string | null
  letter_credits: number
  gift_card_balance: number
  created_at: string
  updated_at: string
}

export interface Recruit {
  id: string
  owner_id: string
  full_name: string
  branch: Branch
  ship_date: string | null
  grad_date: string | null
  training_base: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip: string | null
  company: string | null
  platoon: string | null
  regiment: string | null
  status: TrainingStatus
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface Letter {
  id: string
  sender_id: string
  recruit_id: string
  body: string
  photo_urls: string[]
  include_newsletter: boolean
  gift_card_amount: number | null
  status: LetterStatus
  lob_letter_id: string | null
  tracking_number: string | null
  price_paid: number | null
  submitted_at: string | null
  mailed_at: string | null
  delivered_at: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  cost: number | null
  image_url: string | null
  weight_oz: number | null
  allowed_branches: Branch[]
  allowed_phases: string[]
  drill_sergeant_approved: boolean
  in_stock: boolean
  is_active: boolean
}

export interface Package {
  id: string
  sender_id: string
  recruit_id: string
  package_type: PackageType
  items: PackageItem[]
  personal_note: string | null
  status: string
  tracking_number: string | null
  subtotal: number
  shipping_cost: number
  total: number
  created_at: string
}

export interface PackageItem {
  id: string
  name: string
  qty: number
  price: number
}

export interface GiftCard {
  id: string
  code: string
  type: 'bootmail' | 'letters'
  initial_amount: number
  remaining_amount: number
  purchased_by: string | null
  redeemed_by: string | null
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export interface LegacyBook {
  id: string
  recruit_id: string
  owner_id: string
  tier: BookTier
  cover_style: string
  cover_photo_url: string | null
  dedication: string | null
  layout_style: string
  signing_slug: string | null
  signing_open: boolean
  signing_closes_at: string | null
  bonus_photo_urls: string[]
  status: string
  price_paid: number | null
  created_at: string
}

export interface BookSignature {
  id: string
  book_id: string
  signer_name: string
  signer_city: string | null
  signer_state: string | null
  message: string
  font_choice: string
  doodle_svg: string | null
  is_anonymous: boolean
  approved: boolean
  created_at: string
}

export interface Order {
  id: string
  profile_id: string
  order_type: string
  line_items: OrderLineItem[]
  stripe_payment_intent: string | null
  amount_total: number
  status: string
  paid_at: string | null
  created_at: string
}

export interface OrderLineItem {
  name: string
  quantity: number
  unit_price: number
  total: number
}

// ─── APP TYPES ────────────────────────────────────────────

export interface BranchInfo {
  id: Branch
  name: string
  color: string
  trainingBase: string
  trainingWeeks: number
  emoji: string
}

export const BRANCHES: BranchInfo[] = [
  { id: 'army',      name: 'Army',       color: '#4b5320', trainingBase: 'Fort Moore / Fort Jackson',    trainingWeeks: 10, emoji: '🪖' },
  { id: 'marines',   name: 'Marines',    color: '#cc0000', trainingBase: 'Parris Island / San Diego',    trainingWeeks: 13, emoji: '🦅' },
  { id: 'navy',      name: 'Navy',       color: '#000080', trainingBase: 'Great Lakes, IL',              trainingWeeks: 8,  emoji: '⚓' },
  { id: 'airforce',  name: 'Air Force',  color: '#00308f', trainingBase: 'JBSA Lackland, TX',            trainingWeeks: 8,  emoji: '✈️' },
  { id: 'coastguard',name: 'Coast Guard',color: '#003087', trainingBase: 'Cape May, NJ',                 trainingWeeks: 8,  emoji: '🚢' },
  { id: 'spaceforce', name: 'Space Force',color: '#1c1c2e', trainingBase: 'JBSA Lackland, TX',           trainingWeeks: 8,  emoji: '🚀' },
]

export const LETTER_PRICES = {
  single: 2.99,
  bundle3: 7.99,   // $2.66 each
  bundle10: 19.99, // $1.99 each
}

export const PLAN_PRICES = {
  pro: 19.99,
  family: 29.99,
}

export const BOOK_PRICES: Record<BookTier, number> = {
  basic:     29.99,
  legacy:    44.99,
  family:    54.99,
  fullstory: 64.99,
  deluxe:    89.99,
}
