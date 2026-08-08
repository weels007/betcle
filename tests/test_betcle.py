"""Direct-mode tests for the Betcle contract.

Covers the settlement / security properties requested in review:
  1. Platform fee is accrued exactly once per prediction, and only when a
     real winning claim is paid out (repeated or invalid claims cannot
     inflate the admin-withdrawable fee balance).
  2. The full lifecycle is enforced on-chain: creation requires a future
     deadline, betting closes after the deadline, and resolution is only
     allowed after the deadline.
  3. An inconclusive settlement has a refund path that returns every
     bettor's full stake.
  4. Funds are conserved across every settlement case (YES win, NO win,
     partial claims, inconclusive refund, no-winning-pool).
  5. Anti-manipulation: the creator (who controls the resolution URL)
     cannot bet on their own prediction; inputs are validated on-chain.
"""

import json
from datetime import datetime, timezone

import pytest

BASE_ISO = "2025-01-01T00:00:00Z"
BASE_TS = int(datetime.fromisoformat(BASE_ISO.replace("Z", "+00:00")).timestamp())
HOUR = 3600
DAY = 24 * HOUR
DEADLINE = BASE_TS + 100 * HOUR  # ~4.2 days later
AFTER_DEADLINE = DEADLINE + HOUR


def iso(ts: int) -> str:
    return datetime.fromtimestamp(ts, timezone.utc).isoformat().replace("+00:00", "Z")


def to_int(v) -> int:
    return int(v)


@pytest.fixture
def vm(direct_vm):
    return direct_vm


@pytest.fixture
def accounts(direct_accounts):
    return direct_accounts


@pytest.fixture
def creator(accounts):
    # Dedicated account that owns created predictions (distinct from bettors).
    return accounts[3]


@pytest.fixture
def contract(vm, direct_deploy):
    vm.warp(BASE_ISO)
    return direct_deploy("contracts/betcle.py")


def register(vm, contract, addr, name):
    vm.sender = addr
    vm.value = 0
    contract.register(name)


def create(vm, contract, creator, deadline=DEADLINE, question="Will it happen?"):
    vm.sender = creator
    vm.value = 0
    return contract.create_prediction(
        question, "crypto", "https://coingecko.com/bitcoin", deadline
    )


def bet(vm, contract, addr, prediction_id, choice, amount):
    vm.sender = addr
    vm.value = amount
    bet_id = contract.place_bet(prediction_id, choice)
    vm.value = 0
    return bet_id


def claim(vm, contract, addr, prediction_id):
    vm.sender = addr
    vm.value = 0
    return contract.claim_rewards(prediction_id)


def refund(vm, contract, addr, prediction_id):
    vm.sender = addr
    vm.value = 0
    return contract.refund_bets(prediction_id)


def settled_balance(vm, contract, addr):
    return to_int(contract.get_user_balance(str(addr)))


def fee_balance(vm, contract):
    return to_int(contract.get_platform_fee_balance())


def resolve_yes(vm, contract, prediction_id):
    vm.value = 0
    vm.mock_web(r"coingecko\.com", {"status": 200, "body": "<html>BTC up</html>"})
    vm.mock_llm(r".*", json.dumps({"analysis": "source says yes", "answer": "yes"}))
    return contract.resolve_prediction(prediction_id)


def resolve_bad_answer(vm, contract, prediction_id):
    vm.value = 0
    vm.mock_web(r"coingecko\.com", {"status": 200, "body": "<html>x</html>"})
    vm.mock_llm(r".*", json.dumps({"analysis": "cannot tell", "answer": "maybe"}))
    return contract.resolve_prediction(prediction_id)


# --------------------------------------------------------------------------
# 1. Fee accrual is one-time and claim-dependent
# --------------------------------------------------------------------------

