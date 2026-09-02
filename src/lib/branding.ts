import { useSyncExternalStore } from 'react';

export const APP_NAME = import.meta.env.VITE_APP_NAME?.trim() || 'Business Manager';

/**
 * Branding / company information shared across printed documents
 * (invoice receipts, quotations, product labels, etc.).
 *
 * Centralize any future edits here so every document stays consistent.
 * The quotation pages currently carry their own copies of COMPANY_INFO
 * and can be migrated to this module later.
 *
 * // TODO: migrate to Supabase (e.g. a company_settings table) once persistence
 * // is wired up app-wide — currently in-memory only, resets on refresh.
 * // Edits saved from Settings update the in-memory store below (and therefore
 * // any component using useCompanyInfo(), e.g. InvoiceReceipt) without a page
 * // reload — but a refresh restores the DEFAULT values defined here.
 */

export const COMPANY_INFO = {
  name: APP_NAME,
  tagline: 'Business Management System',
  address: '',
  phone: '',
  email: '',
};

/**
 * Permanent Account Number (PAN) shown in the invoice receipt letterhead.
 * TODO: replace with actual PAN number
 */
export const PAN_NUMBER = 'XXXXXX';

/**
 * Standard warranty statement shown on invoice receipts.
 * TODO: review wording before going live
 */
export const WARRANTY_TEXT =
  "All products carry the manufacturer's standard warranty unless otherwise stated. Please retain this invoice as proof of purchase for any warranty claims.";

// ---------------------------------------------------------------------------
// Live, in-memory company info store.
//
// branding.ts is the single source of truth for company identity. The constants
// above are the DEFAULT/seed values. The Settings page reads from and writes to
// this store via the helpers below, and any component that calls useCompanyInfo()
// re-renders when the store changes (e.g. when Settings saves) — no reload needed.
//
// TODO: migrate to Supabase (e.g. a company_settings table) once persistence is
// wired up app-wide — currently in-memory only, resets on refresh.
// ---------------------------------------------------------------------------

export interface CompanyInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  panNumber: string;
}

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  ...COMPANY_INFO,
  panNumber: PAN_NUMBER,
};

let companyInfo: CompanyInfo = { ...DEFAULT_COMPANY_INFO };

type CompanyInfoListener = () => void;
const listeners = new Set<CompanyInfoListener>();

/** Returns the current in-memory company info snapshot. */
export const getCompanyInfo = (): CompanyInfo => companyInfo;

/** Merge a partial update into the in-memory company info and notify subscribers. */
export const setCompanyInfo = (update: Partial<CompanyInfo>): void => {
  companyInfo = { ...companyInfo, ...update };
  listeners.forEach(listener => listener());
};

/** Subscribe to company info changes. Returns an unsubscribe function. */
export const subscribeCompanyInfo = (listener: CompanyInfoListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** React hook — re-renders the caller whenever company info changes. */
export const useCompanyInfo = (): CompanyInfo =>
  useSyncExternalStore(subscribeCompanyInfo, getCompanyInfo);
