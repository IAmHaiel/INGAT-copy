use soroban_sdk::{token, Address, Env, symbol_short, log};
use crate::errors::Error;
use crate::storage;

pub fn withdraw_spending(
    env: Env,
    receiver: Address,
    amount: i128,
) -> Result<(), Error> {
    if !storage::is_initialized(&env) {
        return Err(Error::NotInitialized);
    }

    receiver.require_auth();

    if amount <= 0 {
        return Err(Error::InvalidAmount);
    }

    let mut state = storage::get_bucket(&env, &receiver).ok_or(Error::InsufficientFunds)?;

    if state.spending_balance < amount {
        return Err(Error::InsufficientFunds);
    }

    state.spending_balance -= amount;
    storage::set_bucket(&env, &receiver, &state);

    let token_address = storage::get_token(&env);
    let token_client = token::Client::new(&env, &token_address);
    token_client.transfer(&env.current_contract_address(), &receiver, &amount);

    env.events().publish(
        (symbol_short!("withdraw"), receiver, symbol_short!("spend")),
        amount,
    );

    log!(&env, "Withdraw spending: {} from receiver", amount);

    Ok(())
}

pub fn withdraw_goal(
    env: Env,
    receiver: Address,
    amount: i128,
) -> Result<(), Error> {
    if !storage::is_initialized(&env) {
        return Err(Error::NotInitialized);
    }

    receiver.require_auth();

    if amount <= 0 {
        return Err(Error::InvalidAmount);
    }

    let mut state = storage::get_bucket(&env, &receiver).ok_or(Error::InsufficientFunds)?;

    let current_time = env.ledger().timestamp();
    if current_time < state.unlock_date {
        return Err(Error::GoalBucketLocked);
    }

    if state.goal_balance < amount {
        return Err(Error::InsufficientFunds);
    }

    state.goal_balance -= amount;
    storage::set_bucket(&env, &receiver, &state);

    let token_address = storage::get_token(&env);
    let token_client = token::Client::new(&env, &token_address);
    token_client.transfer(&env.current_contract_address(), &receiver, &amount);

    env.events().publish(
        (symbol_short!("withdraw"), receiver, symbol_short!("goal")),
        amount,
    );

    log!(&env, "Withdraw goal: {} from receiver", amount);

    Ok(())
}
