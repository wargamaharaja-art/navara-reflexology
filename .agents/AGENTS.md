# Agent Rules

## Therapist Commission Recalculation Logic
When recalculating therapist commissions, it is CRITICAL to handle POS Add-ons correctly to avoid under-paying or double-paying therapists.

- **POS Add-ons vs Separate Visits:** The Navara POS system allows adding extra services (e.g. " Bekam Kepala\) to a cart without creating a separate patientVisits record for them. Thus, an invoice (invoices.items) may contain MORE services than the actual patientVisits record.
- **Never Override Blindly:** Never blindly overwrite a commission using only patientVisits.serviceId. You MUST parse invoices.items to find any services that DO NOT map to an existing patientVisit for that patient on that day.
- **Preventing Double Counts:** Conversely, if an invoice contains an item (like \Kartu Member\ or \Bekam Gratis\) that DOES have its own patientVisit record, you MUST NOT sum it into the primary visit's commission. Summing it would double-count the commission because the separate patientVisit record will also calculate its own commission.
- **Source of Truth:** Use src/app/api/recalculate-commissions/route.ts as the ultimate reference for the correct mapping logic.

