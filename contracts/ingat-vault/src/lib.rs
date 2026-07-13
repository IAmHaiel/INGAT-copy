#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

pub mod errors;
pub mod storage;
pub mod deposit;
pub mod withdraw;

use errors::Error;
use storage::BucketState;

#[contract]
pub struct IngatVault;

#[contractimpl]
impl IngatVault {
    pub fn initialize(env: Env, token: Address) -> Result<(), Error> {
        if storage::is_initialized(&env) {
            return Err(Error::AlreadyInitialized);
        }
        storage::set_token(&env, &token);
        storage::set_initialized(&env);
        Ok(())
    }

    pub fn deposit(
        env: Env,
        sender: Address,
        receiver: Address,
        amount: i128,
        split_ratio: u32,
        unlock_date: u64,
    ) -> Result<(), Error> {
        deposit::deposit(env, sender, receiver, amount, split_ratio, unlock_date)
    }

    pub fn withdraw_spending(
        env: Env,
        receiver: Address,
        bucket_id: u32,
        amount: i128,
    ) -> Result<(), Error> {
        withdraw::withdraw_spending(env, receiver, bucket_id, amount)
    }

    pub fn withdraw_goal(
        env: Env,
        receiver: Address,
        bucket_id: u32,
        amount: i128,
    ) -> Result<(), Error> {
        withdraw::withdraw_goal(env, receiver, bucket_id, amount)
    }

    pub fn get_buckets(env: Env, receiver: Address) -> Vec<BucketState> {
        let count = storage::get_bucket_count(&env, &receiver);
        let mut buckets = Vec::new(&env);
        for i in 0..count {
            if let Some(state) = storage::get_bucket(&env, &receiver, i) {
                buckets.push_back(state);
            }
        }
        buckets
    }

    pub fn get_token(env: Env) -> Address {
        storage::get_token(&env)
    }
}
