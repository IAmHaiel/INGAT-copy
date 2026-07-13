use soroban_sdk::{token, Address, Env, symbol_short, log};
use crate::errors::Error;
use crate::storage::{self, BucketState};

pub fn deposit(
    env: Env,
    sender: Address,
    receiver: Address,
    amount: i128,
    split_ratio: u32,
    unlock_date: u64,
) -> Result<(), Error> {
    if !storage::is_initialized(&env) {
        return Err(Error::NotInitialized);
    }

    sender.require_auth();

    if amount <= 0 {
        return Err(Error::InvalidAmount);
    }

    if split_ratio > 100 {
        return Err(Error::InvalidSplitRatio);
    }

    let current_time = env.ledger().timestamp();
    if unlock_date <= current_time {
        return Err(Error::UnlockDateInPast);
    }

    // Get the token client and transfer funds from sender to contract
    let token_address = storage::get_token(&env);
    let token_client = token::Client::new(&env, &token_address);
    token_client.transfer(&sender, &env.current_contract_address(), &amount);

    // Calculate splits
    let spending_amount = (amount * split_ratio as i128) / 100;
    let goal_amount = amount - spending_amount;

    // Fetch bucket count and store new bucket state
    let count = storage::get_bucket_count(&env, &receiver);

    let state = BucketState {
        id: count,
        sender: sender.clone(),
        spending_balance: spending_amount,
        goal_balance: goal_amount,
        unlock_date,
    };

    storage::set_bucket(&env, &receiver, count, &state);
    storage::set_bucket_count(&env, &receiver, count + 1);

    // Emit deposit event
    env.events().publish(
        (symbol_short!("deposit"), sender, receiver),
        (amount, split_ratio, unlock_date),
    );

    log!(&env, "Deposit completed successfully. Spending split: {}, Goal split: {}", spending_amount, goal_amount);

    Ok(())
}
