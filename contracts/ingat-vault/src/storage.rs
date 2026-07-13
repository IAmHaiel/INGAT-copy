use soroban_sdk::{contracttype, Address, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BucketState {
    pub id: u32,
    pub sender: Address,
    pub spending_balance: i128,
    pub goal_balance: i128,
    pub unlock_date: u64,
}

#[contracttype]
pub enum DataKey {
    Initialized,
    Token,
    BucketCount(Address),
    Bucket(Address, u32),
}

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Initialized)
}

pub fn set_initialized(env: &Env) {
    env.storage().instance().set(&DataKey::Initialized, &true);
}

pub fn get_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn set_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::Token, token);
}

pub fn get_bucket_count(env: &Env, receiver: &Address) -> u32 {
    let key = DataKey::BucketCount(receiver.clone());
    env.storage().persistent().get(&key).unwrap_or(0)
}

pub fn set_bucket_count(env: &Env, receiver: &Address, count: u32) {
    let key = DataKey::BucketCount(receiver.clone());
    env.storage().persistent().set(&key, &count);
}

pub fn get_bucket(env: &Env, receiver: &Address, bucket_id: u32) -> Option<BucketState> {
    let key = DataKey::Bucket(receiver.clone(), bucket_id);
    let state: Option<BucketState> = env.storage().persistent().get(&key);
    if state.is_some() {
        // Extend persistent storage TTL to avoid expiration (e.g. 10,000 ledgers)
        env.storage().persistent().extend_ttl(&key, 10000, 10000);
    }
    state
}

pub fn set_bucket(env: &Env, receiver: &Address, bucket_id: u32, state: &BucketState) {
    let key = DataKey::Bucket(receiver.clone(), bucket_id);
    env.storage().persistent().set(&key, state);
    env.storage().persistent().extend_ttl(&key, 10000, 10000);
}
