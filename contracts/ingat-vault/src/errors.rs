use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidSplitRatio = 3,
    UnlockDateInPast = 4,
    InsufficientFunds = 5,
    GoalBucketLocked = 6,
    InvalidAmount = 7,
}