def test_repeated_invalid_claims_do_not_inflate_fee(vm, contract, accounts, creator):
    alice, bob, charlie = accounts[0], accounts[1], accounts[2]
    register(vm, contract, creator, "creator")
    register(vm, contract, alice, "alice")
    register(vm, contract, bob, "bob")
    register(vm, contract, charlie, "charlie")

    pid = create(vm, contract, creator)
    bet(vm, contract, alice, pid, "yes", 40)
    bet(vm, contract, bob, pid, "yes", 60)
    bet(vm, contract, charlie, pid, "no", 100)

    vm.warp(iso(AFTER_DEADLINE))
    resolve_yes(vm, contract, pid)

    # Loser (charlie) spams claim_rewards: must NOT accrue any fee.
    for _ in range(10):
        assert "no winnings to claim" in claim(vm, contract, charlie, pid)
    assert fee_balance(vm, contract) == 0

    # Alice claims -> fee accrued exactly once.
    result = json.loads(claim(vm, contract, alice, pid))
    assert to_int(result["winnings"]) == (40 * 196) // 100  # 78
    assert fee_balance(vm, contract) == 4

    # Re-claiming after payout must not re-accrue fee or double-pay.
    before = settled_balance(vm, contract, alice)
    for _ in range(10):
        assert "no winnings to claim" in claim(vm, contract, alice, pid)
    assert settled_balance(vm, contract, alice) == before
    assert fee_balance(vm, contract) == 4

    # Bob claims -> no additional fee.
    result = json.loads(claim(vm, contract, bob, pid))
    assert to_int(result["winnings"]) == (60 * 196) // 100  # 117
    assert fee_balance(vm, contract) == 4

    # Conservation: winners + fee + dust == total pool.
    total_paid = settled_balance(vm, contract, alice) + settled_balance(
        vm, contract, bob
    )
    assert total_paid + fee_balance(vm, contract) == 199  # 1 wei dust stays locked
    assert total_paid + fee_balance(vm, contract) <= 200


def test_fee_accrued_once_on_partial_claims(vm, contract, accounts, creator):
    alice, bob = accounts[0], accounts[1]
    register(vm, contract, creator, "creator")
    register(vm, contract, alice, "alice")
    register(vm, contract, bob, "bob")

    pid = create(vm, contract, creator)
    bet(vm, contract, alice, pid, "yes", 40)
    bet(vm, contract, bob, pid, "yes", 60)

    vm.warp(iso(AFTER_DEADLINE))
    resolve_yes(vm, contract, pid)

    # total 100, fee 2, prize 98, winning pool 100
    res_a = json.loads(claim(vm, contract, alice, pid))
    assert to_int(res_a["winnings"]) == (40 * 98) // 100  # 39
    assert fee_balance(vm, contract) == 2

    res_b = json.loads(claim(vm, contract, bob, pid))
    assert to_int(res_b["winnings"]) == (60 * 98) // 100  # 58
    assert fee_balance(vm, contract) == 2  # still exactly once

    total_paid = settled_balance(vm, contract, alice) + settled_balance(
        vm, contract, bob
    )
    assert total_paid + fee_balance(vm, contract) == 99  # 1 wei dust


# --------------------------------------------------------------------------
# 2. Settlement: YES wins — fund conservation
# --------------------------------------------------------------------------

def test_yes_wins_conservation(vm, contract, accounts, creator):
    alice, bob, charlie = accounts[0], accounts[1], accounts[2]
    register(vm, contract, creator, "creator")
    register(vm, contract, alice, "alice")
    register(vm, contract, bob, "bob")
    register(vm, contract, charlie, "charlie")

    pid = create(vm, contract, creator)
    bet(vm, contract, alice, pid, "yes", 100)
    bet(vm, contract, bob, pid, "yes", 200)
    bet(vm, contract, charlie, pid, "no", 300)

    vm.warp(iso(AFTER_DEADLINE))
    resolve_yes(vm, contract, pid)

    # total 600, fee 12, prize 588, winning pool 300
    res_a = json.loads(claim(vm, contract, alice, pid))
    res_b = json.loads(claim(vm, contract, bob, pid))
    assert to_int(res_a["winnings"]) == (100 * 588) // 300  # 196
    assert to_int(res_b["winnings"]) == (200 * 588) // 300  # 392

    total_paid = settled_balance(vm, contract, alice) + settled_balance(
        vm, contract, bob
    )
    assert fee_balance(vm, contract) == 12
    assert total_paid == 588  # exact split, no dust
    assert total_paid + fee_balance(vm, contract) == 600

    # Loser cannot claim.
    assert "no winnings to claim" in claim(vm, contract, charlie, pid)


