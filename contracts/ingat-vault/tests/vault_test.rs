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
    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    // Register a mock token (Stellar Asset Contract)
    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
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

    let buckets = client.get_buckets(&receiver);
    assert_eq!(buckets.len(), 1);
    let bucket = buckets.get(0).unwrap();
    assert_eq!(bucket.id, 0);
    assert_eq!(bucket.sender, sender);
    assert_eq!(bucket.spending_balance, 60);
    assert_eq!(bucket.goal_balance, 40);
    assert_eq!(bucket.unlock_date, unlock_date);

    // Deposit another 200 tokens with 50% spending split, unlocking in 2000 seconds
    token_admin_client.mint(&sender, &200);
    let unlock_date_2 = current_time + 2000;
    client.deposit(&sender, &receiver, &200, &50, &unlock_date_2);

    let buckets = client.get_buckets(&receiver);
    assert_eq!(buckets.len(), 2);
    
    let bucket2 = buckets.get(1).unwrap();
    assert_eq!(bucket2.id, 1);
    assert_eq!(bucket2.sender, sender);
    assert_eq!(bucket2.spending_balance, 100);
    assert_eq!(bucket2.goal_balance, 100);
    assert_eq!(bucket2.unlock_date, unlock_date_2);

    // Withdraw 20 from spending bucket 0 (should succeed)
    client.withdraw_spending(&receiver, &0, &20);
    assert_eq!(token_client.balance(&receiver), 20);
    
    let buckets = client.get_buckets(&receiver);
    let bucket = buckets.get(0).unwrap();
    assert_eq!(bucket.spending_balance, 40);

    // Attempt to withdraw 10 from goal bucket 0 before unlock date (should fail)
    let res = client.try_withdraw_goal(&receiver, &0, &10);
    assert!(res.is_err());

    // Advance ledger time past unlock date 0
    env.ledger().set_timestamp(unlock_date + 1);

    // Withdraw 15 from goal bucket 0 (should succeed now)
    client.withdraw_goal(&receiver, &0, &15);
    assert_eq!(token_client.balance(&receiver), 35); // 20 spending + 15 goal

    let buckets = client.get_buckets(&receiver);
    let bucket = buckets.get(0).unwrap();
    assert_eq!(bucket.goal_balance, 25);
}

#[test]
fn test_sender_cannot_withdraw_spending() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    client.deposit(&sender, &receiver, &100, &50, &11000);

    let res = client.try_withdraw_spending(&sender, &0, &10);
    assert!(res.is_err());
}

#[test]
fn test_sender_cannot_withdraw_goal_before_unlock() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    client.deposit(&sender, &receiver, &100, &50, &11000);

    let res = client.try_withdraw_goal(&sender, &0, &10);
    assert!(res.is_err());
}

#[test]
fn test_sender_cannot_withdraw_goal_after_unlock() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    client.deposit(&sender, &receiver, &100, &50, &11000);

    env.ledger().set_timestamp(11001);

    let res = client.try_withdraw_goal(&sender, &0, &10);
    assert!(res.is_err());
}

#[test]
fn test_goal_withdrawal_1s_before_unlock_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender, &receiver, &100, &50, &11000);

    env.ledger().set_timestamp(10999);
    let res = client.try_withdraw_goal(&receiver, &0, &10);
    assert!(res.is_err());
}

#[test]
fn test_goal_withdrawal_at_exact_unlock_succeeds() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender, &receiver, &100, &50, &11000);

    env.ledger().set_timestamp(11000);
    client.withdraw_goal(&receiver, &0, &10);
    assert_eq!(token_client.balance(&receiver), 10);
}

#[test]
fn test_sender_withdraw_goal_after_unlock() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender, &receiver, &100, &50, &11000);

    env.ledger().set_timestamp(11000);
    client.withdraw_goal_sender(&sender, &receiver, &0, &10);
    assert_eq!(token_client.balance(&sender), 910);
}

#[test]
fn test_sender_withdraw_goal_before_unlock_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender, &receiver, &100, &50, &11000);

    env.ledger().set_timestamp(10999);
    let res = client.try_withdraw_goal_sender(&sender, &receiver, &0, &10);
    assert!(res.is_err());
}

#[test]
fn test_sender_withdraw_wrong_bucket_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender_a = Address::generate(&env);
    let sender_b = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender_a, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender_a, &receiver, &100, &50, &11000);

    env.ledger().set_timestamp(11000);
    let res = client.try_withdraw_goal_sender(&sender_b, &receiver, &0, &10);
    assert!(res.is_err());
}

#[test]
fn test_double_initialization_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();

    client.initialize(&token_address);
    let res = client.try_initialize(&token_address);
    assert!(res.is_err());
}

#[test]
fn test_partial_spending_withdrawal() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    client.deposit(&sender, &receiver, &100, &60, &11000);

    client.withdraw_spending(&receiver, &0, &20);
    assert_eq!(token_client.balance(&receiver), 20);

    let buckets = client.get_buckets(&receiver);
    let bucket = buckets.get(0).unwrap();
    assert_eq!(bucket.spending_balance, 40);
}

#[test]
fn test_partial_goal_withdrawal() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    client.deposit(&sender, &receiver, &100, &60, &11000);

    env.ledger().set_timestamp(11000);

    client.withdraw_goal(&receiver, &0, &15);
    assert_eq!(token_client.balance(&receiver), 15);

    let buckets = client.get_buckets(&receiver);
    let bucket = buckets.get(0).unwrap();
    assert_eq!(bucket.goal_balance, 25);
}

