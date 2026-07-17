# Phase 4: Milestone / Condition Unlock Implementation Plan

## Goal
- Implement the condition unlock feature for the Goal buckets, allowing for more flexible withdrawal options based on sender approval.

## Constraints
- This phase only begins after Phases 0, 1, 2, and 3 have been completed and verified as stable.

## Acceptance Criteria
- **Sender's Actions:**  
  - Sender can create a Goal bucket with `TimeAndApproval` mode enabled during the deposit process.
  - Sender can approve a release request from the receiver to unlock the bucket after a request has been made.

- **Receiver's Actions:**  
  - Receiver can request a release of the bucket only after the standard `unlock_date` has passed.
  - If the sender does not respond within a defined grace period (e.g., 7 days), the receiver can withdraw without the sender's approval.

- **Restrictions:**  
  - The receiver cannot make a request before the base `unlock_date`.
  - The sender cannot avoid consequences for not approving a release indefinitely—the automatic release must be maintained.
  - The receiver cannot create multiple simultaneous `request_release` calls.

## Implementation Steps
1. **Modify Goal Bucket Creation Logic**  
   - Add functionality to create a bucket in `TimeAndApproval` mode during the deposit phase.
   
2. **Implement Request Release Function**  
   - Code the `request_release(bucket_id)` function for the receiver to call after the `unlock_date` has passed.

3. **Implement Approve Release Function**  
   - Code the `approve_release(bucket_id)` function for the sender to approve the release of the bucket.

4. **Implement Grace Period Logic**  
   - Set up a timer that allows the receiver to withdraw automatically if approval is not received within the defined grace period.
   
5. **Error Handling and Validations**  
   - Ensure that the restrictions regarding early requests and multiple concurrent requests are enforced in the smart contract logic.

6. **Testing**  
   - Write unit tests for the new functionalities, including edge cases for error handling and governance.
     - Test scenarios for requesting a release before `unlock_date`.
     - Test approval functionality after receiving a request.
     - Test for automatic release after the grace period.

## Potential Risks
- Introducing new functionality that may introduce regressions in existing phases.
- Unclear user experience regarding how the new approval mechanism is communicated to users.

## Validation Plan
- Conduct thorough testing via unit tests to ensure that all acceptance criteria are met.
- Include automated checks for the scenario where the receiver attempts to request a release before `unlock_date` and should see an appropriate failure response.
- Review the implementation with the team to verify that the user experience aligns with the intended functionality.

## Open Questions
- What specific grace period duration should be defined for the automatic release of funds, and how should it be communicated to the users?