# --------------------------------------------------------------------------
# 3. Settlement: NO wins — fund conservation
# --------------------------------------------------------------------------

def test_no_wins_conservation(vm, contract, accounts, creator):
    alice, bob, charlie = accounts[0], accounts[1], accounts[2]
    register(vm, contract, creator, "creator")
    register(vm, contract, alice, "alice")
    register(vm, contract, bob, "bob")
    register(vm, contract, charlie, "charlie")

    pid = create(vm, contract, creator)
    bet(vm, contract, alice, pid, "yes", 100)
    bet(vm, contract, bob, pid, "no", 100)
    bet(vm, contract, charlie, pid, "no", 50)

    vm.warp(iso(AFTER_DEADLINE))
    vm.value = 0
    vm.mock_web(r"coingecko\.com", {"status": 200, "body": "<html>x</html>"})
    vm.mock_llm(r".*", json.dumps({"analysis": "source says no", "answer": "no"}))
    result = json.loads(contract.resolve_prediction(pid))
    assert result["result"] == "no"

    # total 250, fee 5, prize 245, winning pool (no) 150
    res_b = json.loads(claim(vm, contract, bob, pid))
    res_c = json.loads(claim(vm, contract, charlie, pid))
    assert to_int(res_b["winnings"]) == (100 * 245) // 150  # 163
    assert to_int(res_c["winnings"]) == (50 * 245) // 150  # 81

    total_paid = settled_balance(vm, contract, bob) + settled_balance(
        vm, contract, charlie
    )
    assert fee_balance(vm, contract) == 5
    assert total_paid == 244  # 1 wei dust
    assert total_paid + fee_balance(vm, contract) <= 250


# --------------------------------------------------------------------------
# 4. Inconclusive: resolution failure -> refund path
# --------------------------------------------------------------------------

def test_inconclusive_refund_path(vm, contract, accounts, creator):
    alice, bob = accounts[0], accounts[1]
    register(vm, contract, creator, "creator")
    register(vm, contract, alice, "alice")
    register(vm, contract, bob, "bob")

    pid = create(vm, contract, creator)
    bet(vm, contract, alice, pid, "yes", 70)
    bet(vm, contract, bob, pid, "no", 30)

    vm.warp(iso(AFTER_DEADLINE))
    result = json.loads(resolve_bad_answer(vm, contract, pid))
    assert result["result"] == "inconclusive"

    # claim_rewards is blocked on inconclusive predictions.
    assert "inconclusive" in claim(vm, contract, alice, pid)

    assert json.loads(refund(vm, contract, alice, pid))["refunded"] == "70"
    assert json.loads(refund(vm, contract, bob, pid))["refunded"] == "30"
    assert fee_balance(vm, contract) == 0
    assert settled_balance(vm, contract, alice) == 70
    assert settled_balance(vm, contract, bob) == 30


def test_fee_not_accrued_on_inconclusive_refund(vm, contract, accounts, creator):
    alice, bob = accounts[0], accounts[1]
    register(vm, contract, creator, "creator")
    register(vm, contract, alice, "alice")
    register(vm, contract, bob, "bob")

    pid = create(vm, contract, creator)
    bet(vm, contract, alice, pid, "yes", 50)
    bet(vm, contract, bob, pid, "no", 50)

    vm.warp(iso(AFTER_DEADLINE))
    result = json.loads(resolve_bad_answer(vm, contract, pid))
    assert result["result"] == "inconclusive"
    assert fee_balance(vm, contract) == 0

    # A user spamming refunds gets blocked after the first successful refund.
    assert json.loads(refund(vm, contract, alice, pid))["refunded"] == "50"
    assert "nothing to refund" in refund(vm, contract, alice, pid)
    assert json.loads(refund(vm, contract, bob, pid))["refunded"] == "50"
    assert fee_balance(vm, contract) == 0
    assert settled_balance(vm, contract, alice) == 50
    assert settled_balance(vm, contract, bob) == 50