#[test]
fn test_emergency_request_happy_path() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender, &receiver, &100, &50, &20000); // 50 spend, 50 goal

    // Request emergency withdrawal of 30 from goal bucket
    client.request_emergency_withdrawal(&receiver, &0, &30);

    let req = client.get_emergency_request(&receiver, &0).unwrap();
    assert_eq!(req.amount, 30);
    assert_eq!(req.requested_at, 10000);
    assert_eq!(req.cooldown_ends_at, 10000 + 172800);
    assert_eq!(req.status, ingat_vault::storage::EmergencyStatus::Pending);

    // Fast-forward to exactly cooldown end time (182800)
    env.ledger().set_timestamp(10000 + 172800);

    client.execute_emergency_withdrawal(&receiver, &0);

    assert_eq!(token_client.balance(&receiver), 30);
    
    let buckets = client.get_buckets(&receiver);
    let bucket = buckets.get(0).unwrap();
    assert_eq!(bucket.goal_balance, 20); // 50 - 30 = 20

    let req = client.get_emergency_request(&receiver, &0).unwrap();
    assert_eq!(req.status, ingat_vault::storage::EmergencyStatus::Executed);
}

#[test]
fn test_emergency_execute_before_cooldown_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender, &receiver, &100, &50, &20000);

    client.request_emergency_withdrawal(&receiver, &0, &30);

    // Fast-forward 1s short of cooldown ends
    env.ledger().set_timestamp(10000 + 172800 - 1);
    let res = client.try_execute_emergency_withdrawal(&receiver, &0);
    assert!(res.is_err());
}

#[test]
fn test_emergency_sender_cancel() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender, &receiver, &100, &50, &20000);

    client.request_emergency_withdrawal(&receiver, &0, &30);

    // Sender cancels request before cooldown expires
    client.cancel_emergency_withdrawal(&sender, &receiver, &0);

    let req = client.get_emergency_request(&receiver, &0).unwrap();
    assert_eq!(req.status, ingat_vault::storage::EmergencyStatus::Cancelled);
    assert_eq!(req.last_cancel_at, 10000);

    // Execute should now fail
    env.ledger().set_timestamp(10000 + 172800 + 1);
    let res = client.try_execute_emergency_withdrawal(&receiver, &0);
    assert!(res.is_err());
}

#[test]
fn test_emergency_receiver_cancel() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender, &receiver, &100, &50, &20000);

    client.request_emergency_withdrawal(&receiver, &0, &30);

    // Receiver cancels their own request
    client.cancel_emergency_receiver(&receiver, &0);

    let req = client.get_emergency_request(&receiver, &0).unwrap();
    assert_eq!(req.status, ingat_vault::storage::EmergencyStatus::Cancelled);
    assert_eq!(req.last_cancel_at, 0); // resets

    // Execute fails
    env.ledger().set_timestamp(10000 + 172800 + 1);
    let res = client.try_execute_emergency_withdrawal(&receiver, &0);
    assert!(res.is_err());
}

#[test]
fn test_emergency_re_request_throttle() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender, &receiver, &100, &50, &20000);

    client.request_emergency_withdrawal(&receiver, &0, &30);
    client.cancel_emergency_withdrawal(&sender, &receiver, &0);

    // Immediate re-request should fail
    let res = client.try_request_emergency_withdrawal(&receiver, &0, &30);
    assert!(res.is_err());

    // Re-request after 59 mins should fail
    env.ledger().set_timestamp(10000 + 3599);
    let res = client.try_request_emergency_withdrawal(&receiver, &0, &30);
    assert!(res.is_err());

    // Re-request after 60 mins should succeed
    env.ledger().set_timestamp(10000 + 3600);
    let res = client.try_request_emergency_withdrawal(&receiver, &0, &30);
    assert!(res.is_ok());
}

#[test]
fn test_emergency_double_request_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender, &receiver, &100, &50, &20000);

    client.request_emergency_withdrawal(&receiver, &0, &10);
    let res = client.try_request_emergency_withdrawal(&receiver, &0, &10);
    assert!(res.is_err());
}

#[test]
fn test_emergency_excess_amount_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender, &receiver, &100, &50, &20000); // 50 spend, 50 goal

    // Request emergency withdrawal of 51 (exceeds 50 goal balance)
    let res = client.try_request_emergency_withdrawal(&receiver, &0, &51);
    assert!(res.is_err());
}

#[test]
fn test_natural_unlock_supersedes_pending_request() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender, &receiver, &100, &50, &15000); // unlock at 15000

    client.request_emergency_withdrawal(&receiver, &0, &30);

    // Fast-forward past unlock date (15000) but before emergency cooldown (10000 + 172800)
    env.ledger().set_timestamp(15001);

    // Receiver should be able to withdraw normally from goal
    client.withdraw_goal(&receiver, &0, &40);
    assert_eq!(token_client.balance(&receiver), 40);
}

#[test]
fn test_third_party_cannot_cancel() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(IngatVault, ());
    let client = IngatVaultClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    client.initialize(&token_address);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let third_party = Address::generate(&env);

    token_admin_client.mint(&sender, &1000);
    env.ledger().set_timestamp(10000);
    client.deposit(&sender, &receiver, &100, &50, &20000);

    client.request_emergency_withdrawal(&receiver, &0, &30);

    // Third party tries to cancel
    let res = client.try_cancel_emergency_withdrawal(&third_party, &receiver, &0);
    assert!(res.is_err());
}

