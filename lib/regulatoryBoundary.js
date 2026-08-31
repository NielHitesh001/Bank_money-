/**
 * Regulatory Boundary & Non-Custodial Compliance Contract
 * Formally enforces that the World Money platform operates strictly as a
 * Third-Party Financial Intelligence and Data Vendor under FinCEN FIN-2019-G001.
 * The platform executes zero customer fund custody, zero payment transmission,
 * and zero balance-holding operations.
 */

export const REGULATORY_MODEL = {
  CLASSIFICATION: 'NON_CUSTODIAL_DATA_AND_SOFTWARE_VENDOR',
  FINCEN_STATUS: 'EXEMPT_FROM_MSB_REGISTRATION',
  CUSTODY_SUPPORT: false,
  FUNDS_TRANSMISSION: false,
  DATA_RESIDENCY_COMPLIANCE: ['GDPR_EU', 'RBI_DATA_LOCALIZATION_INDIA', 'SOC2_TYPE1'],
};

export function assertNonCustodialOperation(payload) {
  if (payload.custodyTransfer === true || payload.directFundsDebit === true) {
    throw new Error('Regulatory Violation: Custodial fund movement is strictly forbidden on this platform.');
  }
  return true;
}
