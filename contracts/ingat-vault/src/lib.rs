#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

pub mod errors;
pub mod storage;
pub mod deposit;
pub mod withdraw;
pub mod emergency;
pub mod release;

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
        approval_required: bool,
    ) -> Result<(), Error> {
        deposit::deposit(env, sender, receiver, amount, split_ratio, unlock_date, approval_required)
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

    pub fn withdraw_goal_sender(
        env: Env,
        sender: Address,
        receiver: Address,
        bucket_id: u32,
        amount: i128,
    ) -> Result<(), Error> {
        withdraw::withdraw_goal_sender(env, sender, receiver, bucket_id, amount)
    }

    pub fn request_emergency_withdrawal(
        env: Env,
        receiver: Address,
        bucket_id: u32,
        amount: i128,
    ) -> Result<(), Error> {
        emergency::request_emergency_withdrawal(env, receiver, bucket_id, amount)
    }

    pub fn cancel_emergency_withdrawal(
        env: Env,
        sender: Address,
        receiver: Address,
        bucket_id: u32,
    ) -> Result<(), Error> {
        emergency::cancel_emergency_withdrawal(env, sender, receiver, bucket_id)
    }

    pub fn cancel_emergency_receiver(
        env: Env,
        receiver: Address,
        bucket_id: u32,
    ) -> Result<(), Error> {
        emergency::cancel_emergency_receiver(env, receiver, bucket_id)
    }

    pub fn execute_emergency_withdrawal(
        env: Env,
        receiver: Address,
        bucket_id: u32,
    ) -> Result<(), Error> {
        emergency::execute_emergency_withdrawal(env, receiver, bucket_id)
    }

    pub fn get_emergency_request(
        env: Env,
        receiver: Address,
        bucket_id: u32,
    ) -> Option<storage::EmergencyRequest> {
        storage::get_emergency_request(&env, &receiver, bucket_id)
    }

    pub fn request_release(
        env: Env,
        receiver: Address,
        bucket_id: u32,
    ) -> Result<(), Error> {
        release::request_release(env, receiver, bucket_id)
    }

    pub fn approve_release(
        env: Env,
        sender: Address,
        receiver: Address,
        bucket_id: u32,
    ) -> Result<(), Error> {
        release::approve_release(env, sender, receiver, bucket_id)
    }

    pub fn get_release_request(
        env: Env,
        receiver: Address,
        bucket_id: u32,
    ) -> Option<storage::ReleaseRequest> {
        release::get_release_request(env, receiver, bucket_id)
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