# --------------------------------------------------------------------------
# 5. Inconclusive: nobody bet on the winning side -> refund
# --------------------------------------------------------------------------

def test_no_winning_pool_becomes_refundable(vm, contract, accounts, creator):
    alice = accounts[0]
    register(vm, contract, creator, "creator")
    register(vm, contract, alice, "alice")

    pid = create(vm, contract, creator)
    bet(vm, contract, alice, pid, "no", 100)

    vm.warp(iso(AFTER_DEADLINE))
    resolve_yes(vm, contract, pid)  # LLM says yes, but only NO bets exist

    pred = json.loads(contract.get_prediction(pid))
    assert pred["resolved"] is True
    assert pred["result"] == "inconclusive"
    assert pred["status"] == "inconclusive"

    assert json.loads(refund(vm, contract, alice, pid))["refunded"] == "100"
    assert fee_balance(vm, contract) == 0
    assert settled_balance(vm, contract, alice) == 100


# --------------------------------------------------------------------------
# 6. Full lifecycle is enforced on-chain
# --------------------------------------------------------------------------

def test_create_requires_future_deadline(vm, contract, accounts, creator):
    register(vm, contract, creator, "creator")
    with vm.expect_revert("deadline must be in the future"):
        create(vm, contract, creator, deadline=BASE_TS - 10)


def test_betting_closed_after_deadline(vm, contract, accounts, creator):
    alice = accounts[0]
    register(vm, contract, creator, "creator")
    register(vm, contract, alice, "alice")
    pid = create(vm, contract, creator)

    vm.warp(iso(AFTER_DEADLINE))
    with vm.expect_revert("betting is closed"):
        bet(vm, contract, alice, pid, "yes", 10)


def test_resolution_blocked_before_deadline(vm, contract, accounts, creator):
    alice = accounts[0]
    register(vm, contract, creator, "creator")
    register(vm, contract, alice, "alice")
    pid = create(vm, contract, creator)
    bet(vm, contract, alice, pid, "yes", 10)

    # Still before the deadline.
    with vm.expect_revert("deadline has not been reached"):
        vm.value = 0
        contract.resolve_prediction(pid)


def test_resolution_requires_bets(vm, contract, accounts, creator):
    register(vm, contract, creator, "creator")
    pid = create(vm, contract, creator)

    vm.warp(iso(AFTER_DEADLINE))
    with vm.expect_revert("no bets placed"):
        vm.value = 0
        contract.resolve_prediction(pid)


def test_bet_after_deadline_then_resolve(vm, contract, accounts, creator):
    alice, bob = accounts[0], accounts[1]
    register(vm, contract, creator, "creator")
    register(vm, contract, alice, "alice")
    register(vm, contract, bob, "bob")

    pid = create(vm, contract, creator)
    bet(vm, contract, alice, pid, "yes", 100)
    bet(vm, contract, bob, pid, "no", 100)

    vm.warp(iso(AFTER_DEADLINE))
    resolve_yes(vm, contract, pid)

    assert fee_balance(vm, contract) == 0  # nothing claimed yet
    res = json.loads(claim(vm, contract, alice, pid))
    # Alice is the only YES bettor: prize pool 196, winning pool 100.
    assert to_int(res["winnings"]) == (100 * 196) // 100  # 196
    assert fee_balance(vm, contract) == 4


# --------------------------------------------------------------------------
# 7. Claiming is protected against double payout
# --------------------------------------------------------------------------

