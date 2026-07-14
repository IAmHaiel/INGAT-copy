use soroban_sdk::{token, Address, Env, symbol_short, log};
use crate::errors::Error;
use crate::storage;

pub fn withdraw_spending(
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

    let mut state = storage::get_bucket(&env, &receiver, bucket_id).ok_or(Error::InvalidBucket)?;

    if state.spending_balance < amount {
        return Err(Error::InsufficientFunds);
    }

    state.spending_balance -= amount;
    storage::set_bucket(&env, &receiver, bucket_id, &state);

    let token_address = storage::get_token(&env);
    let token_client = token::Client::new(&env, &token_address);
    token_client.transfer(&env.current_contract_address(), &receiver, &amount);

    env.events().publish(
        (symbol_short!("withdraw"), receiver, symbol_short!("spend")),
        (amount, bucket_id),
    );

    log!(&env, "Withdraw spending: {} from receiver from bucket {}", amount, bucket_id);

    Ok(())
}

pub fn withdraw_goal(
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

    let mut state = storage::get_bucket(&env, &receiver, bucket_id).ok_or(Error::InvalidBucket)?;

    let current_time = env.ledger().timestamp();
    if current_time < state.unlock_date {
        return Err(Error::GoalBucketLocked);
    }

    if state.goal_balance < amount {
        return Err(Error::InsufficientFunds);
    }

    state.goal_balance -= amount;
    storage::set_bucket(&env, &receiver, bucket_id, &state);

    let token_address = storage::get_token(&env);
    let token_client = token::Client::new(&env, &token_address);
    token_client.transfer(&env.current_contract_address(), &receiver, &amount);

    env.events().publish(
        (symbol_short!("withdraw"), receiver, symbol_short!("goal")),
        (amount, bucket_id),
    );

    log!(&env, "Withdraw goal: {} from receiver from bucket {}", amount, bucket_id);

    Ok(())
}

pub fn withdraw_goal_sender(
    env: Env,
    sender: Address,
    receiver: Address,
    bucket_id: u32,
    amount: i128,
) -> Result<(), Error> {
    if !storage::is_initialized(&env) {
        return Err(Error::NotInitialized);
    }

    sender.require_auth();

    if amount <= 0 {
        return Err(Error::InvalidAmount);
    }

    let mut state = storage::get_bucket(&env, &receiver, bucket_id).ok_or(Error::InvalidBucket)?;

    if state.sender != sender {
        return Err(Error::NotBucketSender);
    }

    let current_time = env.ledger().timestamp();
    if current_time < state.unlock_date {
        return Err(Error::GoalBucketLocked);
    }

    if state.goal_balance < amount {
        return Err(Error::InsufficientFunds);
    }

    state.goal_balance -= amount;
    storage::set_bucket(&env, &receiver, bucket_id, &state);

    let token_address = storage::get_token(&env);
    let token_client = token::Client::new(&env, &token_address);
    token_client.transfer(&env.current_contract_address(), &sender, &amount);

    env.events().publish(
        (symbol_short!("withdraw"), sender, symbol_short!("goal")),
        (amount, bucket_id),
    );

    log!(&env, "Withdraw goal by sender: {} from bucket {}", amount, bucket_id);

    Ok(())
}
