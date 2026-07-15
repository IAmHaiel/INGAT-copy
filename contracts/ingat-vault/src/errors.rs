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
    InvalidBucket = 8,
    NotBucketSender = 9,
    CooldownAlreadyActive = 10,
    NoActiveCooldown = 11,
    CooldownNotElapsed = 12,
    ReRequestTooSoon = 13,
    NotBucketReceiver = 14,
}
