# Security Specification for Driver App

This document outlines the security parameters, rules, and tests for our Firebase integration.

## 1. Data Invariants
- Drivers can only read and write their own documents across all collections (`users`, `trips`, `expenses`, `maintenance`, `gas_loads`).
- `driverId` (or `uid` in `users`) must match the `request.auth.uid`.
- Timestamps (`createdAt`, `updatedAt`) must match `request.time` exactly.
- All IDs must pass `isValidId()` validation (alphanumeric and valid size).
- Number fields like `fare`, `amount`, `price` must be strictly greater than or equal to zero.

## 2. The "Dirty Dozen" Payloads
The following payloads attempt to breach identity, integrity, or system state:
1. **P1 (Identity Spoofing in User Profile)**: Attempt to create user with UID other than current auth.uid.
2. **P2 (Identity Spoofing in Trip)**: Write `driverId: "other-user"` to `trips`.
3. **P3 (PII Blanket Reading)**: Non-owner trying to list trips.
4. **P4 (Negative Fare)**: Trying to write `-10` fare.
5. **P5 (Gigantic Passenger Name)**: A passenger name string with a length > 200 characters.
6. **P6 (Future Timestamp)**: Client-side spoofed `createdAt` in the future.
7. **P7 (Immutability Violation)**: Swapping `driverId` on an existing trip.
8. **P8 (Resource Injection)**: Creating a trip doc ID with junk symbols (ID Poisoning).
9. **P9 (Type Poisoning on Trip)**: Writing numeric array to passenger name.
10. **P10 (Unverified Access)**: Email/Password login user that hasn't verified email accessing list.
11. **P11 (Alter Terminal Status)**: Updating a locked record with extra fields.
12. **P12 (Denial of Wallet)**: Massive recursion with recursive queries on nested collections.

## 3. Test Cases (TDD Rules Validation)
- Verify `users/{userId}` is locked down to owner.
- Verify `trips/{tripId}` requires `driverId == auth.uid` and valid types.
- Verify `expenses/{expenseId}` enforces allowed categories.
- Verify `maintenance/{maintId}` blocks negative odometer states.
- Verify `gas_loads/{gasId}` verifies gasoline costs.
