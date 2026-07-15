use soroban_sdk::{token, Address, Env};
use crate::errors::Error;
use crate::storage;

pub fn request_emergency_withdrawal(
    env: Env,
    receiver: Address,
    bucket_id: u32,
    amount: i128,
) -> Result<(), Error> {
    if !storage::is_initialized(&env) {
        return Err(Error::NotInitialized);
    }

    receiver.require_auth();

    if amount <= 0 {
        return Err(Error::InvalidAmount);
    }

    let bucket = storage::get_bucket(&env, &receiver, bucket_id).ok_or(Error::InvalidBucket)?;

    let current_time = env.ledger().timestamp();
    if current_time >= bucket.unlock_date {
        return Err(Error::InvalidBucket);
    }

    if bucket.goal_balance < amount {
        return Err(Error::InsufficientFunds);
    }

    let mut last_cancel_at = 0;
    if let Some(req) = storage::get_emergency_request(&env, &receiver, bucket_id) {
        if req.status == storage::EmergencyStatus::Pending {
            return Err(Error::CooldownAlreadyActive);
        }
        last_cancel_at = req.last_cancel_at;
    }

    if last_cancel_at > 0 && current_time < last_cancel_at + 3600 {
        return Err(Error::ReRequestTooSoon);
    }

    let cooldown_ends_at = current_time + 172800; // 48 hours
    let new_req = storage::EmergencyRequest {
        amount,
        requested_at: current_time,
        cooldown_ends_at,
        status: storage::EmergencyStatus::Pending,
        last_cancel_at,
    };

    storage::set_emergency_request(&env, &receiver, bucket_id, &new_req);

    env.events().publish(
        (soroban_sdk::symbol_short!("emerg_req"), receiver.clone()),
        (amount, bucket_id, cooldown_ends_at),
    );

    Ok(())
}

pub fn cancel_emergency_withdrawal(
    env: Env,
    sender: Address,
    receiver: Address,
    bucket_id: u32,
) -> Result<(), Error> {
    if !storage::is_initialized(&env) {
        return Err(Error::NotInitialized);
    }

    sender.require_auth();

    let bucket = storage::get_bucket(&env, &receiver, bucket_id).ok_or(Error::InvalidBucket)?;
    if bucket.sender != sender {
        return Err(Error::NotBucketSender);
    }

    let mut req = storage::get_emergency_request(&env, &receiver, bucket_id).ok_or(Error::NoActiveCooldown)?;
    if req.status != storage::EmergencyStatus::Pending {
        return Err(Error::NoActiveCooldown);
    }

    let current_time = env.ledger().timestamp();
    req.status = storage::EmergencyStatus::Cancelled;
    req.last_cancel_at = current_time;

    storage::set_emergency_request(&env, &receiver, bucket_id, &req);

    env.events().publish(
        (soroban_sdk::symbol_short!("emerg_can"), sender.clone()),
        (bucket_id, receiver.clone()),
    );

    Ok(())
}

pub fn cancel_emergency_receiver(
    env: Env,
    receiver: Address,
    bucket_id: u32,
) -> Result<(), Error> {
    if !storage::is_initialized(&env) {
        return Err(Error::NotInitialized);
    }

    receiver.require_auth();

    let mut req = storage::get_emergency_request(&env, &receiver, bucket_id).ok_or(Error::NoActiveCooldown)?;
    if req.status != storage::EmergencyStatus::Pending {
        return Err(Error::NoActiveCooldown);
    }

    req.status = storage::EmergencyStatus::Cancelled;
    req.last_cancel_at = 0; // Reset cancel throttle when receiver cancels themselves

    storage::set_emergency_request(&env, &receiver, bucket_id, &req);

    env.events().publish(
        (soroban_sdk::symbol_short!("emerg_rcv"), receiver.clone()),
        (bucket_id,),
    );

    Ok(())
}

pub fn execute_emergency_withdrawal(
    env: Env,
    receiver: Address,
    bucket_id: u32,
) -> Result<(), Error> {
    if !storage::is_initialized(&env) {
        return Err(Error::NotInitialized);
    }

    receiver.require_auth();

    let mut bucket = storage::get_bucket(&env, &receiver, bucket_id).ok_or(Error::InvalidBucket)?;
    let mut req = storage::get_emergency_request(&env, &receiver, bucket_id).ok_or(Error::NoActiveCooldown)?;

    if req.status != storage::EmergencyStatus::Pending {
        return Err(Error::NoActiveCooldown);
    }

    let current_time = env.ledger().timestamp();
    if current_time < req.cooldown_ends_at {
        return Err(Error::CooldownNotElapsed);
    }

    if bucket.goal_balance < req.amount {
        return Err(Error::InsufficientFunds);
    }

    bucket.goal_balance -= req.amount;
    req.status = storage::EmergencyStatus::Executed;

    storage::set_bucket(&env, &receiver, bucket_id, &bucket);
    storage::set_emergency_request(&env, &receiver, bucket_id, &req);

    let token_address = storage::get_token(&env);
    let token_client = token::Client::new(&env, &token_address);
    token_client.transfer(&env.current_contract_address(), &receiver, &req.amount);

    env.events().publish(
        (soroban_sdk::symbol_short!("emerg_exe"), receiver.clone()),
        (req.amount, bucket_id),
    );

    Ok(())
}
