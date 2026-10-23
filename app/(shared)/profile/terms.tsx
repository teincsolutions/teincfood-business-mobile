// @ts-nocheck

import LegalPageScreen from "@/components/content/LegalPageScreen";

/**
 * Terms of Service — published per audience (seller / fleet / rider) through
 * the CMS.
 */
export default function TermsOfService() {
  return <LegalPageScreen slug="terms" fallbackTitle="Terms of Service" />;
}