def test_no_double_claim(vm, contract, accounts, creator):
    alice = accounts[0]
    register(vm, contract, creator, "creator")
    register(vm, contract, alice, "alice")

    pid = create(vm, contract, creator)
    bet(vm, contract, alice, pid, "yes", 100)

    vm.warp(iso(AFTER_DEADLINE))
    resolve_yes(vm, contract, pid)

    res = json.loads(claim(vm, contract, alice, pid))
    assert to_int(res["winnings"]) == 98  # 100 - 2 fee

    assert "no winnings to claim" in claim(vm, contract, alice, pid)
    assert settled_balance(vm, contract, alice) == 98
    assert fee_balance(vm, contract) == 2


# --------------------------------------------------------------------------
# 8. Anti-manipulation: creator cannot bet on own prediction
# --------------------------------------------------------------------------

def test_creator_cannot_bet_own_prediction(vm, contract, accounts, creator):
    alice = accounts[0]
    register(vm, contract, creator, "creator")
    register(vm, contract, alice, "alice")

    pid = create(vm, contract, creator)

    # Creator (controls the resolution URL) must not be able to bet.
    with vm.expect_revert("creator cannot bet on own prediction"):
        bet(vm, contract, creator, pid, "yes", 100)

    # Other users can still bet.
    bet(vm, contract, alice, pid, "yes", 100)
    pred = json.loads(contract.get_prediction(pid))
    assert pred["total_yes"] == "100"


def test_creator_cannot_manipulate_own_market(vm, contract, accounts, creator):
    """The creator cannot extract other bettors' funds through a controlled
    resolution URL: they are locked out of the market they created."""
    alice = accounts[0]
    register(vm, contract, creator, "creator")
    register(vm, contract, alice, "alice")

    pid = create(vm, contract, creator)
    bet(vm, contract, alice, pid, "yes", 100)

    # Creator tries to bet both sides against alice's stake -> blocked.
    with vm.expect_revert("creator cannot bet on own prediction"):
        bet(vm, contract, creator, pid, "no", 100)

    vm.warp(iso(AFTER_DEADLINE))
    resolve_yes(vm, contract, pid)

    # Alice is the only bettor; she gets her full share minus fee.
    res = json.loads(claim(vm, contract, alice, pid))
    assert to_int(res["winnings"]) == 98
    assert settled_balance(vm, contract, creator) == 0


# --------------------------------------------------------------------------
# 9. Input validation
# --------------------------------------------------------------------------

def test_register_rejects_invalid_name(vm, contract, accounts):
    alice = accounts[0]
    with vm.expect_revert("name must be 1-32 characters"):
        vm.sender = alice
        contract.register("")
    with vm.expect_revert("name must be 1-32 characters"):
        vm.sender = alice
        contract.register("x" * 33)


def test_create_rejects_invalid_url(vm, contract, accounts, creator):
    register(vm, contract, creator, "creator")
    with vm.expect_revert("resolution URL must be http(s)"):
        vm.sender = creator
        contract.create_prediction(
            "Q", "crypto", "ftp://example.com", DEADLINE
        )
    with vm.expect_revert("resolution URL must be http(s)"):
        vm.sender = creator
        contract.create_prediction("Q", "crypto", "javascript:alert(1)", DEADLINE)


def test_create_rejects_invalid_category(vm, contract, accounts, creator):
    register(vm, contract, creator, "creator")
    with vm.expect_revert("invalid category"):
        vm.sender = creator
        contract.create_prediction(
            "Q", "not-a-category", "https://example.com", DEADLINE
        )


def test_create_rejects_empty_question(vm, contract, accounts, creator):
    register(vm, contract, creator, "creator")
    with vm.expect_revert("question must be 1-200 characters"):
        vm.sender = creator
        contract.create_prediction(
            "", "crypto", "https://example.com", DEADLINE
        )


def test_create_rejects_deadline_too_far(vm, contract, accounts, creator):
    register(vm, contract, creator, "creator")
    with vm.expect_revert("deadline too far in the future"):
        vm.sender = creator
        contract.create_prediction(
            "Q", "crypto", "https://example.com", BASE_TS + 400 * DAY
        )
