use soroban_sdk::{Address, Env, symbol_short};
use crate::errors::Error;
use crate::storage::{self, ReleaseRequest, ReleaseStatus};

const GRACE_PERIOD_SECS: u64 = 7 * 24 * 3600;

pub fn request_release(
    env: Env,
    receiver: Address,
    bucket_id: u32,
) -> Result<(), Error> {
    if !storage::is_initialized(&env) {
        return Err(Error::NotInitialized);
    }

    receiver.require_auth();

    let bucket = storage::get_bucket(&env, &receiver, bucket_id).ok_or(Error::InvalidBucket)?;

    if !bucket.approval_required {
        return Err(Error::BucketNotTimeAndApproval);
    }

    let current_time = env.ledger().timestamp();
    if current_time < bucket.unlock_date {
        return Err(Error::GoalBucketLocked);
    }

    if let Some(req) = storage::get_release_request(&env, &receiver, bucket_id) {
        if req.status == ReleaseStatus::Pending {
            return Err(Error::ReleaseRequestAlreadyActive);
        }
    }

    let request = ReleaseRequest {
        requested_at: current_time,
        grace_period_ends_at: current_time + GRACE_PERIOD_SECS,
        status: ReleaseStatus::Pending,
    };

    storage::set_release_request(&env, &receiver, bucket_id, &request);

    env.events().publish(
        (symbol_short!("rel_req"), receiver.clone()),
        (bucket_id, bucket.sender),
    );

    Ok(())
}

pub fn approve_release(
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

    if !bucket.approval_required {
        return Err(Error::BucketNotTimeAndApproval);
    }

    if bucket.sender != sender {
        return Err(Error::NotBucketSender);
    }

    let mut req = storage::get_release_request(&env, &receiver, bucket_id).ok_or(Error::NoActiveReleaseRequest)?;

    if req.status != ReleaseStatus::Pending {
        return Err(Error::NoActiveReleaseRequest);
    }

    req.status = ReleaseStatus::Approved;
    storage::set_release_request(&env, &receiver, bucket_id, &req);

    env.events().publish(
        (symbol_short!("rel_app"), sender),
        (bucket_id, receiver),
    );

    Ok(())
}

pub fn can_withdraw_goal(env: &Env, bucket: &storage::BucketState, receiver: &Address, bucket_id: u32) -> Result<bool, Error> {
    let current_time = env.ledger().timestamp();
    if current_time < bucket.unlock_date {
        return Err(Error::GoalBucketLocked);
    }

    if !bucket.approval_required {
        return Ok(true);
    }

    let req = storage::get_release_request(env, receiver, bucket_id).ok_or(Error::NoActiveReleaseRequest)?;

    match req.status {
        ReleaseStatus::Approved => Ok(true),
        ReleaseStatus::Pending => {
            if current_time >= req.grace_period_ends_at {
                Ok(true)
            } else {
                Err(Error::ReleaseNotApproved)
            }
        },
        ReleaseStatus::Executed => Err(Error::NoActiveReleaseRequest),
    }
}

pub fn get_release_request(
    env: Env,
    receiver: Address,
    bucket_id: u32,
) -> Option<ReleaseRequest> {
    storage::get_release_request(&env, &receiver, bucket_id)
}