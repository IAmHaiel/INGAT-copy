#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env,
};
use ingat_vault::{IngatVault, IngatVaultClient};

#[test]
fn test_vault_deposit_and_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    // Register IngatVault contract
    let contract_id = env.register_contract(None, IngatVault);
    let client = IngatVaultClient::new(&env, &contract_id);

    // Register a mock token (Stellar Asset Contract)
    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract(token_admin.clone());
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    // Initialize IngatVault with the token address
    client.initialize(&token_address);

    // Create test accounts
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    // Mint tokens to sender
    token_admin_client.mint(&sender, &1000);
    assert_eq!(token_client.balance(&sender), 1000);

    // Deposit 100 tokens with 60% spending split, unlocking in 1000 seconds
    let amount = 100;
    let split_ratio = 60; // 60% spending, 40% goal
    let current_time = 10000;
    env.ledger().set_timestamp(current_time);
    let unlock_date = current_time + 1000;

    client.deposit(&sender, &receiver, &amount, &split_ratio, &unlock_date);

    // Check balances on token and in vault
    assert_eq!(token_client.balance(&sender), 900);
    assert_eq!(token_client.balance(&contract_id), 100);

    let bucket = client.get_bucket(&receiver).unwrap();
    assert_eq!(bucket.spending_balance, 60);
    assert_eq!(bucket.goal_balance, 40);
    assert_eq!(bucket.unlock_date, unlock_date);

    // Withdraw 20 from spending bucket (should succeed)
    client.withdraw_spending(&receiver, &20);
    assert_eq!(token_client.balance(&receiver), 20);
    
    let bucket = client.get_bucket(&receiver).unwrap();
    assert_eq!(bucket.spending_balance, 40);

    // Attempt to withdraw 10 from goal bucket before unlock date (should fail)
    let res = client.try_withdraw_goal(&receiver, &10);
    assert!(res.is_err());

    // Advance ledger time past unlock date
    env.ledger().set_timestamp(unlock_date + 1);

    // Withdraw 15 from goal bucket (should succeed now)
    client.withdraw_goal(&receiver, &15);
    assert_eq!(token_client.balance(&receiver), 35); // 20 spending + 15 goal

    let bucket = client.get_bucket(&receiver).unwrap();
    assert_eq!(bucket.goal_balance, 25);
}
